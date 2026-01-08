import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import * as chatCtrl from '../controllers/chatController';

const router = Router();

// Chat room management
router.post('/rooms', verifyToken, chatCtrl.createChatRoom);
router.get('/rooms', verifyToken, chatCtrl.getChats);
router.get('/rooms/:chatRoomId', verifyToken, chatCtrl.getChatRoom);

// Messages
router.post('/messages', verifyToken, chatCtrl.sendMessage);
router.get('/rooms/:chatRoomId/messages', verifyToken, chatCtrl.getMessages);
router.put('/messages/:messageId', verifyToken, chatCtrl.editMessage);
router.delete('/messages/:messageId', verifyToken, chatCtrl.deleteMessage);
router.post('/rooms/:chatRoomId/read', verifyToken, chatCtrl.markAsRead);

// Reactions
router.post('/messages/:messageId/reactions', verifyToken, chatCtrl.addReaction);
router.delete('/messages/:messageId/reactions', verifyToken, chatCtrl.removeReaction);

// Unread count
router.get('/unread-count', verifyToken, chatCtrl.getUnreadCount);

export default router;