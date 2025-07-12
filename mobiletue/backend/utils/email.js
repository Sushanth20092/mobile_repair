const nodemailer = require("nodemailer")

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `"RepairHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)
    return result
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">RepairHub - Email Verification</h2>
      <p>Your OTP for email verification is:</p>
      <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: "Email Verification OTP - RepairHub",
    html,
  })
}

module.exports = {
  sendEmail,
  sendOTPEmail,
}
