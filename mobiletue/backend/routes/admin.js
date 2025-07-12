const express = require("express")
const User = require("../models/User")
const Agent = require("../models/Agent")
const AgentRequest = require("../models/AgentRequest")
const Booking = require("../models/Booking")
const Device = require("../models/Device")
const City = require("../models/City")
const auth = require("../middleware/auth")
const bcrypt = require("bcryptjs")

const router = express.Router()

// Middleware to check admin role
const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    })
  }
  next()
}

// Get dashboard stats
router.get("/stats", auth, adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalAgents, totalBookings, pendingAgentRequests, activeBookings, completedBookings] =
      await Promise.all([
        User.countDocuments({ role: "customer" }),
        Agent.countDocuments({ isActive: true }),
        Booking.countDocuments(),
        AgentRequest.countDocuments({ status: "pending" }),
        Booking.countDocuments({ status: { $in: ["pending", "assigned", "in-progress"] } }),
        Booking.countDocuments({ status: "completed" }),
      ])

    // Calculate total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
    ])
    const totalRevenue = revenueResult[0]?.total || 0

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAgents,
        totalBookings,
        totalRevenue,
        pendingAgentRequests,
        activeBookings,
        completedBookings,
      },
    })
  } catch (error) {
    console.error("Get admin stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get stats",
      error: error.message,
    })
  }
})

// Get agent requests
router.get("/agent-requests", auth, adminAuth, async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 10 } = req.query

    const skip = (page - 1) * limit

    const requests = await AgentRequest.find({ status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await AgentRequest.countDocuments({ status })

    res.json({
      success: true,
      requests,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get agent requests error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get agent requests",
      error: error.message,
    })
  }
})

// Approve/Reject agent request
router.patch("/agent-requests/:requestId", auth, adminAuth, async (req, res) => {
  try {
    const { requestId } = req.params
    const { action, rejectionReason } = req.body // 'approve' or 'reject'

    const agentRequest = await AgentRequest.findById(requestId)
    if (!agentRequest) {
      return res.status(404).json({
        success: false,
        message: "Agent request not found",
      })
    }

    if (agentRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed",
      })
    }

    if (action === "approve") {
      // Create user account for agent
      const tempPassword = Math.random().toString(36).slice(-8)

      const user = new User({
        name: agentRequest.name,
        email: agentRequest.email,
        phone: agentRequest.phone,
        password: tempPassword,
        role: "agent",
        isVerified: true,
      })

      await user.save()

      // Create agent profile
      const agent = new Agent({
        userId: user._id,
        shopName: agentRequest.shopName,
        shopAddress: {
          street: agentRequest.shopAddress,
          city: agentRequest.city,
          pincode: agentRequest.pincode,
        },
        experience: agentRequest.experience,
        specializations: agentRequest.specializations,
        documents: agentRequest.documents,
      })

      await agent.save()

      // Update request status
      agentRequest.status = "approved"
      agentRequest.reviewedBy = req.user.userId
      agentRequest.reviewedAt = new Date()
      await agentRequest.save()

      // Send login credentials email
      // TODO: Implement email sending with credentials

      res.json({
        success: true,
        message: "Agent request approved successfully",
        credentials: {
          email: user.email,
          password: tempPassword,
        },
      })
    } else if (action === "reject") {
      agentRequest.status = "rejected"
      agentRequest.rejectionReason = rejectionReason
      agentRequest.reviewedBy = req.user.userId
      agentRequest.reviewedAt = new Date()
      await agentRequest.save()

      res.json({
        success: true,
        message: "Agent request rejected successfully",
      })
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      })
    }
  } catch (error) {
    console.error("Process agent request error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to process agent request",
      error: error.message,
    })
  }
})

// Get all bookings
router.get("/bookings", auth, adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const skip = (page - 1) * limit
    const filter = status ? { status } : {}

    const bookings = await Booking.find(filter)
      .populate("customerId", "name email phone")
      .populate("agentId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Booking.countDocuments(filter)

    res.json({
      success: true,
      bookings,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get admin bookings error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get bookings",
      error: error.message,
    })
  }
})

// Reassign booking to different agent
router.patch("/bookings/:bookingId/reassign", auth, adminAuth, async (req, res) => {
  try {
    const { bookingId } = req.params
    const { agentId } = req.body

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    const agent = await Agent.findById(agentId)
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      })
    }

    booking.agentId = agentId
    booking.status = "assigned"
    booking.timeline.push({
      status: "reassigned",
      message: `Booking reassigned to ${agent.shopName}`,
    })

    await booking.save()

    // Notify new agent
    const io = req.app.get("io")
    io.to(agent.userId.toString()).emit("new-booking", {
      bookingId: booking.bookingId,
      message: "New repair job assigned to you",
    })

    res.json({
      success: true,
      message: "Booking reassigned successfully",
    })
  } catch (error) {
    console.error("Reassign booking error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to reassign booking",
      error: error.message,
    })
  }
})

// Manage devices
router.get("/devices", auth, adminAuth, async (req, res) => {
  try {
    const { category } = req.query
    const filter = category ? { category } : {}

    const devices = await Device.find(filter).sort({ category: 1, brand: 1, model: 1 })

    res.json({
      success: true,
      devices,
    })
  } catch (error) {
    console.error("Get devices error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get devices",
      error: error.message,
    })
  }
})

router.post("/devices", auth, adminAuth, async (req, res) => {
  try {
    const { category, brand, model } = req.body

    const device = new Device({ category, brand, model })
    await device.save()

    res.status(201).json({
      success: true,
      message: "Device added successfully",
      device,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Device already exists",
      })
    }

    console.error("Add device error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add device",
      error: error.message,
    })
  }
})

// Manage cities
router.get("/cities", auth, adminAuth, async (req, res) => {
  try {
    const cities = await City.find({ isActive: true }).sort({ name: 1 })

    res.json({
      success: true,
      cities,
    })
  } catch (error) {
    console.error("Get cities error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get cities",
      error: error.message,
    })
  }
})

router.post("/cities", auth, adminAuth, async (req, res) => {
  try {
    const { name, state, pincodes } = req.body

    const city = new City({ name, state, pincodes })
    await city.save()

    res.status(201).json({
      success: true,
      message: "City added successfully",
      city,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "City already exists",
      })
    }

    console.error("Add city error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add city",
      error: error.message,
    })
  }
})

module.exports = router
