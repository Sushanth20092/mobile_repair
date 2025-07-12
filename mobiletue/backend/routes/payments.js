const express = require("express")
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const Booking = require("../models/Booking")
const auth = require("../middleware/auth")

const router = express.Router()

// Create payment intent
router.post("/create-payment-intent", auth, async (req, res) => {
  // Stripe temporarily disabled
  return res.status(503).json({
    success: false,
    message: "Stripe payment is temporarily disabled."
  });
  /*
  try {
    const { bookingId } = req.body

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check if user owns the booking
    if (!booking.customerId.equals(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.pricing.totalAmount * 100, // Convert to paise
      currency: "inr",
      metadata: {
        bookingId: booking.bookingId,
        customerId: booking.customerId.toString(),
      },
    })

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Create payment intent error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    })
  }
  */
})

// Confirm payment
router.post("/confirm-payment", auth, async (req, res) => {
  // Stripe temporarily disabled
  return res.status(503).json({
    success: false,
    message: "Stripe payment is temporarily disabled."
  });
  /*
  try {
    const { paymentIntentId, bookingId } = req.body

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === "succeeded") {
      const booking = await Booking.findOne({ bookingId })
      if (booking) {
        booking.payment.status = "paid"
        booking.payment.transactionId = paymentIntentId
        booking.payment.paidAt = new Date()
        booking.timeline.push({
          status: "payment-completed",
          message: "Payment completed successfully",
        })

        await booking.save()

        // Notify agent
        if (booking.agentId) {
          const io = req.app.get("io")
          io.to(booking.agentId.toString()).emit("payment-received", {
            bookingId: booking.bookingId,
            message: "Payment received for your assigned job",
          })
        }
      }

      res.json({
        success: true,
        message: "Payment confirmed successfully",
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not successful",
      })
    }
  } catch (error) {
    console.error("Confirm payment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    })
  }
  */
})

// Webhook for Stripe events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  // Stripe temporarily disabled
  return res.status(503).json({
    success: false,
    message: "Stripe payment is temporarily disabled."
  });
  /*
  const sig = req.headers["stripe-signature"]
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object
      const bookingId = paymentIntent.metadata.bookingId

      if (bookingId) {
        const booking = await Booking.findOne({ bookingId })
        if (booking && booking.payment.status !== "paid") {
          booking.payment.status = "paid"
          booking.payment.transactionId = paymentIntent.id
          booking.payment.paidAt = new Date()
          booking.timeline.push({
            status: "payment-completed",
            message: "Payment completed successfully",
          })

          await booking.save()
        }
      }
      break

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object
      const failedBookingId = failedPayment.metadata.bookingId

      if (failedBookingId) {
        const booking = await Booking.findOne({ bookingId: failedBookingId })
        if (booking) {
          booking.payment.status = "failed"
          booking.timeline.push({
            status: "payment-failed",
            message: "Payment failed",
          })

          await booking.save()
        }
      }
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
  */
})

module.exports = router
