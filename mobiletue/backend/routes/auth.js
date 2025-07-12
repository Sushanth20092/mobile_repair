const express = require("express")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const { sendEmail } = require("../utils/email")
const { generateOTP } = require("../utils/otp")
const auth = require("../middleware/auth")

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, address, city, pincode } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password,
      address: {
        street: address,
        city,
        pincode,
      },
      verificationToken,
    })

    await user.save()

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`
    await sendEmail({
      to: email,
      subject: "Verify Your Email - RepairHub",
      html: `
        <h2>Welcome to RepairHub!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    })

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check role
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid role for this account",
      })
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "7d",
    })

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    })
  }
})

// Verify Email
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body

    const user = await User.findOne({ verificationToken: token })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      })
    }

    user.isVerified = true
    user.verificationToken = undefined
    await user.save()

    res.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    })
  }
})

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000 // 15 minutes
    await user.save()

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`
    await sendEmail({
      to: email,
      subject: "Password Reset - RepairHub",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    })

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send reset email",
      error: error.message,
    })
  }
})

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({
      success: true,
      message: "Password reset successful",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    res.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    })
  }
})

module.exports = router
