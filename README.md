# EarnSaga Lite ⚡️

EarnSaga Lite is a modern, high-performance rewards and offerwall platform built with React, Go, and PostgreSQL. It integrates directly with the PubScale Sandbox API to provide users with a native, immersive experience where they can complete tasks, earn coins, and redeem rewards.

![EarnSaga UI](https://img.shields.io/badge/UI-Vite_React-646CFF?style=flat-square&logo=vite)
![Backend](https://img.shields.io/badge/Backend-Go_Gin-00ADD8?style=flat-square&logo=go)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)

---

## ✨ Features

- **Dynamic Offerwall**: Real-time integration with PubScale API to fetch high-paying tasks.
- **Smart Filtering**: Filter by Desktop, Android, iOS, or by specific categories like "Game Rewards" and "Signup Rewards".
- **Deduplication Engine**: Automatically groups identical offers across different ad campaigns for a clean UI.
- **Step-by-step Progress Tracking**: Visually tracks Server-to-Server (S2S) postbacks with interactive checkmarks and point badges.
- **Wallet & Payouts**: Secure virtual wallet system allowing users to accumulate coins and redeem them for PayPal or Amazon Gift Cards.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Query, React Router v6.
- **Backend**: Go (Golang), Gin Web Framework, GORM (ORM).
- **Database**: PostgreSQL (hosted on Neon/Render).
- **Deployment**: Vercel (Frontend proxy) & Render (Backend).

---

## 🚀 Local Development

We built a custom CLI manager to make local development incredibly simple. You don't need to juggle multiple terminal tabs!

### Prerequisites
Make sure you are in the root directory:
```bash
cd earnsaga-lite
```

### The `earnsaga-lite` CLI

**1. Start the Environment**  
Starts both the Go backend (Port 8080) and Vite frontend (Port 5173) in the background:
```bash
./earnsaga-lite start
```

**2. View Server Logs**  
Watch live logs from both servers simultaneously:
```bash
./earnsaga-lite logs
```

**3. Check Status**  
See if the servers are currently running and get their Process IDs:
```bash
./earnsaga-lite status
```

**4. Stop the Environment**  
Safely shut down the backend and frontend background processes:
```bash
./earnsaga-lite stop
```

---

## ⚙️ Environment Variables

For the backend to connect to PubScale and the Database, ensure you have an `.env` file in `backend-go/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# PubScale Credentials
PUBSCALE_SECRET_KEY=your_secret_key
PUBSCALE_APP_ID=your_app_id
PUBSCALE_PUB_KEY=your_pub_key

# Optional
PORT=8080
REDIS_URL=redis://localhost:6379 (Optional: gracefully skipped if not provided)
```

---

## 🌐 Deployment Architecture

1. **Vite Frontend on Vercel**: 
   - Deployed seamlessly to Vercel. 
   - The `vite.config.ts` and `api.ts` automatically detect production environments and route `/api` traffic via Vercel Rewrites (`vercel.json`) directly to the Render backend.
2. **Go Backend on Render**:
   - Compiles down to a fast binary running on Render Web Services.
   - Connected securely to a managed PostgreSQL database.

---

## 🔒 Security

- All Server-to-Server (S2S) callbacks from PubScale are verified using an MD5 hash signature mechanism `MD5(secret_key.user_id.intValue.token)` to prevent fraudulent point injections.
- Wallet balances are protected using DB-level transactional locks to prevent race conditions during point redemptions.
