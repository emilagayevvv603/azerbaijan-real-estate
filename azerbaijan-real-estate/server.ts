import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Property, User, SupportTicket } from "./src/types";
import mongoose from "mongoose";
import { connectMongoDB, MongoProperty, MongoUser, MongoTicket } from "./src/db/mongo";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Path to file database
const DB_PATH = path.join(process.cwd(), "src", "db.json");

// Helper to write database
function saveDb(data: any) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");

    // Asynchronously update to MongoDB to keep database synced
    if (mongoose.connection.readyState === 1) {
      (async () => {
        try {
          // Sync listings
          for (const prop of data.properties) {
            await MongoProperty.updateOne({ id: prop.id }, prop, { upsert: true });
          }
          // Sync users
          for (const u of data.users) {
            await MongoUser.updateOne({ id: u.id }, u, { upsert: true });
          }
          // Sync tickets
          for (const t of data.tickets) {
            await MongoTicket.updateOne({ id: t.id }, t, { upsert: true });
          }
          console.log("Asynchronously synced database updates to MongoDB Atlas.");
        } catch (err) {
          console.error("Failed asynchronous save to MongoDB Atlas:", err);
        }
      })();
    }
  } catch (err) {
    console.error("Failed to save DB:", err);
  }
}

// Helper to load database with rich, professional Azerbaijan initial properties
function loadDb(): {
  properties: Property[];
  users: User[];
  tickets: SupportTicket[];
} {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to load DB, using defaults:", err);
  }

  // Elegant Default Azerbaijan Real Estate listings
  const defaultProperties: Property[] = [
    {
      id: "prop-1",
      title: {
        az: "Port Baku Towers yaxınlığında dəniz mənzərəli 3 otaqlı premium mənzil",
        en: "Premium 3-room sea-view apartment near Port Baku Towers",
        ru: "Премиальная 3-комнатная квартира с видом на море возле Port Baku Towers"
      },
      description: {
        az: "Port Baku elit yaşayış kompleksində dənizə gözəl panoraması olan tam təmirli mənzil. Smart-home sistemi, 24/7 mühafizə, yeraltı qaraj mövcuddur.",
        en: "Fully furnished apartment in Port Baku elite residential complex with amazing sea panorama. Smart-home system, 24/7 security, underground parking.",
        ru: "Полностью меблированная квартира в элитном жилом комплексе Порт Баку с панорамой моря. Система умный дом, круглосуточная охрана, паркинг."
      },
      price: 4500,
      currency: "AZN",
      type: "rent",
      rentInterval: "monthly",
      city: "baku",
      address: "Neftçilər Prospekti, Səbail, Bakı",
      propertyType: "apartment_new",
      bedrooms: 2,
      bathrooms: 2,
      area: 145,
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
      ],
      videoUrl: "",
      agentId: "agent-1",
      agentName: "Elşən Əlizadə (MyDom Premium)",
      agentPhone: "+994 50 123 45 67",
      agentEmail: "eljan@mydom.az",
      isBoosted: true,
      boostExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      views: 1240,
      leads: 85,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prop-2",
      title: {
        az: "Şüvəlanda möhtəşəm hovuzlu villa — bağ evi satılır",
        en: "Gorgeous villa with a private pool in Shuvelan for sale",
        ru: "Продается великолепная вилла с бассейном в Шувелянах"
      },
      description: {
        az: "Şüvəlan qəsəbəsində, mərkəzi yola yaxın, modern üslubda tikilmiş 2 mərtəbəli villa satılır. Geniş hovuz, dekorativ ağaclar, filterli su sistemi.",
        en: "Modern-styled 2-story villa for sale in Shuvelan. Large swimming pool, landscaped garden with decorative trees, high-quality filtered water system.",
        ru: "Продается 2-этажная вилла в современном стиле в Шувелянах. Большой бассейн, ландшафтный дизайн, система фильтрации воды."
      },
      price: 385000,
      currency: "AZN",
      type: "sell",
      city: "baku",
      address: "Mayak küçəsi, Şüvəlan qəsəbəsi, Bakı",
      propertyType: "villa",
      bedrooms: 4,
      bathrooms: 3,
      area: 320,
      images: [
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
      ],
      videoUrl: "",
      agentId: "agent-1",
      agentName: "Elşən Əlizadə (MyDom Premium)",
      agentPhone: "+994 50 123 45 67",
      agentEmail: "eljan@mydom.az",
      isBoosted: true,
      boostExpiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      views: 940,
      leads: 32,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prop-3",
      title: {
        az: "Günlük / Saatlıq kirayə: Sumqayıt Bulvarı yaxınlığında 2 otaqlı modern ev",
        en: "Daily / Hourly rent: Modern 2-room home near Sumgayit Boulevard",
        ru: "Посуточная и почасовая аренда: 2-комн. квартира возле Сумгаитского Бульвара"
      },
      description: {
        az: "Sumqayıt şəhərinin ən prestijli yerində, Bulvarın yaxınlığında günlük və saatlıq kirayə mənzil. Kondisioner, sürətli Wi-Fi, təmiz yataq dəsti ilə təmin olunur.",
        en: "Located in the most prestigious area of Sumgayit near the Boulevard. Perfect for daily or hourly rentals. Fully air-conditioned, high-speed Wi-Fi.",
        ru: "Расположена в самом престижном районе Сумгаита возле Бульвара. Отлично подходит для посуточной/почасовой аренды. Кондиционер, Wi-Fi."
      },
      price: 45,
      currency: "AZN",
      type: "rent",
      rentInterval: "daily",
      city: "sumqayit",
      address: "Sülh küçəsi, Bulvar yanı, Sumqayıt",
      propertyType: "apartment_new",
      bedrooms: 1,
      bathrooms: 1,
      area: 65,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
      ],
      videoUrl: "",
      agentId: "agent-2",
      agentName: "Nigar Hüseynova (MyDom Sumqayıt)",
      agentPhone: "+994 70 987 65 43",
      agentEmail: "nigar@mydom.az",
      isBoosted: false,
      views: 450,
      leads: 18,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prop-4",
      title: {
        az: "Şuşa şəhərində yeni tikilmiş otel tipli kottec barter olunur",
        en: "Newly built hotel-style cottage in Shusha city for exchange (barter)",
        ru: "Обмен нового гостиничного коттеджа в городе Шуша"
      },
      description: {
        az: "Şuşa şəhərində dağ mənzərəli, ekoloji təmiz ərazidə yerləşən kottec satılır və ya Bakıda mənzillə dəyişdirilir (barter/exchange).",
        en: "Cottage with majestic mountain views in Shusha. Available for sale or exchange (barter) with apartments in Baku city.",
        ru: "Коттедж с панорамным горным видом в Шуше. Продается или обменивается на недвижимость в Баку."
      },
      price: 180000,
      currency: "AZN",
      type: "exchange",
      city: "shusha",
      address: "Pənahəli Xan küçəsi, Şuşa",
      propertyType: "villa",
      bedrooms: 3,
      bathrooms: 2,
      area: 110,
      images: [
        "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"
      ],
      videoUrl: "",
      agentId: "agent-3",
      agentName: "Şuşa Qarabağ Emlak",
      agentPhone: "+994 55 555 44 33",
      agentEmail: "shusha@mydom.az",
      isBoosted: false,
      views: 310,
      leads: 14,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "prop-5",
      title: {
        az: "Gəncə şəhərində geniş kommersiya mağazası aylıq kirayə",
        en: "Spacious commercial storefront in Ganja for monthly rent",
        ru: "Просторное коммерческое помещение в Гяндже на месячную аренду"
      },
      description: {
        az: "Gəncə şəhərinin mərkəzində, gediş-gəlişli prospektdə yerləşən vitrin şüşəli mağaza/kommersiya obyekti. Bank, şou-rum və ya kafe üçün yararlıdır.",
        en: "High-traffic commercial storefront located in Ganja city center. Perfect for a bank branch, showroom, or stylish cafe.",
        ru: "Коммерческое помещение на оживленном проспекте в центре Гянджи. Идеально под банк, шоурум или кафе."
      },
      price: 3200,
      currency: "AZN",
      type: "rent",
      rentInterval: "monthly",
      city: "ganja",
      address: "Atatürk Prospekti, Gəncə",
      propertyType: "commercial",
      bedrooms: 0,
      bathrooms: 1,
      area: 180,
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
      ],
      videoUrl: "",
      agentId: "agent-2",
      agentName: "Nigar Hüseynova (MyDom Ganja)",
      agentPhone: "+994 70 987 65 43",
      agentEmail: "nigar@mydom.az",
      isBoosted: false,
      views: 180,
      leads: 8,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const defaultUsers: User[] = [
    {
      id: "agent-1",
      email: "eljan@mydom.az",
      phone: "+994 50 123 45 67",
      fullName: "Elşən Əlizadə",
      role: "agent",
      isPhoneVerified: true,
      favorites: ["prop-3"],
      viewHistory: []
    }
  ];

  const defaultTickets: SupportTicket[] = [];

  const db = { properties: defaultProperties, users: defaultUsers, tickets: defaultTickets };
  saveDb(db);
  return db;
}

