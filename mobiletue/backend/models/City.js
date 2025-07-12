const mongoose = require("mongoose")

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  pincodes: [
    {
      type: String,
      required: true,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("City", citySchema)
