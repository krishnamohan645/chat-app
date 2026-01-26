const sendEmailOtp = require("./sendEmailOtp");
const sendSmsOtp = require("./sendSmsOtp");

const sendOtp = async ({ identifier, otp }) => {
  if (identifier.includes("@")) {
    await sendEmailOtp(identifier, otp);
  } else {
    await sendSmsOtp(identifier, otp);
  }
};

module.exports = sendOtp;