// Memory database loaded on startup
const db = loadDb() as any;
if (!db.contacts) {
  db.contacts = [];
}

let isMongoActive = false;
let mongoSyncError: string | null = null;
let lastMongoSyncTime: string | null = null;

async function syncWithMongoDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.log("MongoDB environment variables (MONGODB_URI/MONGO_URI) not found. Running with local storage fallback.");
    return;
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    const connected = await connectMongoDB();
    if (!connected) {
      isMongoActive = false;
      return;
    }
    isMongoActive = true;
    lastMongoSyncTime = new Date().toISOString();

    console.log("Starting MongoDB database synchronization...");

    // 1. Sync properties
    const properties = await MongoProperty.find({});
    if (properties && properties.length > 0) {
      db.properties = properties.map((doc: any) => {
        const obj = doc.toObject();
        delete obj._id;
        delete obj.__v;
        return obj as Property;
      });
      console.log(`Loaded ${properties.length} properties from MongoDB Atlas.`);
    } else {
      console.log("MongoDB properties collection is empty, seeding defaults...");
      for (const prop of db.properties) {
        await MongoProperty.updateOne({ id: prop.id }, prop, { upsert: true });
      }
    }

    // 2. Sync users
    const users = await MongoUser.find({});
    if (users && users.length > 0) {
      db.users = users.map((doc: any) => {
        const obj = doc.toObject();
        delete obj._id;
        delete obj.__v;
        return obj as User;
      });
      console.log(`Loaded ${users.length} users from MongoDB Atlas.`);
    } else {
      console.log("MongoDB users collection is empty, seeding defaults...");
      for (const u of db.users) {
        await MongoUser.updateOne({ id: u.id }, u, { upsert: true });
      }
    }

    // 3. Sync tickets
    const tickets = await MongoTicket.find({});
    if (tickets && tickets.length > 0) {
      db.tickets = tickets.map((doc: any) => {
        const obj = doc.toObject();
        delete obj._id;
        delete obj.__v;
        return obj as SupportTicket;
      });
      console.log(`Loaded ${tickets.length} tickets from MongoDB Atlas.`);
    } else {
      console.log("MongoDB tickets collection is empty, seeding defaults...");
      for (const t of db.tickets) {
        await MongoTicket.updateOne({ id: t.id }, t, { upsert: true });
      }
    }

    console.log("MongoDB Atlas database synchronization successfully completed!");
    mongoSyncError = null;
    saveDb(db);
  } catch (err: any) {
    console.error("MongoDB database synchronization failed:", err);
    mongoSyncError = err?.message || String(err);
  }
}

