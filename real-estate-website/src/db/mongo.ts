import mongoose, { Schema } from "mongoose";

// Schemas matching the typescript interfaces
const PropertySchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: {
    az: { type: String, required: true },
    en: { type: String, required: true },
    ru: { type: String, required: true }
  },
  description: {
    az: { type: String, required: true },
    en: { type: String, required: true },
    ru: { type: String, required: true }
  },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  type: { type: String, enum: ['sell', 'rent', 'exchange'], required: true },
  rentInterval: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'] },
  city: { type: String, required: true },
  address: { type: String, required: true },
  propertyType: { type: String, enum: ['apartment_new', 'apartment_old', 'villa', 'office', 'land', 'commercial'], required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  area: { type: Number, required: true },
  images: [{ type: String }],
  videoUrl: { type: String },
  agentId: { type: String, required: true },
  agentName: { type: String, required: true },
  agentPhone: { type: String, required: true },
  agentEmail: { type: String, required: true },
  isBoosted: { type: Boolean, default: false },
  boostExpiresAt: { type: String },
  views: { type: Number, default: 0 },
  leads: { type: Number, default: 0 },
  createdAt: { type: String, required: true }
}, { minimize: false, strict: false });

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone: { type: String },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['user', 'agent', 'admin'], default: 'user' },
  isPhoneVerified: { type: Boolean, default: false },
  favorites: [{ type: String }],
  viewHistory: [{
    propertyId: { type: String },
    viewedAt: { type: String }
  }]
}, { minimize: false, strict: false });

const SupportTicketSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  category: { type: String, enum: ['payment', 'listing', 'tech_issue', 'other'], required: true },
  createdAt: { type: String, required: true },
  replies: [{
    sender: { type: String, enum: ['user', 'support'] },
    message: { type: String },
    createdAt: { type: String }
  }]
}, { minimize: false, strict: false });

// Export Models
export const MongoProperty = (mongoose.models.Property || mongoose.model("Property", PropertySchema)) as any;
export const MongoUser = (mongoose.models.User || mongoose.model("User", UserSchema)) as any;
export const MongoTicket = (mongoose.models.Ticket || mongoose.model("Ticket", SupportTicketSchema)) as any;

// Connection state helper
let isConnected = false;
export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.log("MongoDB environment variables (MONGODB_URI / MONGO_URI) not set. Local storage active.");
    return false;
  }

  if (isConnected) return true;

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("MongoDB Atlas connected successfully!");
    return true;
  } catch (err) {
    console.error("MongoDB Atlas connection failed:", err);
    return false;
  }
}
