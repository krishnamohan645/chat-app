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

const { Resend } = require("resend");

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailOtp = async (email, otp) => {
  console.log("📧 ATTEMPTING TO SEND EMAIL VIA RESEND HTTP API:");
  console.log("   To:", email);
  console.log("   OTP:", otp);
  console.log("   From: onboarding@resend.dev");

  try {
    const { data, error } = await resend.emails.send({
      from: "Chat App <onboarding@resend.dev>",
      to: [email],
      subject: "Your OTP Code - Chat App",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              background: #f4f4f4; 
              margin: 0;
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 10px; 
              max-width: 500px; 
              margin: 0 auto; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h2 {
              color: #333;
              margin: 0;
            }
            .otp-box { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              padding: 25px; 
              text-align: center; 
              font-size: 36px; 
              font-weight: bold; 
              letter-spacing: 8px; 
              border-radius: 8px; 
              margin: 30px 0; 
            }
            .info {
              text-align: center;
              color: #666;
              font-size: 14px;
              line-height: 1.6;
            }
            .footer { 
              color: #999; 
              font-size: 12px; 
              margin-top: 30px; 
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔐 Verify Your Account</h2>
            </div>
            <p class="info">Your one-time password (OTP) is:</p>
            <div class="otp-box">${otp}</div>
            <p class="info">
              This code will expire in <strong>5 minutes</strong>.<br/>
              Please do not share this code with anyone.
            </p>
            <p class="footer">
              If you didn't request this code, please ignore this email.<br/>
              This is an automated message, please do not reply.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ RESEND API ERROR:", error);
      throw new Error(error.message);
    }

    console.log("✅ EMAIL SENT SUCCESSFULLY VIA RESEND HTTP API:");
    console.log("   Email ID:", data.id);

    return data;
  } catch (error) {
    console.error("❌ RESEND EMAIL SEND FAILED:");
    console.error("   Error Type:", error.constructor.name);
    console.error("   Message:", error.message);

    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
};

module.exports = sendEmailOtp;
