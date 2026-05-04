# CEI Platform: Budget Database & CRC Training Platform - Build Plan

## Executive Summary

Building two new features for the CEI Backstage platform:
1. **Budget Database** - Anonymous crowdsourced clinical trial budget data sharing
2. **CRC Training Platform** - AI-powered training and certification preparation for Clinical Research Coordinators

---

## Feature 1: Budget Database

### Overview
- **Purpose**: Allow sites to anonymously share and access clinical trial budget data
- **Value Proposition**: Fair market value transparency through crowdsourced data
- **Revenue Model**: Freemium subscription (Free/Professional/Enterprise)

### Technical Architecture

#### Database Schema

```prisma
// Budget Submission Schema
model BudgetSubmission {
  id                String   @id @default(cuid())
  userId            String
  procedureId       String
  paymentAmount     Float
  region            String
  siteType          String
  therapeuticArea   String
  qualityScore      Int      @default(0)
  submittedAt       DateTime @default(now())
  
  // Relations
  user              User     @relation(fields: [userId], references: [id])
  procedure         Procedure @relation(fields: [procedureId], references: [id])
  
  @@index([procedureId])
  @@index([region])
  @@index([therapeuticArea])
}

// Standardized Procedures
model Procedure {
  id          String    @id @default(cuid())
  name        String    @unique
  code        String?   // Industry standard code if available
  category    String
  
  // Aggregated Data
  medianPrice Float?
  minPrice    Float?
  maxPrice    Float?
  sampleSize  Int       @default(0)
  lastUpdated DateTime?
  
  // Relations
  submissions BudgetSubmission[]
  
  @@index([category])
}

// User Subscription Tier
model BudgetSubscription {
  id        String   @id @default(cuid())
  userId    String   @unique
  tier      String   // FREE, PROFESSIONAL, ENTERPRISE
  startDate DateTime @default(now())
  endDate   DateTime?
  
  // Requirements
  budgetsSubmittedThisMonth Int @default(0)
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([tier])
}
```

#### API Routes

```
/api/budget
├── POST /submit          - Submit anonymous budget
├── GET /search           - Search budget database
├── GET /procedure/:id    - Get specific procedure data
├── GET /analytics        - Get analytics and trends
├── POST /subscribe       - Subscribe to tier
├── GET /subscription     - Get current subscription
└── POST /verify-site     - Verify site status
```

#### Frontend Components

```
/components/budget-database/
├── BudgetSubmissionForm.tsx       - Submit budget form
├── BudgetSearchBar.tsx            - Search and filters
├── BudgetResultsTable.tsx         - Display results
├── BudgetAnalytics.tsx            - Analytics dashboard
├── SubscriptionCard.tsx           - Pricing tiers
├── ProcedureDetail.tsx            - Individual procedure data
└── BudgetPrivacyInfo.tsx          - Privacy and anonymization info
```

### User Flow

1. **New User**:
   - Signs up for Backstage
   - Navigates to Budget Database
   - Sees locked content with "Submit budget to unlock"
   - Submits first budget
   - Unlocks free tier access

2. **Free Tier User**:
   - Can search top 20 procedures
   - View basic aggregated data
   - Submit unlimited budgets
   - Limited filters

3. **Professional Tier User**:
   - Full database access
   - Advanced filters (region, site type, therapeutic area)
   - Historical trends
   - Export data
   - Must submit 2 budgets/month

4. **Enterprise Tier User**:
   - Everything in Professional
   - API access
   - Custom reports
   - Team access (up to 10 users)
   - Must submit 5 budgets/month

### Pricing Tiers

| Tier | Price | Features | Requirements |
|------|-------|----------|--------------|
| Free | $0 | Top 20 procedures, basic data, limited filters | Submit 1 budget/month |
| Professional | $99/month | Full access, advanced filters, trends, export | Submit 2 budgets/month |
| Enterprise | $299/month | Everything + API, custom reports, team access | Submit 5 budgets/month |

---

## Feature 2: CRC Training Platform

### Overview
- **Purpose**: AI-powered training and certification preparation for Clinical Research Coordinators
- **Value Proposition**: Practical, job-ready training with industry expert validation
- **Revenue Model**: Tiered pricing (Individual Courses / Complete Program / Site License / Enterprise)

### Technical Architecture

#### Database Schema

