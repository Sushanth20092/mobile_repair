const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const http = require("http")
const socketIo = require("socket.io")

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const agentRoutes = require("./routes/agents")
const adminRoutes = require("./routes/admin")
const bookingRoutes = require("./routes/bookings")
const deviceRoutes = require("./routes/devices")
const cityRoutes = require("./routes/cities")
const uploadRoutes = require("./routes/upload")
const paymentRoutes = require("./routes/payments")

// Load environment variables
dotenv.config()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.originalUrl);
  next();
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-room", (userId) => {
    socket.join(userId)
    console.log(`User ${userId} joined room`)
  })

  socket.on("send-message", (data) => {
    io.to(data.recipientId).emit("receive-message", data)
  })

  socket.on("booking-update", (data) => {
    io.to(data.userId).emit("booking-status-update", data)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Make io accessible to routes
app.set("io", io)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/agents", agentRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/devices", deviceRoutes)
app.use("/api/cities", cityRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/payments", paymentRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mobile-repair-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB")

    // Start server
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("Database connection error:", error)
    process.exit(1)
  })

module.exports = app
