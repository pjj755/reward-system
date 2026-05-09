# 🌙 Moonshot Rewards Platform

A full-stack rewards platform where users complete quests, earn points, and redeem real-world rewards.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14 (App Router) | Full-stack in one repo — API routes + SSR pages. No separate backend needed for MVP. |
| **Language** | TypeScript | Type safety across frontend + backend. Prisma types flow end-to-end. |
| **Database** | SQLite + Prisma ORM | Zero-config for local dev. Swap to PostgreSQL for production by changing one env var. |
| **Auth** | NextAuth.js v4 | Email magic link, Google OAuth, and MetaMask wallet login. Adapter integrates with Prisma seamlessly. |
| **Styling** | Tailwind CSS | Utility-first, fast to build, easy to customize. Custom design tokens in `tailwind.config.ts`. |
| **Fonts** | Playfair Display + DM Sans | Display serif for brand moments, clean sans for UI copy. |

---

## Architecture Decisions

### Why Next.js App Router (not separate frontend + backend)?
For a timed MVP, collocating the API and UI in one Next.js project eliminates CORS setup, deployment complexity, and context-switching. API routes in `src/app/api/` provide a clean REST-like interface that could be extracted to a standalone service later.

### Why SQLite instead of PostgreSQL?
Zero infrastructure — reviewers can clone and run without spinning up a DB. The Prisma schema is database-agnostic; switching to PostgreSQL is a one-line change in `.env`.

### Why NextAuth with multiple providers?
- **Email magic link** — no password hashing/storage complexity
- **Google OAuth** — familiar one-click login
- **MetaMask (SIWE)** — Web3-native login via signed message, no password required. Signature verified server-side with `ethers.verifyMessage`

### Points as integer cents
Points stored as integers — avoids floating point issues and keeps the schema simple.

### Atomic DB transactions for points
All point mutations (check-in, redeem) use `prisma.$transaction([...])` — if any step fails, the whole operation rolls back. No partial state.

### Creative Check-in: "Launch Sequence"
Instead of a boring button, the check-in is a **3-second animated rocket launch countdown** with orbit ring animations. This makes the daily ritual feel like an event, not a chore. Streak bonuses at days 3/7/14/30 create compounding motivation.

---

## Project Structure

```
moonshot-rewards/
├── prisma/
│   ├── schema.prisma     # DB schema (users, quests, rewards, transactions)
│   └── seed.ts           # Seed quests + rewards
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # Auth handler
│   │   │   ├── quests/              # GET all quests with user status
│   │   │   ├── checkin/             # POST daily check-in (functional)
│   │   │   ├── rewards/             # GET rewards
│   │   │   │   └── redeem/          # POST redeem reward (functional)
│   │   │   └── users/me/            # GET user profile + history
│   │   ├── auth/          # Login page (email + Google + MetaMask)
│   │   ├── quests/        # Quests storefront
│   │   ├── rewards/       # Rewards storefront
│   │   ├── profile/       # User profile + check-in calendar + history
│   │   └── page.tsx       # Home dashboard
│   ├── components/
│   │   ├── layout/Navbar.tsx
│   │   ├── profile/CheckInCalendar.tsx  # Monthly check-in heatmap
│   │   ├── quests/CheckInModal.tsx      # Animated launch sequence
│   │   └── rewards/RedeemModal.tsx
│   └── lib/
│       ├── auth.ts        # NextAuth config (email + Google + MetaMask)
│       ├── prisma.ts      # Prisma singleton
│       └── utils.ts       # Helpers
```

---

## Database Schema

```
User
  ├── id, email, walletAddress, name, image
  ├── pointsBalance, totalEarned, totalSpent
  ├── currentStreak, longestStreak, lastCheckinAt
  └── → accounts, sessions, questCompletions, redemptions, transactions

Quest         (seeded, not user-created)
  ├── type: "daily_checkin" | "social" | "profile" | "bonus" | "challenge"
  ├── category: "daily" | "one_time" | "recurring"
  ├── isFunctional: boolean
  └── → completions

Reward        (seeded)
  ├── pointCost, stock (-1 = unlimited)
  ├── isFunctional: boolean
  └── → redemptions

QuestCompletion
  ├── userId, questId, pointsEarned
  └── metadata (streak, bonus breakdown)

Redemption
  ├── userId, rewardId, pointsSpent
  └── code (generated: MOON-XXXXXX)

PointTransaction
  ├── amount (positive = earned, negative = spent)
  └── type: "quest_completion" | "redemption" | "streak_bonus"
```

