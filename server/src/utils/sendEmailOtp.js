// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
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

const axios = require("axios");

const sendEmailOtp = async (email, otp) => {
  console.log("📧 SENDING OTP VIA PROMAILER:");
  console.log("   To:", email);
  console.log("   OTP:", otp);

  try {
    const response = await axios.post(
      "https://mailserver.automationlounge.com/api/v1/messages/send",
      {
        to: email,
        subject: "Your OTP Code - Chat App",
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f4f4f4;">
            <div style="background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="text-align: center; color: #333; margin: 0 0 20px 0;">🔐 Verify Your Account</h2>
              <p style="text-align: center; color: #666; margin: 10px 0;">Your one-time password is:</p>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 30px 0;">
                ${otp}
              </div>
              <p style="text-align: center; color: #666; font-size: 14px; margin: 20px 0;">
                This code expires in <strong>5 minutes</strong>.<br/>
                Please do not share this code with anyone.
              </p>
              <p style="color: #999; font-size: 12px; margin: 30px 0 0 0; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `Your OTP is ${otp}. This code expires in 5 minutes.`,
        smtpId: "69b1a8f0d91f6a15b2788124", // Your SMTP Connection ID
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PROMAILER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("✅ EMAIL SENT SUCCESSFULLY VIA PROMAILER");
    console.log("   Success:", response.data.success);
    console.log("   Message ID:", response.data.data?.messageId);

    return response.data;
  } catch (error) {
    console.error("❌ PROMAILER API ERROR:");
    console.error("   Message:", error.message);

    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Response:", error.response.data);
    }

    throw new Error(
      `ProMailer failed: ${error.response?.data?.message || error.message}`,
    );
  }
};

module.exports = sendEmailOtp;
