const crypto = require("crypto");

function generateOtp() {
  // Cryptographically secure random 6-digit OTP
  return crypto.randomInt(100000, 1000000).toString();
}

function generateSecureToken(bytes = 32) {
  // Cryptographically secure random string/token
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = { 
  generateOtp,
  generateSecureToken
};
