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

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ EMAIL TRANSPORTER ERROR:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    console.error("   Command:", error.command);
  } else {
    console.log("✅ Email server ready to send messages");
    console.log("   Host:", process.env.EMAIL_HOST || "smtp.gmail.com");
    console.log("   Port:", process.env.EMAIL_PORT || 587);
    console.log("   User:", process.env.EMAIL_USER);
  }
});

const sendEmailOtp = async (email, otp) => {
  console.log("📧 ATTEMPTING TO SEND EMAIL:");
  console.log("   To:", email);
  console.log("   OTP:", otp);
  console.log("   From:", process.env.EMAIL_USER);
  console.log("   Host:", process.env.EMAIL_HOST || "smtp.gmail.com");
  console.log("   Port:", process.env.EMAIL_PORT || 587);

  try {
    const info = await transporter.sendMail({
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code - Chat App",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            .otp-box { background: #007bff; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0; }
            .footer { color: #888; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🔐 Verify Your Account</h2>
            <p>Your one-time password (OTP) is:</p>
            <div class="otp-box">${otp}</div>
            <p>This code will expire in <strong>5 minutes</strong>.</p>
            <p class="footer">If you didn't request this, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY:");
    console.log("   Message ID:", info.messageId);
    console.log("   Response:", info.response);
    console.log("   Accepted:", info.accepted);
    console.log("   Rejected:", info.rejected);

    return info;
  } catch (error) {
    console.error("❌ EMAIL SEND FAILED:");
    console.error("   Error Type:", error.constructor.name);
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    console.error("   Command:", error.command);
    console.error("   Response:", error.response);
    console.error("   Stack:", error.stack);

    // Re-throw so calling code knows it failed
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmailOtp;