```prisma
// Training Courses
model Course {
  id          String   @id @default(cuid())
  title       String
  description String
  category    String
  level       String   // BEGINNER, INTERMEDIATE, ADVANCED
  price       Float
  duration    Int      // in minutes
  isPublished Boolean  @default(false)
  
  // Content
  modules     Module[]
  enrollments Enrollment[]
  reviews     Review[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([level])
}

// Course Modules
model Module {
  id          String   @id @default(cuid())
  courseId    String
  title       String
  description String
  order       Int
  
  // Content (will store content URLs or IDs)
  content     String   // JSON structure for lessons, videos, resources
  
  // Progress tracking
  lessons     Lesson[]
  
  course      Course   @relation(fields: [courseId], references: [id])
  
  @@index([courseId])
}

// Individual Lessons
model Lesson {
  id          String   @id @default(cuid())
  moduleId    String
  title       String
  content     String   // Video URL, text content, etc.
  order       Int
  duration    Int      // in minutes
  
  // Assessments
  hasQuiz     Boolean  @default(false)
  quizId      String?
  
  module      Module   @relation(fields: [moduleId], references: [id])
  
  @@index([moduleId])
}

// User Enrollment
model Enrollment {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  
  // Progress
  progress    Float    @default(0) // 0-100
  completedAt DateTime?
  certificate String?  // Certificate URL
  
  // Assessment
  quizScore   Float?
  passed      Boolean  @default(false)
  
  enrolledAt  DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  course      Course   @relation(fields: [courseId], references: [id])
  
  @@unique([userId, courseId])
  @@index([userId])
}

// Quizzes and Assessments
model Quiz {
  id          String   @id @default(cuid())
  moduleId    String?
  title       String
  passingScore Int    @default(70) // percentage
  
  questions   Question[]
  attempts    QuizAttempt[]
}

model Question {
  id          String   @id @default(cuid())
  quizId      String
  question    String
  options     String   // JSON array of options
  correctAnswer Int   // Index of correct answer
  explanation String?
  
  quiz        Quiz     @relation(fields: [quizId], references: [id])
  
  @@index([quizId])
}

model QuizAttempt {
  id          String   @id @default(cuid())
  quizId      String
  userId      String
  score       Float
  passed      Boolean
  answers     String   // JSON array of user answers
  
  attemptedAt DateTime @default(now())
  
  quiz        Quiz     @relation(fields: [quizId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}

// Expert Advisory Board
model Expert {
  id          String   @id @default(cuid())
  name        String
  title       String
  organization String
  expertise   String[]
  bio         String
  photo       String?
  
  // Content reviewed
  coursesReviewed Course[]
  
  createdAt   DateTime @default(now())
}

// Course Reviews
model Review {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  
  rating      Int      // 1-5 stars
  comment     String
  
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  course      Course   @relation(fields: [courseId], references: [id])
  
  @@unique([userId, courseId])
  @@index([courseId])
}
```

#### API Routes

```
/api/training
├── GET /courses              - List all courses
├── GET /courses/:id          - Get course details
├── POST /enroll              - Enroll in a course
├── GET /enrollments          - Get user's enrollments
├── PUT /progress/:id         - Update progress
├── POST /quiz/submit         - Submit quiz answers
├── GET /certificate/:id      - Get certificate
├── POST /review              - Submit course review
├── GET /experts              - List expert advisors
└── POST /site-license        - Request site license
```

#### Frontend Components

```
/components/training/
├── CourseCatalog.tsx           - List all courses
├── CourseCard.tsx              - Individual course card
├── CourseDetail.tsx            - Course details and enrollment
├── CoursePlayer.tsx            - Video/content player
├── ModuleList.tsx              - List of modules in course
├── LessonPlayer.tsx            - Individual lesson player
├── QuizComponent.tsx           - Quiz interface
├── ProgressTracker.tsx         - User's progress
├── Certificate.tsx             - Certificate display/download
├── ExpertAdvisoryBoard.tsx     - Display expert advisors
└── SiteLicenseForm.tsx         - Site license request form
```

### Course Curriculum (Initial Offering)

#### **CRC Fundamentals** ($79)
- Role and responsibilities of CRC
- Clinical trial lifecycle overview
- GCP (Good Clinical Practice) basics
- Regulatory requirements
- Ethics and patient safety

#### **Protocol Review** ($99)
- Understanding protocol documents
- Inclusion/exclusion criteria
- Assessing feasibility
- Protocol deviations
- Documentation requirements

#### **Source Documentation** ($79)
- Essential documentation
- Source vs. sponsor documents
- Electronic source (eSource)
- Documentation best practices
- Common documentation errors

#### **Adverse Event Reporting** ($89)
- Identifying adverse events
- SAE reporting requirements
- Causality assessment
- Timelines and procedures
- Documentation standards

#### **Audit Preparation** ($99)
- Types of audits
- Preparing for audits
- Common findings
- Response to findings
- CAPA (Corrective and Preventive Actions)

#### **GCP Compliance** ($79)
- ICH-GCP guidelines
- Regulatory inspections
- Compliance monitoring
- Quality management
- Continuous improvement

#### **Complete CRC Training Program** ($499)
- All 6 courses bundled
- Comprehensive assessment
- Certificate of completion
- Job placement assistance (future)
- Community access

### Expert Advisory Board Formation

