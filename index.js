import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./database/db.js";
import Razorpay from "razorpay";
import cors from "cors";

dotenv.config();

export const instance = new Razorpay({
  key_id: process.env.Razorpay_Key,
  key_secret: process.env.Razorpay_secret,
});

const app = express();

// using middlewares
app.use(express.json());
app.use(cors());

const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.use("/uploads", express.static("uploads"));

// importing routes
import userRoutes from "./routes/user.js";
import courseRoutes from "./routes/course.js";
import adminRoutes from "./routes/admin.js";

// using routes
app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", adminRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  connectDb();
});

// import express from "express";
// import dotenv from "dotenv";
// import { connectDb } from "./database/db.js";
// import cors from "cors";
// import paypal from '@paypal/checkout-server-sdk';  // PayPal SDK

// dotenv.config();

// const app = express();

// // PayPal client setup
// const clientId = process.env.PAYPAL_CLIENT_ID;
// const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
// const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
// const client = new paypal.core.PayPalHttpClient(environment);

// export { client };  // Export PayPal client

// // Middleware
// app.use(express.json());
// app.use(cors());

// const port = process.env.PORT || 5000;

// // Routes
// import userRoutes from "./routes/user.js";
// import courseRoutes from "./routes/course.js";
// import adminRoutes from "./routes/admin.js";

// // Use routes
// app.use("/api", userRoutes);
// app.use("/api", courseRoutes);
// app.use("/api", adminRoutes);

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
//   connectDb();
// });
