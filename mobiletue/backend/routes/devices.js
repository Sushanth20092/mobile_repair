const express = require("express")
const Device = require("../models/Device")

const router = express.Router()

// Get device categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Device.distinct("category")

    res.json({
      success: true,
      categories,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
      error: error.message,
    })
  }
})

// Get brands by category
router.get("/brands/:category", async (req, res) => {
  try {
    const { category } = req.params

    const brands = await Device.distinct("brand", {
      category,
      isActive: true,
    })

    res.json({
      success: true,
      brands,
    })
  } catch (error) {
    console.error("Get brands error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get brands",
      error: error.message,
    })
  }
})

// Get models by category and brand
router.get("/models/:category/:brand", async (req, res) => {
  try {
    const { category, brand } = req.params

    const models = await Device.distinct("model", {
      category,
      brand,
      isActive: true,
    })

    res.json({
      success: true,
      models,
    })
  } catch (error) {
    console.error("Get models error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get models",
      error: error.message,
    })
  }
})

module.exports = router