---

## Local Development

### Prerequisites
- Node.js 20+
- npm

### 1. Clone & Install

```bash
git clone <repo-url>
cd moonshot-rewards
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""        # openssl rand -base64 32

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_HAS_GOOGLE=true

# Email magic link (optional — omit to use console log in dev)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="you@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="Moonshot <noreply@moonshot.app>"
NEXT_PUBLIC_HAS_EMAIL=true
```

> **Dev shortcut:** If `EMAIL_SERVER_HOST` is not set, magic links are printed to the terminal console instead of sent — no SMTP config needed.

### 3. Setup Database

```bash
npx prisma generate      # Generate Prisma client
npx prisma db push       # Create SQLite database
npx tsx prisma/seed.ts   # Seed quests + rewards
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment — AWS EC2

### Step 1: Launch EC2 Instance

- **AMI:** Ubuntu 22.04 LTS
- **Instance type:** t2.micro (free tier) or t3.small
- **Security Group — open inbound ports:**
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 3000 (optional, for direct access without Nginx)

### Step 2: Connect & Install Dependencies

```bash
ssh -i your-key.pem ubuntu@<your-ec2-ip>

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm i -g pm2

# Install Nginx
sudo apt-get install -y nginx
```

### Step 3: Clone & Build

```bash
git clone <repo-url>
cd moonshot-rewards
npm install
```

Create `.env` on the server:

```bash
nano .env
```

```env
DATABASE_URL="file:./prod.db"
NEXTAUTH_URL="http://<your-ec2-ip>"   # or your domain
NEXTAUTH_SECRET=""                     # openssl rand -base64 32

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_HAS_GOOGLE=true
NEXT_PUBLIC_HAS_EMAIL=true

EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="you@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="Moonshot <noreply@yourdomain.com>"
```

Then set up the database and build:

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run build
```

### Step 4: Start with PM2

```bash
pm2 start npm --name "moonshot" -- start
pm2 save
pm2 startup   # follow the printed command to enable auto-restart on reboot
```

Check status:

```bash
pm2 status
pm2 logs moonshot
```

### Step 5: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/moonshot
```

```nginx
server {
    listen 80;
    server_name <your-ec2-ip-or-domain>;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/moonshot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

The app is now accessible at `http://<your-ec2-ip>`.

### Step 6: HTTPS with Let's Encrypt (if you have a domain)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Update `NEXTAUTH_URL` in `.env` to `https://yourdomain.com`, then restart:

```bash
pm2 restart moonshot
```

### Switching to PostgreSQL (recommended for production)

1. Install PostgreSQL on the EC2 instance or use Amazon RDS
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/moonshot"
   ```
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Re-run migrations:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

---

## Functional Features

### ✅ User Authentication
- Email magic link (no password required)
- Google OAuth
- MetaMask wallet login (SIWE — Sign-In with Ethereum, signature verified server-side)

### ✅ Quests Storefront
- Browse all quests with difficulty, points, and category
- Filter by category (Daily / One-Time / Recurring)
- Quest completion status shown per user
- 1 fully functional quest: **Daily Check-in**

### ✅ Daily Check-in (Functional Quest)
- Creative "Launch Sequence" countdown animation (3-2-1 🚀)
- Awards base 10 pts + streak bonuses at day 3/7/14/30
- Prevents double check-in within same calendar day
- Streak tracked in DB; resets if a day is missed

### ✅ Rewards Storefront
- Browse rewards with affordability check per user
- Filter by category
- Balance displayed prominently
- 1 fully functional reward: **$10 Amazon Gift Card**

### ✅ Rewards Redemption
- Deducts points atomically
- Generates unique redemption code (`MOON-XXXXXX`)
- Prevents redemption if insufficient balance

### ✅ Profile & History
- Monthly check-in calendar with streak heatmap
- Full transaction history (earned + spent)
- Streak stats and level progression (Recruit → Pioneer → Explorer → Legend)
- Recent redemptions

---

## Bonus Features

- 🔐 **MetaMask / Web3 login** — wallet signature authentication
- 🔥 **Streak system** with milestone bonuses (3/7/14/30 days)
- 📅 **Check-in calendar** — visual monthly heatmap of check-in history
- ⭐ **Level progression** — Recruit → Pioneer → Explorer → Legend
- 🎉 **Confetti animation** on check-in success and redemption
- 🌙 **Dark space theme** with animated starfield background
- 📱 **Responsive** — works on mobile and desktop
- 🔒 **Atomic transactions** — no race conditions on point mutations
