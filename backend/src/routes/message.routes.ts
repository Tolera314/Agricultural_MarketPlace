import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  startOrGetConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
} from '../controllers/message.controller.js';

const router = Router();

// Protect ALL messaging routes with authentication
router.use(requireAuth);

router.post('/conversations', startOrGetConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationMessages);
router.post('/conversations/:id/messages', sendMessage);
router.patch('/conversations/:id/read', markAsRead);

export default router;

