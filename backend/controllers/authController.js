import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Bhai, user pehle se hai!" });

    await User.create({ name, email, password });
    res.status(201).json({ success: true, message: "Registration Done!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => { 
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      
      user.refreshToken = refreshToken;
      await user.save(); 

      return res.json({ 
        success: true, 
        accessToken, 
        refreshToken, 
        user: { id: user._id, name: user.name } 
      });
    } else {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const list = async (req,res) => {
  try {
    const users = await User.find({}, "name _id"); // Sirf name aur id mangwao
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Users fetch error" });
  }
}