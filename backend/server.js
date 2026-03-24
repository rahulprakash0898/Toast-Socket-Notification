import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import Notification from "./models/notificationModel.js";
import cors from "cors";
import User from "./models/userModel.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.use((socket, next) => {
  const token = socket.handshake.auth.token; 
  if (!token) return next(new Error("Auth Error: Token Not Found"));

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.userId = decoded.id; 
    next();
  } catch (err) {
    next(new Error("Auth Error: Invalid Token"));
  }
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.userId);

  socket.join(socket.userId);

  socket.on("send_notification", async (data) => {
    try {
      const { receiverId, message } = data;
      
      const senderId = socket.userId; 
      const senderUser = await User.findById(senderId);

    if (!senderUser) {
      return console.log("Sender User Not Found");
    }

      const newNotif = await Notification.create({
        message,
        receiver: receiverId,
        sender: senderId
      });

      io.to(receiverId).emit("new_notification", {
        fromName: senderUser.name,           
        message: message,
        notifId: newNotif._id
      });

    } catch (err) {
    }
  });

  socket.on("disconnect", () => console.log("Disconnected"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is Running on ${PORT}`));