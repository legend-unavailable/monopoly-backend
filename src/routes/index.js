import { Router } from "express";
import signupRouter from './signup.js'
import loginRouter from './login.js'
import lobbyRouter from './lobby.js'
import roomsRouter from './rooms.js'

const router = Router();
router.use(signupRouter);
router.use(loginRouter);
router.use(lobbyRouter);
router.use(roomsRouter);

export default router;