# How to Run SupplyMind AI - Complete Guide

## Overview

SupplyMind AI is a full-stack supply chain intelligence platform. This guide covers running it locally and deploying to production.

---

## Option 1: Run Locally (Development)

### Prerequisites

Ensure you have installed:
- **Node.js 18+** ([Download](https://nodejs.org/))
- **pnpm** (`npm install -g pnpm`) or use npm/yarn
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/)) OR use Neon (cloud)

### Step 1: Clone/Extract the Project

```bash
# Extract the ZIP file
unzip supplymind-ai.zip
cd supplymind-ai

# OR if using Git
git clone <your-repo>
cd supplymind-ai
```

### Step 2: Install Dependencies

```bash
# Install all Node/React dependencies
pnpm install

# This installs: React, Next.js, Tailwind, shadcn/ui, Drizzle, Better Auth, etc.
```

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy example file
cp .env.example .env.local

# OR create manually
cat > .env.local << 'EOF'
# ===== REQUIRED =====

# Database URL (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/supplymind"

# Authentication Secret (generate: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-generated-secret-here"

# Vercel AI Gateway Key (optional, needed for AI features)
AI_GATEWAY_API_KEY="your-key-here"

# ===== OPTIONAL =====

# Google Gemini API Key (for enhanced AI insights)
GOOGLE_GEMINI_API_KEY="your-gemini-key-here"

EOF
```

**How to generate BETTER_AUTH_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (use Git Bash) or WSL
openssl rand -base64 32
```

### Step 4: Set Up Database

**Option A: Use Local PostgreSQL**

```bash
# Create a new database
createdb supplymind

# Run the schema to create tables
psql -d supplymind -f backend/schema.sql

# Verify tables were created
psql -d supplymind -c "\dt"
```

**Option B: Use Neon (Recommended - Cloud Database)**

