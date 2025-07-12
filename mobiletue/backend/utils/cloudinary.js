const cloudinary = require("cloudinary").v2

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Upload to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "repair-service",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      },
    )

    uploadStream.end(buffer)
  })
}

// Delete from Cloudinary
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId)
}

// Delete multiple from Cloudinary
const deleteMultipleFromCloudinary = (publicIds) => {
  return cloudinary.api.delete_resources(publicIds)
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  cloudinary,
}
