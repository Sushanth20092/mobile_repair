const express = require("express")
const Booking = require("../models/Booking")
const Agent = require("../models/Agent")
const User = require("../models/User")
const auth = require("../middleware/auth")
const { uploadToCloudinary } = require("../utils/cloudinary")

const router = express.Router()

// Create booking
router.post("/", auth, async (req, res) => {
  try {
    const { device, issues, customIssue, serviceType, address, schedule, duration, selectedAgent, paymentMethod } =
      req.body

    // Calculate pricing
    const basePrice = 2000
    let durationCharge = 0

    if (duration === "express") durationCharge = 1000
    else if (duration === "standard") durationCharge = 500

    const totalAmount = basePrice + durationCharge

    // Create booking
    const booking = new Booking({
      customerId: req.user.userId,
      device,
      issues,
      customIssue,
      serviceType,
      address: serviceType !== "local" ? address : undefined,
      schedule: serviceType === "collection" ? schedule : undefined,
      duration,
      agentId: selectedAgent || undefined,
      pricing: {
        basePrice,
        durationCharge,
        totalAmount,
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cash" ? "pending" : "pending",
      },
      status: selectedAgent ? "assigned" : "pending",
      timeline: [
        {
          status: "created",
          message: "Booking created successfully",
        },
      ],
    })

    await booking.save()

    // Notify agent if assigned
    if (selectedAgent) {
      const io = req.app.get("io")
      io.to(selectedAgent).emit("new-booking", {
        bookingId: booking.bookingId,
        message: "New repair job assigned to you",
      })
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        totalAmount: booking.pricing.totalAmount,
      },
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    })
  }
})

// Get user bookings
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.userId })
      .populate("agentId", "shopName shopAddress rating")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      bookings,
    })
  } catch (error) {
    console.error("Get bookings error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get bookings",
      error: error.message,
    })
  }
})

// Get agent bookings
router.get("/agent-bookings", auth, async (req, res) => {
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

    const bookings = await Booking.find({ agentId: agent._id })
      .populate("customerId", "name phone email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      bookings,
    })
  } catch (error) {
    console.error("Get agent bookings error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get agent bookings",
      error: error.message,
    })
  }
})

// Update booking status
router.patch("/:bookingId/status", auth, async (req, res) => {
  try {
    const { bookingId } = req.params
    const { status, message } = req.body

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check permissions
    if (req.user.role === "agent") {
      const agent = await Agent.findOne({ userId: req.user.userId })
      if (!agent || !booking.agentId.equals(agent._id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    booking.status = status
    booking.timeline.push({
      status,
      message: message || `Status updated to ${status}`,
    })

    await booking.save()

    // Notify customer
    const io = req.app.get("io")
    io.to(booking.customerId.toString()).emit("booking-status-update", {
      bookingId: booking.bookingId,
      status,
      message: message || `Your repair status has been updated to ${status}`,
    })

    res.json({
      success: true,
      message: "Booking status updated successfully",
    })
  } catch (error) {
    console.error("Update booking status error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: error.message,
    })
  }
})

// Accept/Decline booking (for express bookings)
router.patch("/:bookingId/respond", auth, async (req, res) => {
  try {
    const { bookingId } = req.params
    const { action } = req.body // 'accept' or 'decline'

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

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    if (!booking.agentId.equals(agent._id)) {
      return res.status(403).json({
        success: false,
        message: "This booking is not assigned to you",
      })
    }

    if (action === "accept") {
      booking.status = "in-progress"
      booking.timeline.push({
        status: "accepted",
        message: "Agent accepted the repair job",
      })
    } else if (action === "decline") {
      booking.status = "pending"
      booking.agentId = undefined
      booking.timeline.push({
        status: "declined",
        message: "Agent declined the repair job",
      })
    }

    await booking.save()

    // Notify customer
    const io = req.app.get("io")
    io.to(booking.customerId.toString()).emit("booking-status-update", {
      bookingId: booking.bookingId,
      status: booking.status,
      message:
        action === "accept"
          ? "Your repair job has been accepted by the agent"
          : "Your repair job was declined and will be reassigned",
    })

    res.json({
      success: true,
      message: `Booking ${action}ed successfully`,
    })
  } catch (error) {
    console.error("Respond to booking error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to respond to booking",
      error: error.message,
    })
  }
})

// Add review
router.post("/:bookingId/review", auth, async (req, res) => {
  try {
    const { bookingId } = req.params
    const { rating, comment } = req.body

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check if user is the customer
    if (!booking.customerId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed bookings",
      })
    }

    // Check if already reviewed
    if (booking.review.rating) {
      return res.status(400).json({
        success: false,
        message: "Booking already reviewed",
      })
    }

    booking.review = {
      rating,
      comment,
      createdAt: new Date(),
    }

    await booking.save()

    // Update agent rating
    if (booking.agentId) {
      const agent = await Agent.findById(booking.agentId)
      if (agent) {
        const totalRating = agent.rating * agent.totalReviews + rating
        agent.totalReviews += 1
        agent.rating = totalRating / agent.totalReviews
        await agent.save()
      }
    }

    res.json({
      success: true,
      message: "Review added successfully",
    })
  } catch (error) {
    console.error("Add review error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: error.message,
    })
  }
})

module.exports = router