1. Go to [neon.tech](https://neon.tech/)
2. Sign up (free tier available)
3. Create a new project
4. Copy the connection string
5. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@...neon.tech/neon"
   ```
6. Run migrations:
   ```bash
   psql $DATABASE_URL -f backend/schema.sql
   ```

### Step 5: Start Development Server

```bash
# Start the development server
pnpm dev

# Output will show:
# ➜  Local:   http://localhost:3000
# ➜  ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 6: Access the Application

1. Open browser and go to: **http://localhost:3000**
2. You should see the sign-in page
3. Click **"Don't have an account? Sign up"**
4. Create your account with:
   - Email: `test@example.com`
   - Password: `Test123!@#`
5. Done! You're now in the dashboard

---

## Option 2: Run with Docker (Containerized)

### Prerequisites

- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose**

### Step 1: Run with Docker Compose

```bash
# In the project root, run:
docker-compose up

# This starts:
# - Next.js app on port 3000
# - PostgreSQL database on port 5432
# - All environment variables pre-configured
```

### Step 2: Access the Application

- Frontend: **http://localhost:3000**
- Database: `postgresql://postgres:postgres@localhost:5432/supplymind`

### Step 3: Stop the Application

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

---

## Option 3: Deploy to Vercel (Production)

### Prerequisites

- Neon PostgreSQL account (free at [neon.tech](https://neon.tech/))
- Vercel account (free at [vercel.com](https://vercel.com/))
- GitHub repository

### Step 1: Push to GitHub

```bash
# Initialize Git (if not already)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/supplymind-ai.git
git push -u origin main
```

### Step 2: Connect Vercel

1. Go to [vercel.com](https://vercel.com/)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select the repository: `supplymind-ai`
5. Click **"Import"**

### Step 3: Add Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   ```
   DATABASE_URL = "your-neon-connection-string"
   BETTER_AUTH_SECRET = "your-generated-secret"
   AI_GATEWAY_API_KEY = "your-key"
   GOOGLE_GEMINI_API_KEY = "your-key"
   ```
3. Click **"Save"**

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (2-5 minutes)
3. Your app will be live at: `https://supplymind-ai.vercel.app`

---

## Common Commands

### Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Format code
pnpm format
```

### Database

```bash
# Connect to database
psql $DATABASE_URL

# Run migrations
psql $DATABASE_URL -f backend/schema.sql

# Reset database
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Useful Tools

```bash
# Generate auth secret
openssl rand -base64 32

# Check Node version
node --version

# Check pnpm version
pnpm --version
```

---

## Troubleshooting

### Issue: "Cannot find module 'next'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Issue: "DATABASE_URL is not set"

**Solution:**
```bash
# Verify .env.local exists
cat .env.local

# Check DATABASE_URL is set
echo $DATABASE_URL

# If empty, add it to .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/supplymind"
```

### Issue: "Connection refused" (Database)

**Solution:**
```bash
# Check PostgreSQL is running
psql --version

# On Mac with Homebrew
brew services list

# Start PostgreSQL service if stopped
brew services start postgresql

# On Linux
sudo systemctl start postgresql

# On Windows
# Start PostgreSQL service from Services app
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Use different port
pnpm dev -- -p 3001

# OR kill process on port 3000
# On Mac/Linux
lsof -i :3000
kill -9 <PID>

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Authentication error" after sign-up

**Solution:**
```bash
# Verify BETTER_AUTH_SECRET is set
echo $BETTER_AUTH_SECRET

# Generate new secret if needed
openssl rand -base64 32

# Update .env.local and restart server
pnpm dev
```

### Issue: "CORS error" with AI features

**Solution:**
```bash
# Check AI_GATEWAY_API_KEY is set
echo $AI_GATEWAY_API_KEY

# Get key from: https://vercel.com/docs/concepts/projects/environment-variables

# Restart dev server after adding
pnpm dev
```

---

## Project Structure

```
supplymind-ai/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/              # Main app pages
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard
│   │   ├── forecasting/
│   │   ├── inventory/
│   │   ├── simulation/
│   │   ├── analytics/
│   │   └── settings/
│   └── api/                      # API routes
│       ├── auth/
│       └── chat/
├── components/                   # React components
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── auth.ts                   # Better Auth config
│   └── db/                       # Database setup
├── backend/                      # Python services (optional)
│   ├── forecast_service.py
│   └── schema.sql
├── public/                       # Static files
├── .env.local                    # Environment variables (NOT in Git)
├── .env.example                  # Example env file
├── package.json                  # Node dependencies
├── tsconfig.json                 # TypeScript config
└── next.config.mjs              # Next.js config
```

---

## Testing the Application

### 1. Sign Up & Sign In

```
1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter email: test@example.com
4. Enter password: Test123!@#
5. Click "Create Account"
6. You should see dashboard
```

### 2. Test Dashboard

```
1. Click "Dashboard" in sidebar
2. View KPI cards (Revenue, Accuracy, etc.)
3. See trending charts
4. Check alerts widget
```

### 3. Test Forecasting

```
1. Click "Forecasting" in sidebar
2. See 30-day forecast chart
3. View forecast data table
4. Check model accuracy metrics
```

### 4. Test Inventory

```
1. Click "Inventory" in sidebar
2. View inventory metrics
3. Check reorder recommendations
4. See category breakdown
```

### 5. Test Business Simulation

```
1. Click "Simulation" in sidebar
2. Move discount slider (0-50%)
3. Move marketing slider (0-100%)
4. See revenue/margin update
```

### 6. Test AI Assistant

```
1. Click "Chat" in sidebar
2. Type: "What is our forecast?"
3. Click "Send"
4. See AI response
5. Try quick questions like "Reorder?", "Risks?"
```

### 7. Test Analytics

```
1. Click "Analytics" in sidebar
2. View product analytics
3. View category breakdown pie chart
4. See revenue trends
```

---

## Performance Tips

### Development Speed

```bash
# Use SWR for client-side data caching
# Use React 19 hooks for optimal rendering
# Use Tailwind CSS classes (no inline styles)
# Avoid large bundle sizes
```

### Production Optimization

```bash
# Build is optimized automatically by Next.js
pnpm build

# Check bundle size
npm install -g next-bundle-analyzer
pnpm build --analyze
```

---

## Monitoring & Logs

### View Application Logs

```bash
# Development logs appear in terminal
# Production logs available in Vercel dashboard

# Check local logs
pnpm dev

# Save logs to file
pnpm dev > app.log 2>&1
```

### Monitor Database

```bash
# Connect to database and check status
psql $DATABASE_URL

# View tables
\dt

# View record count
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM demand_forecasts;
```

---

## Security Checklist

Before deploying to production:

- [ ] Set strong `BETTER_AUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Use HTTPS (Vercel does this automatically)
- [ ] Enable environment variable encryption (Vercel default)
- [ ] Don't commit `.env.local` to Git
- [ ] Use strong passwords for database
- [ ] Keep dependencies updated (`pnpm update`)
- [ ] Enable Vercel deployment protection
- [ ] Set up rate limiting for API routes
- [ ] Monitor logs for errors
- [ ] Regular database backups

---

## Next Steps

1. ✅ Start the development server: `pnpm dev`
2. ✅ Create your first account
3. ✅ Explore the dashboard
4. ✅ Check all features (Forecasting, Inventory, etc.)
5. ✅ Read individual page documentation
6. ✅ Deploy to Vercel when ready
7. ✅ Monitor performance and add your real data

---

## Need Help?

### Documentation
- `README.md` - Project overview
- `INTEGRATION_GUIDE.md` - Feature details
- `QUICK_REFERENCE.md` - Quick lookup

### Debugging
1. Check browser console for errors
2. Check terminal for server errors
3. Verify all environment variables are set
4. Check database connection
5. Review error logs in Vercel dashboard

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Better Auth Docs](https://www.better-auth.com)
- [Tailwind CSS Docs](https://tailwindcss.com)

---

## Deployment Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Database migrations run (`schema.sql`)
- [ ] Test sign-in/sign-up flow
- [ ] Test all dashboard features
- [ ] Enable analytics (optional)
- [ ] Set up custom domain (optional)
- [ ] Configure email notifications (optional)
- [ ] Setup backup strategy
- [ ] Monitor error logs
- [ ] Plan data migration if needed

---

**You're all set! Your SupplyMind AI application is ready to run.** 🚀

Start with: `pnpm install && pnpm dev`
