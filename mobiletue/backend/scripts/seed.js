const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const Agent = require("../models/Agent")
const Device = require("../models/Device")
const City = require("../models/City")
const Booking = require("../models/Booking")

// Load environment variables
require("dotenv").config()

// Sample data
const cities = [
  {
    name: "Mumbai",
    state: "Maharashtra",
    pincodes: ["400001", "400002", "400003", "400004", "400005"],
  },
  {
    name: "Delhi",
    state: "Delhi",
    pincodes: ["110001", "110002", "110003", "110004", "110005"],
  },
  {
    name: "Bangalore",
    state: "Karnataka",
    pincodes: ["560001", "560002", "560003", "560004", "560005"],
  },
  {
    name: "Chennai",
    state: "Tamil Nadu",
    pincodes: ["600001", "600002", "600003", "600004", "600005"],
  },
  {
    name: "Kolkata",
    state: "West Bengal",
    pincodes: ["700001", "700002", "700003", "700004", "700005"],
  },
]

const devices = [
  // Mobile phones
  { category: "mobile", brand: "Apple", model: "iPhone 15 Pro" },
  { category: "mobile", brand: "Apple", model: "iPhone 15" },
  { category: "mobile", brand: "Apple", model: "iPhone 14 Pro" },
  { category: "mobile", brand: "Apple", model: "iPhone 14" },
  { category: "mobile", brand: "Apple", model: "iPhone 13" },
  { category: "mobile", brand: "Samsung", model: "Galaxy S24" },
  { category: "mobile", brand: "Samsung", model: "Galaxy S23" },
  { category: "mobile", brand: "Samsung", model: "Galaxy Note 20" },
  { category: "mobile", brand: "OnePlus", model: "OnePlus 12" },
  { category: "mobile", brand: "OnePlus", model: "OnePlus 11" },
  { category: "mobile", brand: "Xiaomi", model: "Mi 14" },
  { category: "mobile", brand: "Xiaomi", model: "Redmi Note 13" },

  // Tablets
  { category: "tablet", brand: "Apple", model: "iPad Pro" },
  { category: "tablet", brand: "Apple", model: "iPad Air" },
  { category: "tablet", brand: "Samsung", model: "Galaxy Tab S9" },
  { category: "tablet", brand: "Lenovo", model: "Tab P11" },

  // Laptops
  { category: "laptop", brand: "Apple", model: "MacBook Pro" },
  { category: "laptop", brand: "Apple", model: "MacBook Air" },
  { category: "laptop", brand: "Dell", model: "XPS 13" },
  { category: "laptop", brand: "HP", model: "Pavilion" },

  // Smartwatches
  { category: "smartwatch", brand: "Apple", model: "Apple Watch Series 9" },
  { category: "smartwatch", brand: "Samsung", model: "Galaxy Watch 6" },
  { category: "smartwatch", brand: "Fitbit", model: "Versa 4" },
]

const users = [
  {
    name: "Admin User",
    email: "admin@repairhub.com",
    phone: "+91 9999999999",
    password: "admin123",
    role: "admin",
    isVerified: true,
  },
  {
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 9876543210",
    password: "customer123",
    role: "customer",
    isVerified: true,
    address: {
      street: "123 Main Street",
      city: "Mumbai",
      pincode: "400001",
      state: "Maharashtra",
    },
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+91 8765432109",
    password: "customer123",
    role: "customer",
    isVerified: true,
    address: {
      street: "456 Oak Avenue",
      city: "Delhi",
      pincode: "110001",
      state: "Delhi",
    },
  },
  {
    name: "Rajesh Kumar",
    email: "rajesh@techsolutions.com",
    phone: "+91 7654321098",
    password: "agent123",
    role: "agent",
    isVerified: true,
  },
  {
    name: "Priya Sharma",
    email: "priya@mobilecare.com",
    phone: "+91 6543210987",
    password: "agent123",
    role: "agent",
    isVerified: true,
  },
]

