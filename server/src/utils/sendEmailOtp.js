// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   // service: "gmail",
//   host: process.env.EMAIL_HOST || "smtp.gmail.com",
//   port: parseInt(process.env.EMAIL_PORT) || 587,
//   secure: false, // true for 465, false for 587
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false, // Allow self-signed certs
//   },
// });

// const sendEmailOtp = async (email, otp) => {
//   await transporter.sendMail({
//     from: `"Chat App" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your OTP Code",
//     text: `Your OTP is ${otp}`,
//     html: `<h3>Your OTP is ${otp}</h3>`,
//   });
// };

// module.exports = sendEmailOtp;

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// async function sendEmailOtp(email, otp) {
//   try {
//     await transporter.verify();
//     console.log("SMTP Connected");

//     await transporter.sendMail({
//       from: `"OTP Service" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "OTP Verification",
//       html: `
//         <h2>Your OTP Code</h2>
//         <h1 style="letter-spacing:5px">${otp}</h1>
//         <p>This OTP expires in 5 minutes.</p>
//       `,
//     });

//     console.log("✅ OTP sent to:", email);
//   } catch (err) {
//     console.error("❌ Email send failed:", err);
//   }
// }

// module.exports = sendEmailOtp;

const axios = require("axios");

async function sendEmailOtp(email, otp) {
  try {
    const response = await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          email: email,
          otp: otp,
        },
      },
    );

    console.log("✅ OTP email sent:", response.data);
  } catch (error) {
    console.error(
      "❌ Email send failed:",
      error.response?.data || error.message,
    );
  }
}

module.exports = sendEmailOtp;