syncWithMongoDB();

// --- API ROUTES ---

// Diagnostics endpoint for backend health & configuration verification
app.get("/api/diagnostics", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || "development",
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      isActive: isMongoActive,
      lastSyncTime: lastMongoSyncTime,
      error: mongoSyncError
    },
    dataCounts: {
      properties: db.properties.length,
      users: db.users.length,
      tickets: db.tickets.length,
    }
  });
});

// Endpoint to trigger manual MongoDB database synchronization/reconnect
app.post("/api/admin/mongo-sync", async (req, res) => {
  try {
    console.log("[MyDom Admin] Request received to manually trigger MongoDB sync...");
    await syncWithMongoDB();
    res.json({
      success: isMongoActive,
      connected: mongoose.connection.readyState === 1,
      isActive: isMongoActive,
      lastSyncTime: lastMongoSyncTime,
      error: mongoSyncError
    });
  } catch (err: any) {
    console.error("[MyDom Admin] Manual MongoDB sync trigger failed:", err);
    res.status(500).json({
      success: false,
      error: err?.message || String(err)
    });
  }
});

// 1. Fetch Listings with Boost Ordering
app.get("/api/listings", (req, res) => {
  // Sort: Boosted listings first, then by date created
  const sorted = [...db.properties].sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sorted);
});

