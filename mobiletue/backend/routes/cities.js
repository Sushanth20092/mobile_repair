const express = require("express")
const City = require("../models/City")

const router = express.Router()

// Get all active cities
router.get("/", async (req, res) => {
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

// Get city by name
router.get("/:cityName", async (req, res) => {
  try {
    const { cityName } = req.params

    const city = await City.findOne({
      name: new RegExp(cityName, "i"),
      isActive: true,
    })

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      })
    }

    res.json({
      success: true,
      city,
    })
  } catch (error) {
    console.error("Get city error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get city",
      error: error.message,
    })
  }
})

module.exports = router
