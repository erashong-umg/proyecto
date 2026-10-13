import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { getChatThreads, getThreadMessages } from '@controllers/chat.controller';

const router = Router();
router.use(authMiddleware);

router.get('/threads', getChatThreads);
router.get('/threads/:threadId/messages', getThreadMessages);

export default router;
