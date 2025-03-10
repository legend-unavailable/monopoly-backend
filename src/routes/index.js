import { Router } from "express";
import signupRouter from './signup.js'
import loginRouter from './login.js'
import lobbyRouter from './lobby.js'

const router = Router();
router.use(signupRouter);
router.use(loginRouter);
router.use(lobbyRouter);

export default router;