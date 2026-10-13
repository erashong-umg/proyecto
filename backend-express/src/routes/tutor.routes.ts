import { Router } from 'express';
import { searchTutorsController, getTutorPublicProfile } from '@controllers/tutor.controller';

const router = Router();

router.get('/search', searchTutorsController);
router.get('/:id', getTutorPublicProfile);

export default router;