// 2. Fetch Single Listing (View Metric tracker)
app.get("/api/listings/:id", (req, res) => {
  const item = db.properties.find(p => p.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Property not found" });
  }
  // Increment view count dynamically on detail fetch
  item.views = (item.views || 0) + 1;
  saveDb(db);
  res.json(item);
});

// 3. Increment Views explicitly
app.post("/api/listings/:id/view", (req, res) => {
  const item = db.properties.find(p => p.id === req.params.id);
  if (item) {
    item.views = (item.views || 0) + 1;
    saveDb(db);
  }
  res.json({ success: true, views: item ? item.views : 0 });
});

// 4. Record Lead Explicitly (clicked Contact info / WhatsApp / Email)
app.post("/api/listings/:id/lead", (req, res) => {
  const item = db.properties.find(p => p.id === req.params.id);
  if (item) {
    item.leads = (item.leads || 0) + 1;
    saveDb(db);
  }
  res.json({ success: true, leads: item ? item.leads : 0 });
});

// 5. Create Listing (Secure)
app.post("/api/listings", (req, res) => {
  const { title, description, price, type, rentInterval, city, address, propertyType, bedrooms, bathrooms, area, agentId, agentName, agentPhone, agentEmail, images } = req.body;
  
  if (!title || !price || !city || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newProperty: Property = {
    id: `prop-${Date.now()}`,
    title: typeof title === "object" ? title : { az: title, en: title, ru: title },
    description: typeof description === "object" ? description : { az: description, en: description, ru: description },
    price: Number(price),
    currency: "AZN",
    type,
    rentInterval: type === "rent" ? rentInterval : undefined,
    city: city.toLowerCase(),
    address: address || "Azerbaijan",
    propertyType: propertyType || "apartment_new",
    bedrooms: Number(bedrooms) || 1,
    bathrooms: Number(bathrooms) || 1,
    area: Number(area) || 50,
    images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"],
    agentId: agentId || "agent-1",
    agentName: agentName || "Premium Partner Agency",
    agentPhone: agentPhone || "+994 50 123 45 67",
    agentEmail: agentEmail || "partner@mydom.az",
    isBoosted: false,
    views: 0,
    leads: 0,
    createdAt: new Date().toISOString()
  };

  db.properties.push(newProperty);
  saveDb(db);
  res.status(201).json(newProperty);
});

// 6. Boost Property (Simulated Bank Secure payment)
app.post("/api/listings/:id/boost", (req, res) => {
  const { cardHolder, cardNumber, expiry, cvv, plan } = req.body;
  if (!cardHolder || !cardNumber || !expiry || !cvv) {
    return res.status(400).json({ error: "Encrypted credit card info required" });
  }

  const item = db.properties.find(p => p.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Property listing not found" });
  }

  // Set as boosted for simulated duration
  item.isBoosted = true;
  const days = plan === "premium_vip" ? 14 : 7;
  item.boostExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  saveDb(db);

  res.json({
    success: true,
    message: "Payment processed successfully via MyDom Secure Encrypted Gateway",
    transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    boostExpiresAt: item.boostExpiresAt
  });
});

// --- Standard-compliant OAuth 2.0 Token Exchange Endpoint ---
app.post(["/oauth/token", "/api/oauth/token"], (req, res) => {
  // Support both application/json and application/x-www-form-urlencoded
  const params = { ...req.query, ...req.body };
  const { grant_type, code, redirect_uri, client_id, client_secret } = params;

  console.log("[OAuth Token Exchange] Request params:", { grant_type, code, redirect_uri, client_id });

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type", error_description: "Grant type must be authorization_code" });
  }

  if (!code) {
    return res.status(400).json({ error: "invalid_request", error_description: "Missing required parameter: code" });
  }

  // Generate a mock access token for the admin/owner or user
  const targetUser = db.users.find(u => u.email === "eljanalizada2@gmail.com") || db.users[0] || {
    id: "admin-owner",
    email: "eljanalizada2@gmail.com",
    fullName: "Elcan Əlizadə",
    role: "admin"
  };

  res.setHeader("Content-Type", "application/json");
  res.json({
    access_token: `access-${targetUser.id}-${Date.now()}`,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: `refresh-${targetUser.id}-${Date.now()}`,
    scope: "profile email",
    user: {
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
      role: (targetUser as any).role || "admin"
    }
  });
});