const agents = [
  {
    shopName: "Tech Solutions",
    shopAddress: {
      street: "Shop 15, Andheri West",
      city: "Mumbai",
      pincode: "400001",
      state: "Maharashtra",
    },
    experience: "5-10",
    specializations: ["Mobile Phone Repair", "Tablet Repair"],
    rating: 4.8,
    totalReviews: 245,
    completedJobs: 180,
  },
  {
    shopName: "Mobile Care Center",
    shopAddress: {
      street: "A-25, Connaught Place",
      city: "Delhi",
      pincode: "110001",
      state: "Delhi",
    },
    experience: "3-5",
    specializations: ["Mobile Phone Repair", "Smartwatch Repair"],
    rating: 4.6,
    totalReviews: 189,
    completedJobs: 145,
  },
]

// Helper function to generate unique bookingId
function generateBookingId() {
  return 'BOOK' + Date.now() + Math.floor(Math.random() * 10000);
}

// Seed function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mobile-repair-service")
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Agent.deleteMany({}),
      Device.deleteMany({}),
      City.deleteMany({}),
      Booking.deleteMany({}),
    ])
    console.log("🗑️  Cleared existing data")

    // Seed cities
    await City.insertMany(cities)
    console.log("🏙️  Seeded cities")

    // Seed devices
    await Device.insertMany(devices)
    console.log("📱 Seeded devices")

    // Seed users
    const createdUsers = await User.insertMany(users)
    console.log("👥 Seeded users")

    // Seed agents
    const agentUsers = createdUsers.filter((user) => user.role === "agent")
    const agentData = agents.map((agent, index) => ({
      ...agent,
      userId: agentUsers[index]._id,
    }))

    await Agent.insertMany(agentData)
    console.log("🔧 Seeded agents")

    // Create sample bookings
    const customerUsers = createdUsers.filter((user) => user.role === "customer")
    const createdAgents = await Agent.find()

    const sampleBookings = [
      {
        bookingId: generateBookingId(),
        customerId: customerUsers[0]._id,
        agentId: createdAgents[0]._id,
        device: {
          category: "mobile",
          brand: "Apple",
          model: "iPhone 14 Pro",
        },
        issues: ["Screen Cracked/Broken"],
        serviceType: "collection",
        address: {
          street: "123 Main Street",
          city: "Mumbai",
          pincode: "400001",
          state: "Maharashtra",
        },
        duration: "standard",
        pricing: {
          basePrice: 2000,
          durationCharge: 500,
          totalAmount: 2500,
        },
        payment: {
          method: "stripe",
          status: "paid",
        },
        status: "completed",
        timeline: [
          { status: "created", message: "Booking created successfully" },
          { status: "assigned", message: "Assigned to Tech Solutions" },
          { status: "in-progress", message: "Repair work started" },
          { status: "completed", message: "Repair completed successfully" },
        ],
        review: {
          rating: 5,
          comment: "Excellent service! Very professional and quick.",
          createdAt: new Date(),
        },
      },
      {
        bookingId: generateBookingId(),
        customerId: customerUsers[1]._id,
        agentId: createdAgents[1]._id,
        device: {
          category: "mobile",
          brand: "Samsung",
          model: "Galaxy S23",
        },
        issues: ["Battery Issues"],
        serviceType: "local",
        duration: "express",
        pricing: {
          basePrice: 2000,
          durationCharge: 1000,
          totalAmount: 3000,
        },
        payment: {
          method: "cash",
          status: "pending",
        },
        status: "in-progress",
        timeline: [
          { status: "created", message: "Booking created successfully" },
          { status: "assigned", message: "Assigned to Mobile Care Center" },
          { status: "in-progress", message: "Repair work started" },
        ],
      },
    ]

    await Booking.insertMany(sampleBookings)
    console.log("📋 Seeded sample bookings")

    console.log("🎉 Database seeding completed successfully!")
    console.log("\n📊 Seeded data summary:")
    console.log(`   Cities: ${cities.length}`)
    console.log(`   Devices: ${devices.length}`)
    console.log(`   Users: ${users.length}`)
    console.log(`   Agents: ${agents.length}`)
    console.log(`   Bookings: ${sampleBookings.length}`)

    console.log("\n🔐 Default login credentials:")
    console.log("   Admin: admin@repairhub.com / admin123")
    console.log("   Customer: john@example.com / customer123")
    console.log("   Agent: rajesh@techsolutions.com / agent123")
  } catch (error) {
    console.error("❌ Seeding failed:", error)
  } finally {
    await mongoose.connection.close()
    console.log("🔌 Database connection closed")
    process.exit(0)
  }
}

// Run seeding
seedDatabase()
