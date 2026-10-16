# Behind the Protocol

BTP connects clinical-trial professionals to practical peer experience, private help, and useful outcomes.

## Start here: source of truth

- [Final company vision - locked October 16, 2026](docs/vision/BTP_FINAL_VISION.md)
- [Download the final vision PDF](output/pdf/BTP_Final_Vision_2026-10-16.pdf)
- [Current beta product constitution](BTP_PRODUCT_CONSTITUTION.md)
- [Strategic direction](BTP_STRATEGIC_DIRECTION.md)
- [Data and prediction doctrine](BTP_DATA_INTELLIGENCE_DOCTRINE_2026-10-12.md)
- [Revenue opportunity registry](BTP_FUTURE_REVENUE_STREAMS.md)

The final vision controls strategy conflicts in older documents. Archived analyses and financial scenarios are not current product specifications or founder commitments.

## Product baseline

The existing Next.js web/backend and Expo/React Native iOS beta support verified, identity-protected questions, answers, follow-up outcomes, private-help requests, and administration. The core loop is Ask -> Answer -> Apply -> Outcome. Membership approval is separate from authentication. Identity protection is not a guarantee of anonymity.

The company direction includes paid expertise, operator research, and permissioned operational intelligence and prediction. These ambitions are not claims of current revenue or a validated prediction model. Workforce modules retained in source are not the current beta's primary product.

## Technology

Next.js / React / TypeScript; Expo / React Native; PostgreSQL / Prisma; Clerk; Vercel and EAS. Consult package manifests for current dependency versions. Never commit credentials, member data, or plaintext investor briefing content.

## 📦 Installation

### Prerequisites
- Node.js 18.x or 20.x
- PostgreSQL database
- Clerk account (for authentication)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/fortunainc/BTP.git
   cd BTP
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

## Support and roadmap

Use the application's support page for the current contact route. The canonical vision and beta constitution define the roadmap; dormant repository modules are not promises of public availability.

Regenerate the vision PDF after changing its canonical Markdown source:

```bash
python3 scripts/docs/render-vision.py
```

The renderer requires ReportLab. Visually check the resulting PDF before publishing.
