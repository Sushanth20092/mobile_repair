const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")

    const user = await User.findById(decoded.userId).select("-password")
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      })
    }

    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email,
    }

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(401).json({
      success: false,
      message: "Invalid token",
    })
  }
}

module.exports = auth
