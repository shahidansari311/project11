const { DEMO_OTP } = require("../config/env");

function generateOtp() {
  // In a real app, generate a random 6-digit number.
  // For now, we use the demo OTP as requested.
  return DEMO_OTP;
}

module.exports = { generateOtp };
