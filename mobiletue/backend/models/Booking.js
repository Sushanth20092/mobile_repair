const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
  },
  device: {
    category: {
      type: String,
      required: true,
      enum: ["mobile", "tablet", "laptop", "smartwatch"],
    },
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
  },
  issues: [
    {
      type: String,
      required: true,
    },
  ],
  customIssue: String,
  images: [
    {
      url: String,
      publicId: String,
    },
  ],
  serviceType: {
    type: String,
    enum: ["local", "collection", "postal"],
    required: true,
  },
  address: {
    street: String,
    city: String,
    pincode: String,
    state: String,
  },
  schedule: {
    collectionDate: Date,
    collectionTime: String,
    deliveryDate: Date,
    deliveryTime: String,
  },
  duration: {
    type: String,
    enum: ["express", "standard", "economy"],
    required: true,
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true,
    },
    durationCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  payment: {
    method: {
      type: String,
      enum: ["stripe", "cash"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transactionId: String,
    paidAt: Date,
  },
  status: {
    type: String,
    enum: ["pending", "assigned", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  timeline: [
    {
      status: String,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    createdAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Generate booking ID before saving
bookingSchema.pre("save", async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model("Booking").countDocuments()
    this.bookingId = `REP${String(count + 1).padStart(3, "0")}`
  }
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Booking", bookingSchema)
