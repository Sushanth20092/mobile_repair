const mongoose = require("mongoose")

const agentRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  shopName: {
    type: String,
    required: true,
    trim: true,
  },
  shopAddress: {
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
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: Date,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("AgentRequest", agentRequestSchema)
