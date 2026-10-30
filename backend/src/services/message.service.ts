import prisma from '../config/prisma.js';
import { ValidationError, NotFoundError, ForbiddenError, BusinessRuleError } from '../utils/errors.js';

export interface ParticipantInfo {
  id: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  farmName?: string | null;
  role: string;
  isVerified?: boolean;
}

export class MessageService {
  /**
   * Resolves a target farmer ID (handles either User.id or FarmerProfile.id)
   */
  private static async resolveFarmerUserId(targetId: string): Promise<string> {
    // 1. Direct user check
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      include: { farmerProfile: true },
    });
    if (user && (user.role === 'FARMER' || user.farmerProfile)) {
      return user.id;
    }

    // 2. Farmer profile ID check
    const profile = await prisma.farmerProfile.findUnique({
      where: { id: targetId },
    });
    if (profile) {
      return profile.userId;
    }

    throw new NotFoundError('Farmer account', 'NOT_FOUND', 'farmerId');
  }

  /**
   * Starts a new conversation or retrieves the existing one between a Buyer and a Farmer
   */
  static async startOrGetConversation(buyerId: string, farmerIdentifier: string, initialMessage?: string) {
    if (buyerId === farmerIdentifier) {
      throw new BusinessRuleError('You cannot initiate a conversation with yourself.', 'SELF_MESSAGING_DISALLOWED', 'target');
    }

    const farmerId = await this.resolveFarmerUserId(farmerIdentifier);

    if (buyerId === farmerId) {
      throw new BusinessRuleError('You cannot initiate a conversation with yourself.', 'SELF_MESSAGING_DISALLOWED', 'target');
    }

    // Verify buyer exists
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      include: { userProfile: true },
    });
    if (!buyer) {
      throw new NotFoundError('User account', 'NOT_FOUND', 'auth');
    }

    // Look for existing conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        buyerId_farmerId: {
          buyerId,
          farmerId,
        },
      },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
          },
        },
        farmer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
            farmerProfile: { select: { id: true, farmName: true, verificationStatus: true } },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          buyerId,
          farmerId,
          lastMessageText: initialMessage ? initialMessage.trim().slice(0, 100) : null,
          lastMessageAt: new Date(),
        },
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              role: true,
              userProfile: { select: { avatarUrl: true } },
            },
          },
          farmer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              role: true,
              userProfile: { select: { avatarUrl: true } },
              farmerProfile: { select: { id: true, farmName: true, verificationStatus: true } },
            },
          },
        },
      });
    }

    // If an initial message was supplied, persist it
    if (initialMessage && initialMessage.trim().length > 0) {
      const trimmed = initialMessage.trim().slice(0, 2000);
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: buyerId,
          content: trimmed,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageText: trimmed.slice(0, 100),
          lastMessageAt: new Date(),
        },
      });

      // Notify farmer
      await prisma.notification.create({
        data: {
          userId: farmerId,
          title: `New message from ${buyer.fullName}`,
          message: trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed,
          type: 'DIRECT_MESSAGE',
          channel: 'IN_APP',
          metadata: { conversationId: conversation.id, buyerId },
        },
      }).catch((err) => console.warn('[Message Notification Error]', err));
    }

    return conversation;
  }

  /**
   * Retrieves all conversations for the authenticated user (Buyer or Farmer)
   */
  static async getConversations(userId: string) {
    const rawConversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { farmerId: userId }],
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
          },
        },
        farmer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
            farmerProfile: { select: { id: true, farmName: true, verificationStatus: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        },
      },
    });

    // Compute unread counts and map clean partner view
    const formatted = await Promise.all(
      rawConversations.map(async (c) => {
        const isBuyer = c.buyerId === userId;
        const partner = isBuyer ? c.farmer : c.buyer;
        const partnerFarmName = isBuyer ? c.farmer.farmerProfile?.farmName || c.farmer.fullName : undefined;

        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return {
          id: c.id,
          buyerId: c.buyerId,
          farmerId: c.farmerId,
          partnerId: partner.id,
          partnerName: partner.fullName,
          partnerRole: partner.role,
          partnerPhone: partner.phone,
          partnerAvatarUrl: partner.userProfile?.avatarUrl || null,
          partnerFarmName,
          partnerVerificationStatus: isBuyer ? c.farmer.farmerProfile?.verificationStatus : undefined,
          lastMessageText: c.lastMessageText || (c.messages[0]?.content ?? null),
          lastMessageAt: c.lastMessageAt || c.messages[0]?.createdAt || c.createdAt,
          unreadCount,
        };
      })
    );

    return formatted;
  }

  /**
   * Retrieves conversation details and message history
   */
  static async getConversationMessages(conversationId: string, userId: string, role: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
          },
        },
        farmer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
            farmerProfile: { select: { id: true, farmName: true, verificationStatus: true } },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation', 'NOT_FOUND', 'conversationId');
    }

    // Role-based authorization
    const isParticipant = conversation.buyerId === userId || conversation.farmerId === userId;
    const isSuperOrAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

    if (!isParticipant && !isSuperOrAdmin) {
      throw new ForbiddenError('You do not have permission to view this conversation.');
    }

    // Fetch messages (oldest to newest)
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    // Auto mark partner's messages as read if opened by participant
    if (isParticipant) {
      await prisma.chatMessage.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    const isBuyer = conversation.buyerId === userId;
    const partner = isBuyer ? conversation.farmer : conversation.buyer;

    return {
      conversation: {
        id: conversation.id,
        buyerId: conversation.buyerId,
        farmerId: conversation.farmerId,
        partnerId: partner.id,
        partnerName: partner.fullName,
        partnerPhone: partner.phone,
        partnerAvatarUrl: partner.userProfile?.avatarUrl || null,
        partnerFarmName: isBuyer ? conversation.farmer.farmerProfile?.farmName : undefined,
        partnerVerificationStatus: isBuyer ? conversation.farmer.farmerProfile?.verificationStatus : undefined,
        createdAt: conversation.createdAt,
      },
      messages,
    };
  }

  /**
   * Sends a message within a conversation
   */
  static async sendMessage(conversationId: string, senderId: string, content: string) {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ValidationError('Message content cannot be empty.', 'content');
    }

    const trimmed = content.trim();
    if (trimmed.length > 2000) {
      throw new ValidationError('Message content exceeds the 2,000 character limit.', 'content');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation', 'NOT_FOUND', 'conversationId');
    }

    if (conversation.buyerId !== senderId && conversation.farmerId !== senderId) {
      throw new ForbiddenError('You are not authorized to send messages in this conversation.');
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        content: trimmed,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            userProfile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: trimmed.slice(0, 100),
        lastMessageAt: new Date(),
      },
    });

    // Notify recipient
    const recipientId = conversation.buyerId === senderId ? conversation.farmerId : conversation.buyerId;
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: `New message from ${message.sender.fullName}`,
        message: trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed,
        type: 'DIRECT_MESSAGE',
        channel: 'IN_APP',
        metadata: { conversationId, senderId },
      },
    }).catch((err) => console.warn('[Message Notification Error]', err));

    return message;
  }

  /**
   * Marks unread messages in a conversation as read
   */
  static async markAsRead(conversationId: string, userId: string) {
    const updated = await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { readCount: updated.count };
  }
}

