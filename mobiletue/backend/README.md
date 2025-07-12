# Mobile Repair Service - Backend API

A comprehensive backend API for a mobile device repair service platform built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Customer, Agent, Admin)
  - Email verification with OTP
  - Password reset functionality

- **User Management**
  - Customer registration and profile management
  - Agent application and approval system
  - Admin dashboard with full control

- **Booking System**
  - Device selection with categories, brands, and models
  - Multiple service types (Local, Collection & Delivery, Postal)
  - Real-time booking status updates
  - Express delivery with agent approval

- **Payment Integration**
  - Stripe payment processing
  - Cash on service option
  - Webhook handling for payment events

- **File Upload**
  - Cloudinary integration for image uploads
  - Support for multiple image uploads
  - Automatic image optimization

- **Real-time Communication**
  - Socket.io for real-time notifications
  - Chat functionality between customers and agents
  - Live booking status updates

- **Review System**
  - Customer reviews and ratings
  - Agent rating calculation
  - Review management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Cloudinary
- **Email Service**: Nodemailer (Gmail SMTP)
- **Payment Processing**: Stripe
- **Real-time Communication**: Socket.io
- **Environment Variables**: dotenv

## Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd backend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup**
   \`\`\`bash
   cp .env.sample .env
   \`\`\`
   
   Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret key
   - Email credentials (Gmail)
   - Cloudinary credentials
   - Stripe API keys

4. **Database Setup**
   \`\`\`bash
   # Seed the database with sample data
   npm run seed
   \`\`\`

5. **Start the server**
   \`\`\`bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/change-password` - Change password

### Agents
- `POST /api/agents/apply` - Submit agent application
- `GET /api/agents/by-city/:cityName` - Get agents by city
- `GET /api/agents/profile` - Get agent profile
- `PATCH /api/agents/profile` - Update agent profile

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/agent-bookings` - Get agent bookings
- `PATCH /api/bookings/:bookingId/status` - Update booking status
- `PATCH /api/bookings/:bookingId/respond` - Accept/decline booking
- `POST /api/bookings/:bookingId/review` - Add review

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/agent-requests` - Get agent applications
- `PATCH /api/admin/agent-requests/:requestId` - Approve/reject agent
- `GET /api/admin/bookings` - Get all bookings
- `PATCH /api/admin/bookings/:bookingId/reassign` - Reassign booking
- `GET /api/admin/devices` - Get devices
- `POST /api/admin/devices` - Add device
- `GET /api/admin/cities` - Get cities
- `POST /api/admin/cities` - Add city

### Devices
- `GET /api/devices/categories` - Get device categories
- `GET /api/devices/brands/:category` - Get brands by category
- `GET /api/devices/models/:category/:brand` - Get models

### Cities
- `GET /api/cities` - Get all cities
- `GET /api/cities/:cityName` - Get city by name

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook handler

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image

## Database Models

### User
- Personal information (name, email, phone)
- Authentication data (password, verification status)
- Role-based access (customer, agent, admin)
- Address information

### Agent
- Shop information (name, address, specializations)
- Performance metrics (rating, reviews, completed jobs)
- Document storage (ID proof, shop images)
- Bank details for payments

### Booking
- Device information (category, brand, model)
- Service details (type, issues, images)
- Scheduling (collection/delivery dates)
- Payment information (method, status, amount)
- Status tracking with timeline
- Review and rating system

### Device
- Categorized device database
- Brand and model information
- Active/inactive status

### City
- Service area management
- Pincode mapping
- Agent assignment by location

## Real-time Features

The application uses Socket.io for real-time communication:

- **Booking Notifications**: Agents receive instant notifications for new bookings
- **Status Updates**: Customers get real-time updates on repair progress
- **Chat System**: Direct communication between customers and agents
- **Payment Notifications**: Instant payment confirmation

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permission levels for users
- **Input Validation**: Mongoose schema validation
- **File Upload Security**: Cloudinary integration with file type validation
- **CORS Configuration**: Controlled cross-origin requests

## Error Handling

- Centralized error handling middleware
- Detailed error logging
- User-friendly error messages
- HTTP status code standards

## Testing

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
\`\`\`

## Deployment

### Environment Variables
Ensure all required environment variables are set:
- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB connection
- `JWT_SECRET` - Strong secret key
- Email and payment service credentials

### Database
- Use MongoDB Atlas for production
- Enable authentication and SSL
- Set up proper indexes for performance

### File Storage
- Configure Cloudinary for production
- Set up proper folder structure
- Enable automatic optimization

### Monitoring
- Implement logging (Winston/Morgan)
- Set up error tracking (Sentry)
- Monitor performance metrics

## Default Credentials

After running the seed script, you can use these credentials:

- **Admin**: admin@repairhub.com / admin123
- **Customer**: john@example.com / customer123  
- **Agent**: rajesh@techsolutions.com / agent123

## Support

For support and questions, please contact the development team or create an issue in the repository.

## License

This project is licensed under the MIT License.
\`\`\`

The backend is now complete with all the necessary functionality to support the frontend application. The backend includes:

1. **Complete Authentication System** - Registration, login, email verification, password reset
2. **Role-based Access Control** - Customer, Agent, and Admin roles with appropriate permissions
3. **Comprehensive Booking System** - Device selection, service types, scheduling, payments
4. **Real-time Communication** - Socket.io for notifications and chat
5. **File Upload System** - Cloudinary integration for image uploads
6. **Payment Processing** - Stripe integration with webhooks
7. **Admin Dashboard** - Complete management system for agents, bookings, devices, and cities
8. **Database Models** - Well-structured MongoDB schemas
9. **Seed Script** - Sample data for testing
10. **Proper Error Handling** - Centralized error management
11. **Security Features** - JWT authentication, password hashing, input validation

All the buttons and features from the frontend will work correctly with this backend implementation. The API endpoints match the frontend requirements and provide all necessary functionality for the mobile repair service application.
