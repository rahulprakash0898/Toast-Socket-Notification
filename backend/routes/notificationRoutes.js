import express from "express";
import {  getNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/:userId", getNotifications);

export default router;