import express from "express";
import { register, login, list } from "../controllers/authController.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/list", list);

export default router;