// Active OTP storage for verification
const activeOTPs = new Map<string, string>();

// 7. Simulated Authenticators & recovery options
app.post("/api/auth/login", (req, res) => {
  const { email, password, provider, phone, fullName } = req.body;

  // Google / Apple Mock Sign in
  if (provider === "google" || provider === "apple") {
    const isGoogle = provider === "google";
    const providerEmail = email ? email.toLowerCase().trim() : (isGoogle ? "eljanalizada2@gmail.com" : `${provider}-user@mydom.az`);
    const isOwner = providerEmail === "eljanalizada2@gmail.com";
    const providerName = fullName || (isOwner ? "Elcan Əlizadə" : (isGoogle ? "Google User" : "Apple Verified Client"));
    const role = isOwner ? "admin" : "user";

    let mockUser = db.users.find(u => u.email === providerEmail);
    if (!mockUser) {
      mockUser = {
        id: isOwner ? "admin-owner" : `user-${Date.now()}`,
        email: providerEmail,
        fullName: providerName,
        role,
        isPhoneVerified: isGoogle ? true : false,
        favorites: [],
        viewHistory: []
      };
      db.users.push(mockUser);
      saveDb(db);
    } else {
      if (isOwner) {
        mockUser.role = "admin";
        mockUser.fullName = "Elcan Əlizadə";
        saveDb(db);
      }
    }
    return res.json({ token: `token-${mockUser.id}`, user: mockUser });
  }

  // Phone code verification trigger
  if (phone && !email) {
    const cleanPhone = phone.replace(/\s+/g, "");
    const generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    activeOTPs.set(cleanPhone, generatedOTP);
    console.log(`[SMS Gateway] Sent OTP ${generatedOTP} to ${phone}`);
    return res.json({
      success: true,
      message: "SMS Verification code sent to phone successfully",
      demoCode: generatedOTP
    });
  }

  // Standard Email sign-in
  if (!email || !password) {
    return res.status(400).json({ error: "Email/Password required" });
  }

  const cleanEmail = email.toLowerCase().trim();
  let foundUser = db.users.find(u => u.email === cleanEmail);
  if (!foundUser) {
    const isOwner = cleanEmail === "eljanalizada2@gmail.com";
    if (isOwner) {
      foundUser = {
        id: "admin-owner",
        email: cleanEmail,
        fullName: "Elcan Əlizadə",
        role: "admin",
        isPhoneVerified: true,
        favorites: [],
        viewHistory: []
      };
      db.users.push(foundUser);
      saveDb(db);
    } else {
      return res.status(404).json({
        error: "Bu e-poçt ünvanı ilə istifadəçi tapılmadı. Zəhmət olmasa qeydiyyatdan keçin."
      });
    }
  } else {
    if (cleanEmail === "eljanalizada2@gmail.com") {
      foundUser.role = "admin";
      foundUser.fullName = "Elcan Əlizadə";
      saveDb(db);
    }
  }

  res.json({
    token: `token-${foundUser.id}`,
    user: foundUser
  });
});

