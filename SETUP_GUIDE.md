# CEI Platform Setup Guide

## 🎉 Current Status

✅ **Project Created Successfully!**

The CEI Platform foundation has been set up with:
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Prisma ORM with complete database schema (10 tables)
- Clerk authentication (ready to configure)
- Basic UI components
- Development server running

**Live Preview:** https://3000-5d49cd75-6a05-40f2-a010-7d7836f48810.sandbox-service.public.prod.myninja.ai

---

## 📋 Next Steps to Complete Setup

### Step 1: Set Up Railway PostgreSQL Database (5 minutes)

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Provision PostgreSQL"
3. Click on the PostgreSQL service
4. Go to "Variables" tab
5. Copy the `DATABASE_URL` value
6. Update `.env` file in the project root:
   ```
   DATABASE_URL="postgresql://postgres:..."
   ```

### Step 2: Set Up Clerk Authentication (5 minutes)

1. Go to [Clerk.com](https://clerk.com) and sign up/login
2. Create a new application
3. Choose "Email" and "Phone" as authentication methods
4. Enable 2FA (Two-Factor Authentication):
   - Go to "User & Authentication" → "Email, Phone, Username"
   - Enable "Phone number" as a required field
   - Enable "Two-factor authentication"
5. Go to "API Keys" in the sidebar
6. Copy your keys and update `.env`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   ```

### Step 3: Run Database Migrations (2 minutes)

Once you have your DATABASE_URL configured:

```bash
cd /workspace/cei-platform
npx prisma migrate dev --name init
npx prisma db seed
```

This will:
- Create all 10 database tables
- Seed 7 intelligence channels
- Seed 18 pattern categories
- Seed 9 forum categories

### Step 4: Verify Setup (1 minute)

1. Visit the live preview URL
2. You should see the CEI Platform homepage
3. Click "Get Started" to test authentication
4. Complete the sign-up flow

---

## 🗄️ Database Schema Overview

The platform includes 10 tables:

### Core Tables
1. **User** - User profiles, credits, reputation
2. **IntelligenceChannel** - 7 intelligence channels
3. **IntelligenceContribution** - User submissions
4. **PatternCategory** - 18 pattern types
5. **PatternTag** - Pattern tagging system

### Moderation & Credits
6. **ModerationAction** - Approval/rejection tracking
7. **CreditTransaction** - Credit economy

### Community
8. **ForumCategory** - 9 therapeutic areas
9. **ForumPost** - Anonymous discussions
10. **ForumComment** - Post comments

---

## 🏗️ Project Structure

```
cei-platform/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Clerk
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/
│   └── ui/                # Shadcn UI components
│       └── button.tsx
├── lib/
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema (10 tables)
│   └── seed.ts            # Seed script
├── middleware.ts          # Clerk authentication
└── .env                   # Environment variables
```

---

## 🎯 What's Been Built

### ✅ Completed
- [x] Next.js 14 project with TypeScript
- [x] Tailwind CSS configuration
- [x] Complete Prisma schema (10 tables)
- [x] Seed script (7 channels, 18 patterns, 9 forums)
- [x] Clerk middleware for authentication
- [x] Basic UI components (Button)
- [x] Homepage with hero section
- [x] Utility functions (date formatting, reputation tiers)
- [x] Development server running

### ⏳ Next Phase (Week 1 Remaining)
- [ ] Configure Railway database
- [ ] Configure Clerk authentication
- [ ] Run migrations and seed data
- [ ] Build sign-in/sign-up pages
- [ ] Create onboarding flow
- [ ] Build dashboard layout

---

## 🚀 Development Commands

```bash
# Start development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Build for production
npm run build

# Start production server
npm start
```

---

## 📦 Installed Dependencies

### Core
- next@16.1.2
- react@19
- typescript@5

### Database & Auth
- @prisma/client
- prisma
- @clerk/nextjs

### UI & Styling
- tailwindcss
- @radix-ui/* (various components)
- class-variance-authority
- clsx
- tailwind-merge
- lucide-react

### Forms & Validation
- react-hook-form
- @hookform/resolvers
- zod

---

## 🔐 Environment Variables

Required variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📊 Database Seed Data

### 7 Intelligence Channels
1. Enrollment Reality
2. Protocol Design Failures
3. Site Burnout & Turnover
4. Data Quality Theater
5. Regulatory Fear & Over-Compliance
6. Therapeutic Area Realities
7. What Worked

### 18 Pattern Categories
- 3 Enrollment patterns
- 3 Protocol patterns
- 3 Site patterns
- 3 Data patterns
- 3 Regulatory patterns
- 2 Therapeutic patterns
- 1 Success pattern

### 9 Forum Categories
1. Oncology
2. Cardiology
3. Neurology
4. Immunology
5. Infectious Disease
6. Rare Disease
7. Pediatrics
8. General Discussion
9. Career & Professional Development

---

## 🎨 Design System

### Colors
- **Primary:** Blue (#3B82F6)
- **Secondary:** Purple (#8B5CF6)
- **Success:** Green (#10B981)
- **Warning:** Amber (#F59E0B)
- **Danger:** Red (#EF4444)

### Reputation Tiers
- **Bronze:** 0-999 points (Amber)
- **Silver:** 1,000-4,999 points (Gray)
- **Gold:** 5,000-14,999 points (Yellow)
- **Platinum:** 15,000+ points (Purple)

---

## 📈 Next Development Phases

### Week 2: Intelligence Channels
- Build channel pages
- Create contribution forms
- Implement credit staking

### Week 3: Moderation System
- Admin dashboard
- Pattern tagging
- Quality scoring

### Week 4: Credit System
- Credit transactions
- Reputation system
- Credit redemption

### Week 5: Backstage Community
- Forum structure
- Post interaction
- Anonymous posting

### Week 6: Analytics & Patterns
- Pattern frequency
- Operator insights
- Admin analytics

### Week 7: AI vs. Reality
- ClinicalTrials.gov API
- Prediction system
- Gap analysis

### Week 8: Polish & Testing
- Bug fixes
- Performance optimization
- Beta preparation

---

## 🆘 Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Railway database is running
- Ensure IP whitelist includes your location

### Authentication Issues
- Verify Clerk keys are correct
- Check Clerk dashboard for errors
- Ensure 2FA is properly configured

### Build Errors
- Run `npm install` to ensure all dependencies
- Clear `.next` folder: `rm -rf .next`
- Regenerate Prisma client: `npx prisma generate`

---

## 📞 Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review the implementation plan in `CEI_MVP_REBUILD_PLAN.md`
3. Check the todo list in `todo.md`

---

**Ready to continue building!** 🚀