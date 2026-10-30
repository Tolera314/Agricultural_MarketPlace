import type { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service.js';
import { ValidationError, AuthenticationError } from '../utils/errors.js';

function paramId(req: Request): string {
  const raw = req.params.id;
  if (Array.isArray(raw)) return raw[0] || '';
  return raw || '';
}

export async function startOrGetConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AuthenticationError('Authentication required. Please sign in to message farmers.');
    }

    const { farmerId, initialMessage } = req.body;
    if (!farmerId || typeof farmerId !== 'string') {
      throw new ValidationError('Farmer identifier is required to start a conversation.', 'farmerId');
    }

    const conversation = await MessageService.startOrGetConversation(userId, farmerId, initialMessage);
    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AuthenticationError('Authentication required.');
    }

    const conversations = await MessageService.getConversations(userId);
    return res.json({
      success: true,
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversationMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    const role = req.auth?.role || '';
    if (!userId) {
      throw new AuthenticationError('Authentication required.');
    }

    const id = paramId(req);
    if (!id) {
      throw new ValidationError('Conversation ID is required.', 'id');
    }

    const data = await MessageService.getConversationMessages(id, userId, role);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AuthenticationError('Authentication required.');
    }

    const id = paramId(req);
    const { content } = req.body;

    if (!id) {
      throw new ValidationError('Conversation ID is required.', 'id');
    }

    const message = await MessageService.sendMessage(id, userId, content);
    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AuthenticationError('Authentication required.');
    }

    const id = paramId(req);
    if (!id) {
      throw new ValidationError('Conversation ID is required.', 'id');
    }

    const result = await MessageService.markAsRead(id, userId);
    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
