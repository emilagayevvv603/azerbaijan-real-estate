export interface Property {
  id: string;
  title: {
    az: string;
    en: string;
    ru: string;
  };
  description: {
    az: string;
    en: string;
    ru: string;
  };
  price: number;
  currency: string;
  type: 'sell' | 'rent' | 'exchange';
  rentInterval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  city: string; // City ID (e.g. "baku", "sumgait")
  address: string;
  propertyType: 'apartment_new' | 'apartment_old' | 'villa' | 'office' | 'land' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  area: number; // in sq meters
  images: string[];
  videoUrl?: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  isBoosted: boolean;
  boostExpiresAt?: string;
  views: number;
  leads: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: 'user' | 'agent' | 'admin';
  isPhoneVerified: boolean;
  favorites: string[]; // List of propertyIds
  viewHistory: { propertyId: string; viewedAt: string }[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  category: 'payment' | 'listing' | 'tech_issue' | 'other';
  createdAt: string;
  replies: {
    sender: 'user' | 'support';
    message: string;
    createdAt: string;
  }[];
}

export interface PropertyPerformance {
  propertyId: string;
  title: string;
  viewsOverTime: { date: string; count: number }[];
  leadsOverTime: { date: string; count: number }[];
  totalViews: number;
  totalLeads: number;
  boostStatus: 'active' | 'none';
}

export interface CRMContact {
  id: string;
  agentId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  source: 'google' | 'manual';
  notes?: string;
  createdAt: string;
}

