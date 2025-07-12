const mongoose = require("mongoose")

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shopName: {
    type: String,
    required: true,
    trim: true,
  },
  shopAddress: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    state: String,
  },
  experience: {
    type: String,
    enum: ["0-1", "1-3", "3-5", "5-10", "10+"],
    required: true,
  },
  specializations: [
    {
      type: String,
      enum: [
        "Mobile Phone Repair",
        "Tablet Repair",
        "Laptop Repair",
        "Smartwatch Repair",
        "Audio Device Repair",
        "Gaming Console Repair",
      ],
    },
  ],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  completedJobs: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  documents: {
    idProof: {
      url: String,
      publicId: String,
    },
    shopImages: [
      {
        url: String,
        publicId: String,
      },
    ],
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
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

agentSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Agent", agentSchema)
