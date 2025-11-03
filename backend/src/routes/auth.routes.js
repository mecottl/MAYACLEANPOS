// src/routes/auth.routes.js
import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { verificarToken } from '../middleware/verificarToken.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/profile', verificarToken, getProfile);

export default router;