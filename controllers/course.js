import { instance } from "../index.js";
import TryCatch from "../midddlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import crypto from "crypto";
import { Payment } from "../models/Payment.js";
import { Progress } from "../models/Progress.js";

export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.json({
    courses,
  });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  res.json({
    course,
  });
});

export const fetchLectures = TryCatch(async (req, res) => {
  const lectures = await Lecture.find({ course: req.params.id });

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lectures });
  }

  if (!user.subscription.includes(req.params.id))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lectures });
});

export const fetchLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lecture });
  }

  if (!user.subscription.includes(lecture.course))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lecture });
});

export const getMyCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find({ _id: req.user.subscription });

  res.json({
    courses,
  });
});


export const checkout = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  const course = await Courses.findById(req.params.id);

  console.log("User:", user);
  console.log("Course:", course);

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  if (user.subscription.includes(course._id)) {
    return res.status(400).json({
      message: "You already have this course",
    });
  }

  // 👉 If course is free, skip Razorpay and return dummy order
  if (course.price === 0) {
    return res.status(200).json({
      order: {
        id: "FREE_ORDER",
        amount: 0,
      },
      course,
    });
  }

  const options = {
    amount: Number(course.price * 100), // in paise
    currency: "INR",
  };

  const order = await instance.orders.create(options);
  res.status(201).json({ order, course });
});

export const paymentVerification = TryCatch(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const isFreeOrder =
    razorpay_order_id === "FREE_ORDER" &&
    razorpay_payment_id === "FREE_PAYMENT" &&
    razorpay_signature === "FREE_SIGNATURE";

  let isAuthentic = false;

  if (isFreeOrder) {
    isAuthentic = true;
  } else {
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.Razorpay_Secret)
      .update(body)
      .digest("hex");

    isAuthentic = expectedSignature === razorpay_signature;
  }

  if (isAuthentic) {
    // Optional: Skip creating Payment record for free course
    if (!isFreeOrder) {
      await Payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
    }

    const user = await User.findById(req.user._id);
    const course = await Courses.findById(req.params.id);

    if (!user || !course) {
      return res.status(404).json({ message: "User or Course not found" });
    }

    if (!user.subscription.includes(course._id)) {
      user.subscription.push(course._id);

      await Progress.create({
        course: course._id,
        completedLectures: [],
        user: req.user._id,
      });

      await user.save();
    }

    return res.status(200).json({
      message: isFreeOrder ? "Enrolled in free course" : "Course purchased successfully",
    });
  } else {
    return res.status(400).json({
      message: "Payment verification failed",
    });
  }
});


export const addProgress = TryCatch(async (req, res) => {
  const progress = await Progress.findOne({
    user: req.user._id,
    course: req.query.course,
  });

  const { lectureId } = req.query;

  if (progress.completedLectures.includes(lectureId)) {
    return res.json({
      message: "Progress recorded",
    });
  }

  progress.completedLectures.push(lectureId);

  await progress.save();

  res.status(201).json({
    message: "new Progress added",
  });
});

export const getYourProgress = TryCatch(async (req, res) => {
  const progress = await Progress.find({
    user: req.user._id,
    course: req.query.course,
  });

  if (!progress) return res.status(404).json({ message: "null" });

  const allLectures = (await Lecture.find({ course: req.query.course })).length;

  const completedLectures = progress[0].completedLectures.length;

  const courseProgressPercentage = (completedLectures * 100) / allLectures;

  res.json({
    courseProgressPercentage,
    completedLectures,
    allLectures,
    progress,
  });
});

// import { client } from "../index.js";  // PayPal client import
// import { Courses } from "../models/Courses.js";
// import { User } from "../models/User.js";
// import { Payment } from "../models/Payment.js";
// import { Progress } from "../models/Progress.js";
// import TryCatch from "../midddlewares/TryCatch.js";

// export const checkout = TryCatch(async (req, res) => {
//   const user = await User.findById(req.user._id);
//   const course = await Courses.findById(req.params.id);

//   if (user.subscription.includes(course._id)) {
//     return res.status(400).json({
//       message: "You already have this course",
//     });
//   }

//   // Create PayPal Order
//   const request = new paypal.orders.OrdersCreateRequest();
//   request.prefer("return=representation");
//   request.requestBody({
//     intent: "CAPTURE",
//     purchase_units: [
//       {
//         amount: {
//           currency_code: "USD", // You can change this to your required currency
//           value: course.price.toString(),
//         },
//         description: `Payment for course: ${course.title}`,
//       },
//     ],
//   });

