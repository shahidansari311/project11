const crypto = require('crypto');

function generateOtp() {
  // Generate a secure random 6-digit number
  return crypto.randomInt(100000, 1000000).toString();
}

module.exports = { generateOtp };
