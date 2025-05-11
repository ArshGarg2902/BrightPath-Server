import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// isAuth function (default export)
const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const decodedData = jwt.verify(token, process.env.Jwt_Sec);

    req.user = await User.findById(decodedData._id);

    next();
  } catch (error) {
    res.status(500).json({
      message: "Login First",
    });
  }
};

// isAdmin function (still named export, or you can choose to export it as default too if needed)
const isAdmin = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not admin",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Default export for isAuth function
export default isAuth;
