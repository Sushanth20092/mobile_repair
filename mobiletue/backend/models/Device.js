const mongoose = require("mongoose")

const deviceSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ["mobile", "tablet", "laptop", "smartwatch"],
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Compound index for category, brand, model
deviceSchema.index({ category: 1, brand: 1, model: 1 }, { unique: true })

module.exports = mongoose.model("Device", deviceSchema)
