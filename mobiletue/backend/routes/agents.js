const express = require("express")
const Agent = require("../models/Agent")
const AgentRequest = require("../models/AgentRequest")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Submit agent application
router.post("/apply", async (req, res) => {
  try {
    const { name, email, phone, shopName, shopAddress, city, pincode, experience, specializations } = req.body

    // Check if application already exists
    const existingApplication = await AgentRequest.findOne({ email })
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "Application already submitted with this email",
      })
    }

    const agentRequest = new AgentRequest({
      name,
      email,
      phone,
      shopName,
      shopAddress,
      city,
      pincode,
      experience,
      specializations,
    })

    await agentRequest.save()

    res.status(201).json({
      success: true,
      message: "Agent application submitted successfully",
    })
  } catch (error) {
    console.error("Agent application error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message,
    })
  }
})

// Get agents by city
router.get("/by-city/:cityName", async (req, res) => {
  try {
    const { cityName } = req.params

    const agents = await Agent.find({
      "shopAddress.city": new RegExp(cityName, "i"),
      isActive: true,
    })
      .populate("userId", "name email phone")
      .select("shopName shopAddress rating totalReviews completedJobs specializations")

    res.json({
      success: true,
      agents,
    })
  } catch (error) {
    console.error("Get agents by city error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get agents",
      error: error.message,
    })
  }
})

// Get agent profile
router.get("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "agent") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const agent = await Agent.findOne({ userId: req.user.userId }).populate("userId", "name email phone")

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      })
    }

    res.json({
      success: true,
      agent,
    })
  } catch (error) {
    console.error("Get agent profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get agent profile",
      error: error.message,
    })
  }
})

// Update agent profile
router.patch("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "agent") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const agent = await Agent.findOne({ userId: req.user.userId })
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
      })
    }

    const allowedUpdates = ["shopName", "shopAddress", "specializations", "bankDetails"]
    const updates = {}

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    Object.assign(agent, updates)
    await agent.save()

    res.json({
      success: true,
      message: "Profile updated successfully",
      agent,
    })
  } catch (error) {
    console.error("Update agent profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    })
  }
})

module.exports = router
