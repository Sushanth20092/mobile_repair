const crypto = require("crypto")

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = "0123456789"
  let otp = ""

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }

  return otp
}

// Generate secure OTP using crypto
const generateSecureOTP = (length = 6) => {
  const buffer = crypto.randomBytes(length)
  let otp = ""

  for (let i = 0; i < length; i++) {
    otp += (buffer[i] % 10).toString()
  }

  return otp
}

// Verify OTP (simple implementation)
const verifyOTP = (inputOTP, storedOTP, expiryTime) => {
  if (Date.now() > expiryTime) {
    return { valid: false, message: "OTP has expired" }
  }

  if (inputOTP !== storedOTP) {
    return { valid: false, message: "Invalid OTP" }
  }

  return { valid: true, message: "OTP verified successfully" }
}

module.exports = {
  generateOTP,
  generateSecureOTP,
  verifyOTP,
}
