import mongoose from "mongoose";

const schema = new mongoose.Schema({
  razorpay_order_id: {
    type: String,
    required: true,
  },
  razorpay_payment_id: {
    type: String,
    required: true,
  },
  razorpay_signature: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Payment = mongoose.model("Payment", schema);


// import mongoose from "mongoose";

// const schema = new mongoose.Schema({
//   orderID: {
//     type: String,
//     required: true,
//   },
//   payerID: {
//     type: String,
//     required: true,
//   },
//   captureID: {
//     type: String,
//     required: true,
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// export const Payment = mongoose.model("Payment", schema);