**Initial Targets (5-7 experts):**
- 2-3 Senior CRCs (10+ years experience)
- 1-2 Clinical Research Managers
- 1 Training Director from major pharma
- 1 Industry Consultant

**Compensation:**
- $500-1,000 one-time fee for content review
- Optional revenue share (1-2% of course sales)
- Public recognition on platform
- Access to your network

**Outreach Plan:**
1. Draft personalized outreach emails
2. Leverage your existing network
3. Offer clear value proposition
4. Provide content for review
5. Negotiate terms

### Certification Strategy

**Phase 1: Training Program (Months 1-6)**
- Launch as "CEI CRC Training Program"
- Position as preparation for ACRP/SOCRA exams
- Focus on practical, job-ready skills
- Build user base and credibility

**Phase 2: Approved Provider (Months 6-12)**
- Apply to become ACRP/SOCRA approved education provider
- Get courses recognized for certification credits
- Increase pricing and value

**Phase 3: Own Certification (Months 12-24)**
- Develop "CEI Certified CRC" certification
- Apply for formal accreditation
- Compete directly with ACRP/SOCRA

### Pricing Structure

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| Individual Courses | $49-99 each | Single course access, certificate | Individual CR Cs |
| Complete Program | $499 | All courses, assessment, certificate, community | New CR Cs |
| Site License | $1,999-4,999/month | Unlimited access for all CR Cs, custom training, audit prep | Clinical trial sites |
| Enterprise | $9,999-19,999/month | Everything + custom content, API, white-label | CROs, large sponsors |

---

## Implementation Timeline

### **Phase 1: Budget Database MVP (Weeks 1-8)**

**Week 1-2:**
- Database schema design
- Prisma migrations
- Basic API routes
- Authentication integration

**Week 3-4:**
- Budget submission form
- Search and filtering
- Aggregated data display
- Privacy and anonymization logic

**Week 5-6:**
- Subscription system
- User tier management
- Access control logic
- Billing integration (Stripe)

**Week 7-8:**
- Testing and QA
- Beta testing with 5-10 sites
- Bug fixes
- Documentation

### **Phase 2: CRC Training MVP (Weeks 3-12)**

**Week 3-4:**
- LMS infrastructure
- Course structure
- Content delivery system
- Progress tracking

**Week 5-6:**
- Assessment framework
- Quiz system
- Certificate generation
- User enrollment system

**Week 7-8:**
- Create initial course content (you as SME)
- Expert advisory board outreach
- Content review and validation

**Week 9-10:**
- Course catalog interface
- Course player
- Module and lesson navigation
- Quiz interface

**Week 11-12:**
- Testing and QA
- Beta testing with partner sites
- Bug fixes
- Documentation

### **Phase 3: Integration & Launch (Weeks 9-14)**

**Week 9-10:**
- Integrate both features into Backstage
- Unified navigation
- Cross-promotion
- Single sign-on

**Week 11-12:**
- Legal agreements (ToS, privacy policy)
- User education materials
- Onboarding flows
- Help documentation

**Week 13-14:**
- Beta launch with partner sites
- Collect feedback
- Iterate and improve
- Prepare for public launch

### **Phase 4: Public Launch & Scale (Weeks 15-24)**

**Week 15-16:**
- Public launch
- Marketing campaigns
- Content marketing
- Social media promotion

**Week 17-24:**
- Monitor performance
- Collect user feedback
- Iterate on features
- Scale infrastructure
- Add advanced features

---

## Revenue Projections

### Budget Database
- Year 1: $95k-190k
- Year 2: $285k-476k
- Year 3: $535k-952k

### CRC Training Platform
- Year 1: $405k
- Year 2: $1.39M
- Year 3: $2.5M+

### Combined
- Year 1: $500k-600k
- Year 2: $1.68M-1.87M
- Year 3: $3M-3.5M

---

## Success Metrics

### Budget Database
- Number of budgets submitted
- Number of active users
- Database coverage (procedures, regions)
- User retention rate
- Subscription conversion rate

### CRC Training Platform
- Number of enrollments
- Course completion rate
- Quiz pass rate
- User satisfaction (reviews)
- Certification exam pass rate (Phase 2+)

---

## Risks & Mitigation

### Budget Database
- **Cold start problem**: Seed with initial data
- **Data quality**: Quality scoring, validation
- **Privacy concerns**: Anonymization guarantees
- **Slow adoption**: Free tier, network effects

### CRC Training Platform
- **Credibility**: Expert advisory board, partnerships
- **Content quality**: SME review, validation
- **Certification legitimacy**: Phased approach, accreditation
- **Competition**: Practical focus, industry experts

---

## Next Steps

1. ✅ Build plan approved
2. Start Phase 1: Budget Database MVP
3. Begin database schema design
4. Create Prisma migrations
5. Build API routes
6. Develop frontend components

**Ready to start building!**