//   try {
//     const order = await client.execute(request);

//     // Return the order ID to the frontend to be used for approval
//     res.status(201).json({
//       orderID: order.result.id,
//       course,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error while creating PayPal order",
//       error: error.response,
//     });
//   }
// });


// export const getAllCourses = TryCatch(async (req, res) => {
//   const courses = await Courses.find();
//   res.json({
//     courses,
//   });
// });

// export const getSingleCourse = TryCatch(async (req, res) => {
//   const course = await Courses.findById(req.params.id);

//   res.json({
//     course,
//   });
// });

// export const fetchLectures = TryCatch(async (req, res) => {
//   const lectures = await Lecture.find({ course: req.params.id });

//   const user = await User.findById(req.user._id);

//   if (user.role === "admin") {
//     return res.json({ lectures });
//   }

//   if (!user.subscription.includes(req.params.id))
//     return res.status(400).json({
//       message: "You have not subscribed to this course",
//     });

//   res.json({ lectures });
// });

// export const fetchLecture = TryCatch(async (req, res) => {
//   const lecture = await Lecture.findById(req.params.id);

//   const user = await User.findById(req.user._id);

//   if (user.role === "admin") {
//     return res.json({ lecture });
//   }

//   if (!user.subscription.includes(lecture.course))
//     return res.status(400).json({
//       message: "You have not subscribed to this course",
//     });

//   res.json({ lecture });
// });

// export const getMyCourses = TryCatch(async (req, res) => {
//   const courses = await Courses.find({ _id: req.user.subscription });

//   res.json({
//     courses,
//   });
// });

// export const paymentVerification = TryCatch(async (req, res) => {
//   const { orderID, payerID } = req.body;

//   // Capture payment
//   const request = new paypal.orders.OrdersCaptureRequest(orderID);
//   request.requestBody({});

//   try {
//     const capture = await client.execute(request);

//     if (capture.status === "COMPLETED") {
//       // Payment successful, update subscription
//       const user = await User.findById(req.user._id);
//       const course = await Courses.findById(req.params.id);

//       user.subscription.push(course._id);

//       // Create progress for the course
//       await Progress.create({
//         course: course._id,
//         completedLectures: [],
//         user: req.user._id,
//       });

//       await user.save();

//       // Store payment details
//       await Payment.create({
//         orderID,
//         payerID,
//         captureID: capture.id,
//       });

//       res.status(200).json({
//         message: "Course Purchased Successfully",
//       });
//     } else {
//       return res.status(400).json({
//         message: "Payment verification failed",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({
//       message: "Error during PayPal payment verification",
//       error: error.response,
//     });
//   }
// });


// export const addProgress = TryCatch(async (req, res) => {
//   const progress = await Progress.findOne({
//     user: req.user._id,
//     course: req.query.course,
//   });

//   const { lectureId } = req.query;

//   if (progress.completedLectures.includes(lectureId)) {
//     return res.json({
//       message: "Progress recorded",
//     });
//   }

//   progress.completedLectures.push(lectureId);

//   await progress.save();

//   res.status(201).json({
//     message: "new Progress added",
//   });
// });

// export const getYourProgress = TryCatch(async (req, res) => {
//   const progress = await Progress.find({
//     user: req.user._id,
//     course: req.query.course,
//   });

//   if (!progress) return res.status(404).json({ message: "null" });

//   const allLectures = (await Lecture.find({ course: req.query.course })).length;

//   const completedLectures = progress[0].completedLectures.length;

//   const courseProgressPercentage = (completedLectures * 100) / allLectures;

//   res.json({
//     courseProgressPercentage,
//     completedLectures,
//     allLectures,
//     progress,
//   });
// });

import { sendCourseNotificationMail } from "../midddlewares/sendMail.js";

export const createCourse = TryCatch(async (req, res) => {
  const { title, description, creatorId } = req.body;

  const course = await Course.create({ title, description, creator: creatorId });

  const users = await User.find({}, "email name");

  for (const user of users) {
    const data = {
      name: user.name,
      courseTitle: title,
      courseDescription: description,
    };

    await sendCourseNotificationMail(user.email, "New Course Alert!", data);
  }

  res.status(201).json({
    message: "Course created and email notifications sent",
    course,
  });
});
