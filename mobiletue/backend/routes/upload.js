const express = require("express")
const multer = require("multer")
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary")
const auth = require("../middleware/auth")

const router = express.Router()

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"), false)
    }
  },
})

// Upload single image
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      })
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "repair-service",
      resource_type: "image",
    })

    res.json({
      success: true,
      message: "Image uploaded successfully",
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    })
  } catch (error) {
    console.error("Upload image error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    })
  }
})

// Upload multiple images
router.post("/images", auth, upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      })
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder: "repair-service",
        resource_type: "image",
      }),
    )

    const results = await Promise.all(uploadPromises)

    const images = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }))

    res.json({
      success: true,
      message: "Images uploaded successfully",
      images,
    })
  } catch (error) {
    console.error("Upload images error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload images",
      error: error.message,
    })
  }
})

// Delete image
router.delete("/image/:publicId", auth, async (req, res) => {
  try {
    const { publicId } = req.params

    await deleteFromCloudinary(publicId)

    res.json({
      success: true,
      message: "Image deleted successfully",
    })
  } catch (error) {
    console.error("Delete image error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: error.message,
    })
  }
})

module.exports = router