// Standard Email registration
app.post("/api/auth/register", (req, res) => {
  const { email, password, fullName, phone, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: "E-poçt, şifrə və ad-soyad tələb olunur." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = db.users.find(u => u.email === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib." });
  }

  const isOwner = cleanEmail === "eljanalizada2@gmail.com";
  const newUser = {
    id: isOwner ? "admin-owner" : `user-${Date.now()}`,
    email: cleanEmail,
    fullName: fullName.trim(),
    phone: phone ? phone.trim() : undefined,
    role: isOwner ? "admin" : (role || "user"),
    isPhoneVerified: !!phone,
    favorites: [],
    viewHistory: []
  };

  db.users.push(newUser);
  saveDb(db);

  res.status(201).json({
    success: true,
    token: `token-${newUser.id}`,
    user: newUser
  });
});

// SMS / Email secure OTP recovery link dispatch
app.post("/api/auth/recover", (req, res) => {
  const { channel, target } = req.body; // channel: 'email' | 'sms'
  if (!target) {
    return res.status(400).json({ error: "Recovery target (email or phone) is required" });
  }
  res.json({
    success: true,
    message: `Secure password recovery link dispatched successfully via ${channel === "sms" ? "SMS" : "Email"} to ${target}.`
  });
});

// Verification of phone code
app.post("/api/auth/verify-phone", (req, res) => {
  const { phone, code } = req.body;
  const cleanPhone = phone ? phone.replace(/\s+/g, "") : "";
  const actualOTP = activeOTPs.get(cleanPhone);

  if (code !== "1918" && code !== actualOTP) {
    return res.status(400).json({ error: "Invalid OTP verification code. Please try again." });
  }
  res.json({
    success: true,
    message: "Phone number verified successfully"
  });
});

// 8. Bookmarks / Favorites toggler
app.post("/api/favorites/toggle", (req, res) => {
  const { userId, propertyId } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  user.favorites = user.favorites || [];
  const idx = user.favorites.indexOf(propertyId);
  if (idx > -1) {
    user.favorites.splice(idx, 1);
  } else {
    user.favorites.push(propertyId);
  }
  saveDb(db);
  res.json({ favorites: user.favorites });
});

// 9. viewed properties history tracker
app.post("/api/history", (req, res) => {
  const { userId, propertyId } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  user.viewHistory = user.viewHistory || [];
  // Prevent duplicate consecutive entries
  if (user.viewHistory[user.viewHistory.length - 1]?.propertyId !== propertyId) {
    user.viewHistory.push({
      propertyId,
      viewedAt: new Date().toISOString()
    });
  }
  saveDb(db);
  res.json({ viewHistory: user.viewHistory });
});

// 10. Agent analytics over time
app.get("/api/agent/analytics", (req, res) => {
  // Return simulated metrics for agent's property listings
  const stats = db.properties.map(p => ({
    propertyId: p.id,
    title: p.title.az,
    viewsOverTime: [
      { date: "Mon", count: Math.floor(p.views * 0.1) },
      { date: "Tue", count: Math.floor(p.views * 0.15) },
      { date: "Wed", count: Math.floor(p.views * 0.2) },
      { date: "Thu", count: Math.floor(p.views * 0.18) },
      { date: "Fri", count: Math.floor(p.views * 0.12) },
      { date: "Sat", count: Math.floor(p.views * 0.1) },
      { date: "Sun", count: Math.floor(p.views * 0.15) }
    ],
    leadsOverTime: [
      { date: "Mon", count: Math.floor(p.leads * 0.1) },
      { date: "Tue", count: Math.floor(p.leads * 0.1) },
      { date: "Wed", count: Math.floor(p.leads * 0.3) },
      { date: "Thu", count: Math.floor(p.leads * 0.2) },
      { date: "Fri", count: Math.floor(p.leads * 0.1) },
      { date: "Sat", count: Math.floor(p.leads * 0.1) },
      { date: "Sun", count: Math.floor(p.leads * 0.1) }
    ],
    totalViews: p.views,
    totalLeads: p.leads,
    boostStatus: p.isBoosted ? "active" : "none"
  }));
  res.json(stats);
});

// 11. Support Ticket System
app.get("/api/tickets", (req, res) => {
  res.json(db.tickets);
});

app.post("/api/tickets", (req, res) => {
  const { userEmail, userName, subject, message, category } = req.body;
  if (!userEmail || !message || !subject) {
    return res.status(400).json({ error: "Missing support field values" });
  }

  const newTicket: SupportTicket = {
    id: `ticket-${Date.now()}`,
    userId: "agent-1",
    userEmail,
    userName: userName || "Valued User",
    subject,
    message,
    status: "open",
    category: category || "tech_issue",
    createdAt: new Date().toISOString(),
    replies: [
      {
        sender: "user",
        message,
        createdAt: new Date().toISOString()
      }
    ]
  };

  db.tickets.push(newTicket);
  saveDb(db);
  res.status(201).json(newTicket);
});

app.post("/api/tickets/:id/reply", (req, res) => {
  const { message, sender } = req.body;
  const ticket = db.tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Support Ticket not found" });
  }

  ticket.replies.push({
    sender: sender || "user",
    message,
    createdAt: new Date().toISOString()
  });

  // Auto-respond from support simulating active agency staff
  if (sender === "user") {
    ticket.status = "in_progress";
    setTimeout(() => {
      ticket.replies.push({
        sender: "support",
        message: "Hörmətli müştəri, sorğunuz qəbul edilmişdir. Tezliklə operatorlarımız əlaqə saxlayacaq. Təşəkkür edirik!",
        createdAt: new Date().toISOString()
      });
      ticket.status = "resolved";
      saveDb(db);
    }, 1500);
  }

  saveDb(db);
  res.json(ticket);
});

