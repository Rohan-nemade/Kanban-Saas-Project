import { Router } from 'express';
import { register, login, getMe } from './controllers.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe); // Note: we'll need an auth middleware here later

export default router;