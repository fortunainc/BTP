# Behind the Protocol

Professional Network and Operational Marketplace for Clinical Trial Professionals

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/behind-the-protocol)

> ⚡ **Fastest deployment**: Click the button above to deploy to Vercel in under 2 minutes

## 📋 What is Behind the Protocol?

Behind the Protocol is a professional platform built by operators, for operators in the clinical trial industry. It provides two core modules:

### 1. Operator Network
- **Anonymous Discussions**: Verified professionals can ask questions and share experiences anonymously
- **Helpful Score System**: Reputation system to surface the most valuable contributions
- **Voting Mechanism**: Community-driven quality control
- **Category Filtering**: Organize discussions by topic

### 2. Workforce Exchange
- **Job Posting**: Organizations can post operational roles
- **Anonymized Profiles**: Operators can browse opportunities while maintaining privacy
- **Direct Messaging**: Secure in-platform communication
- **Application Tracking**: Streamlined hiring workflow

## ✨ Key Features

- ✅ **Verified Professionals**: Work email verification + LinkedIn review
- ✅ **Anonymous Activity**: Public contributions remain anonymous with verified badges
- ✅ **Helpful Voting**: Most helpful answers get recognition
- ✅ **Founding Operator Badge**: First 500 verified users get special status
- ✅ **Email Notifications**: Stay informed of replies, messages, and job matches
- ✅ **Admin Dashboard**: Complete moderation and management tools
- ✅ **Security First**: Built with security headers, rate limiting, and input sanitization

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1.2 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Email**: Resend
- **UI Components**: shadcn/ui
- **Error Tracking**: Sentry

## 📦 Installation

### Prerequisites
- Node.js 18.x or 20.x
- PostgreSQL database
- Clerk account (for authentication)

### Local Setup

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
   ```
   Then edit `.env` with your values:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   RESEND_API_KEY=re_...
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 📁 Project Structure

```
cei-platform/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── threads/           # Operator Network pages
│   ├── workforce/         # Workforce Exchange pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility libraries
│   ├── prisma.ts         # Database client
│   ├── email-notifications.ts
│   └── helpful-score.ts
├── prisma/               # Database schema & migrations
└── public/               # Static assets
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma migrate dev    # Create & apply migration
npx prisma studio         # Open Prisma Studio
npx prisma db push        # Push schema changes

# Code Quality
npm run lint         # Run ESLint
```

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized
- **Rate Limiting**: API endpoints protected from abuse
- **Security Headers**: Comprehensive security headers via middleware
- **CORS Config**: Properly configured cross-origin requests
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Prevention**: DOMPurify sanitizes user-generated content

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Clerk](https://clerk.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For support, email support@behindtheprotocol.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered thread recommendations
- [ ] Integration with clinical trial registries
- [ ] Compliance documentation module
- [ ] Multi-language support

---

**Behind the Protocol** - Where Clinical Trial Operators Tell the Truth