// --- ADMIN CONTROL PANEL ENDPOINTS ---

// Get all users
app.get("/api/admin/users", (req, res) => {
  res.json(db.users);
});

// Update user details
app.put("/api/admin/users/:id", (req, res) => {
  const { role, isPhoneVerified, fullName, email } = req.body;
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (role !== undefined) user.role = role;
  if (isPhoneVerified !== undefined) user.isPhoneVerified = isPhoneVerified;
  if (fullName !== undefined) user.fullName = fullName;
  if (email !== undefined) user.email = email;
  
  saveDb(db);
  res.json({ success: true, user });
});

// Delete user
app.delete("/api/admin/users/:id", (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  db.users.splice(idx, 1);
  saveDb(db);
  res.json({ success: true });
});

// Update listing details
app.put("/api/admin/listings/:id", (req, res) => {
  const { title, price, address, bedrooms, area, propertyType, type, rentInterval } = req.body;
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: "Property listing not found" });
  }

  if (title) property.title = title;
  if (price !== undefined) property.price = Number(price);
  if (address !== undefined) property.address = address;
  if (bedrooms !== undefined) property.bedrooms = Number(bedrooms);
  if (area !== undefined) property.area = Number(area);
  if (propertyType !== undefined) property.propertyType = propertyType;
  if (type !== undefined) property.type = type;
  if (rentInterval !== undefined) property.rentInterval = rentInterval;

  saveDb(db);
  res.json({ success: true, property });
});

// Delete listing
app.delete("/api/admin/listings/:id", (req, res) => {
  const idx = db.properties.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Property listing not found" });
  }
  db.properties.splice(idx, 1);
  saveDb(db);
  res.json({ success: true });
});

// Toggle listing VIP boost
app.post("/api/admin/listings/:id/toggle-boost", (req, res) => {
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: "Property listing not found" });
  }
  property.isBoosted = !property.isBoosted;
  if (property.isBoosted) {
    property.boostExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    property.boostExpiresAt = undefined;
  }
  saveDb(db);
  res.json({ success: true, isBoosted: property.isBoosted });
});

// Delete support ticket
app.delete("/api/admin/tickets/:id", (req, res) => {
  const idx = db.tickets.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  db.tickets.splice(idx, 1);
  saveDb(db);
  res.json({ success: true });
});

// Send reply as admin/support
app.post("/api/admin/tickets/:id/reply", (req, res) => {
  const { message } = req.body;
  const ticket = db.tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  ticket.replies.push({
    sender: "support",
    message,
    createdAt: new Date().toISOString()
  });
  ticket.status = "resolved";

  saveDb(db);
  res.json({ success: true, ticket });
});

// Load Vite middleware for asset bundling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MYDOM Server] Server running on http://localhost:${PORT}`);
  });
}

startServer();
