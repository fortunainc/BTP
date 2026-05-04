# Deployment Guide for Behind the Protocol

## Quick Deployment Options

### Option 1: Vercel (Recommended - Free & Fast)
Vercel is the creators of Next.js and provides the best deployment experience.

#### Prerequisites
- GitHub account
- Vercel account (free at vercel.com)

#### Steps:
1. **Create GitHub Repository**
   ```bash
   # In your terminal, run:
   gh repo create behind-the-protocol --public --source=. --remote=origin
   git push -u origin main
   ```
   Or manually create a repo on GitHub and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/behind-the-protocol.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js configuration
   - Click "Deploy"

3. **Configure Environment Variables** (Required)
   In Vercel dashboard → Settings → Environment Variables, add:
   
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Setup Database**
   ```bash
   # Get your database URL from PostgreSQL provider (Supabase, Neon, Railway, etc.)
   # Add it to Vercel environment variables as DATABASE_URL
   ```

5. **Run Database Migrations**
   Vercel will automatically run `prisma generate` during build.
   For migrations, you may need to run them locally first or use Vercel CLI:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

6. **Your Site is Live!**
   Vercel will provide a URL like: `https://behind-the-protocol.vercel.app`

---

### Option 2: Railway (Easy All-in-One)
Railway provides hosting + database in one place.

#### Steps:
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Next.js
5. Add PostgreSQL database from Railway's services
6. Railway will automatically set DATABASE_URL
7. Add other environment variables
8. Deploy!

---

### Option 3: Netlify

#### Steps:
1. Go to [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables
6. Deploy

---

## Environment Variables Required

Create a `.env` file in your project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Email (Resend)
RESEND_API_KEY=re_...

# Optional: Redis (for caching)
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Setting Up Required Services

### 1. PostgreSQL Database
Free options:
- **Supabase**: [supabase.com](https://supabase.com) - Free tier with 500MB
- **Neon**: [neon.tech](https://neon.tech) - Free tier with 0.5GB
- **Railway**: [railway.app](https://railway.app) - $5 free credit
- **Render**: [render.com](https://render.com) - Free tier

### 2. Clerk Authentication
1. Go to [clerk.com](https://clerk.com)
2. Create account (free tier available)
3. Create new application
4. Copy API keys to your environment variables

### 3. Resend Email (Optional)
1. Go to [resend.com](https://resend.com)
2. Create account (free tier: 3,000 emails/month)
3. Get API key
4. Add to environment variables

---

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/behind-the-protocol.git
   cd behind-the-protocol
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000**

---

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## Troubleshooting

### Build Fails
- Ensure all environment variables are set
- Check that Node.js version is compatible (18.x or 20.x)
- Run `npm install` locally first to ensure no dependency issues

### Database Connection Issues
- Verify DATABASE_URL format
- Check database is accessible from deployment platform
- Run `npx prisma db push` to sync schema

### Authentication Issues
- Verify Clerk keys are correct
- Check NEXT_PUBLIC_CLERK_SIGN_IN_URL and SIGN_UP_URL
- Ensure Clerk domain is whitelisted in your Clerk dashboard

---

## Post-Deployment Checklist

- [ ] Site loads successfully
- [ ] Sign up works (Clerk integration)
- [ ] Can create threads
- [ ] Can post job listings
- [ ] Email notifications work (if configured)
- [ ] Admin dashboard accessible
- [ ] Database migrations applied
- [ ] All environment variables set
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS working

---

## Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Railway
1. Go to Settings → Domains
2. Add domain
3. Update DNS records

---

## Monitoring & Analytics

Recommended tools:
- **Vercel Analytics**: Built-in with Vercel
- **Sentry**: Error tracking (already configured in project)
- **Google Analytics**: Add tracking ID to layout.tsx

---

## Support

For issues:
- Check [Next.js docs](https://nextjs.org/docs)
- Check [Clerk docs](https://clerk.com/docs)
- Check [Prisma docs](https://www.prisma.io/docs)

---

## Cost Summary

**Free Tier Options:**
- Vercel: Free hosting (100GB bandwidth/month)
- Supabase/Neon: Free PostgreSQL
- Clerk: Free tier (10,000 MAUs)
- Resend: Free (3,000 emails/month)

**Estimated Monthly Cost (if exceeding free tiers):**
- Hosting: $20-50/month (Vercel Pro)
- Database: $20-50/month (PostgreSQL)
- Auth: $25-99/month (Clerk)
- Email: $20/month (Resend)

**Total for production: $65-219/month depending on usage**