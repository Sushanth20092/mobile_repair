const express = require("express")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Get user profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message,
    })
  }
})

// Update user profile
router.patch("/profile", auth, async (req, res) => {
  try {
    const allowedUpdates = ["name", "phone", "address"]
    const updates = {}

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).select(
      "-password",
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update user profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    })
  }
})

// Change password
router.patch("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    })
  }
})

module.exports = router
