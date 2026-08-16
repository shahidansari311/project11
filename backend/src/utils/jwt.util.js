const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

module.exports = {
  signToken,
  verifyToken,
  generateRefreshToken
};
