# Behind the Protocol - Signal System Architecture

## Core Loop

```
Signal Submission → Signal Scoring → Access Tier → Opportunity Matching → Economic Outcome → Repeat
```

This loop is enforced at the system level.

---

## 1. System Components

### 1.1 Signal Submission Engine
- Structured form with 10 required/optional fields
- No free-form posting
- All entries are signals, not posts

### 1.2 Signal Scoring System (SS)
- Calculates score per submission
- Aggregates to user-level metrics
- Inputs: Completeness, Specificity, Repeatability, Impact

### 1.3 Access Tier System
- Tier 0-4 based on cumulative Signal Score
- Gates access to marketplace opportunities

### 1.4 Opportunity Matching Engine
- Ranks candidates by SS + relevance
- Surfaces top matches to buyers

---

## 2. Data Model

### User Extension
```
User {
  signalScore: int          // Total cumulative score
  averageSignalQuality: float
  tier: enum (0-4)
  internalBadges: string[]
  signalCount: int
}
```

### Signal (replaces Thread)
```
Signal {
  id: string
  userId: string
  
  // Structured Fields
  contextType: enum        // Site, CRO, Sponsor, Vendor, Regulatory, Other
  expectedOutcome: text    // What was expected to happen
  actualOutcome: text      // What actually happened
  breakPoint: string       // Where did it break
  rootCause: text          // Why did it break
  workaround: text         // Workaround used (if any)
  
  // Impact Matrix
  timeImpact: enum         // low/med/high
  costImpact: enum         // low/med/high
  patientImpact: enum      // low/med/high
  operationalImpact: enum  // low/med/high
  
  // Metadata
  repeatability: enum      // one-time/recurring
  confidence: enum         // low/med/high
  tags: string[]
  
  // Scoring
  signalScore: int         // Score for this submission
  completenessScore: float
  specificityScore: float
  impactScore: float
  
  // Pattern Detection
  patternLabel: string     // Auto-generated (e.g., "Enrollment Assumption Failure")
  similarSignalCount: int  // How many others reported similar
  
  timestamps
}
```

### Signal Score Calculation
```
SignalScore = 
  (Completeness * 25) + 
  (Specificity * 25) + 
  (ImpactScore * 30) + 
  (Repeatability * 10) + 
  (Confidence * 10)

Where:
- Completeness: % of fields filled
- Specificity: Based on text length + clarity heuristics
- ImpactScore: Average of 4 impact dimensions
- Repeatability: +10 if recurring pattern
- Confidence: User's confidence level
```

### Tier Thresholds
```
Tier 0: 0 points (No access)
Tier 1: 1-50 points (Limited access)
Tier 2: 51-150 points (Standard access)
Tier 3: 151-300 points (Priority access)
Tier 4: 300+ points (Elite Signal Operator)
```

---

## 3. Marketplace Gating Rules

### Visibility Rules
```
Job Visibility:
- Tier 0: No jobs visible
- Tier 1: Basic jobs only (entry-level)
- Tier 2: Standard jobs + some premium
- Tier 3: All standard + premium priority
- Tier 4: All jobs + exclusive opportunities + first access
```

### Matching Priority
```
Candidate Ranking for Buyers:
1. Signal Score (40% weight)
2. Signal Type Relevance (30% weight)
3. Domain Tag Match (20% weight)
4. Tier Level (10% weight)
```

---

## 4. Internal Badges

Non-social, merit-based badges:
- "Trusted Operator" (Tier 2+)
- "High Signal Contributor" (ASQ > 75)
- "Protocol Risk Specialist" (5+ protocol signals)
- "Enrollment Expert" (5+ enrollment signals)
- "Regulatory Navigator" (5+ regulatory signals)

---

## 5. User Dashboard Metrics

- Current Signal Score
- Tier Level & Progress
- Average Signal Quality (ASQ)
- Contribution History
- Opportunities Unlocked
- Suggested Actions to Increase Score

---

## 6. Language Replacements

| Old Term | New Term |
|----------|----------|
| Post | Signal |
| Thread | Signal |
| Discussion | Signal |
| Community | Network |
| Reply | Endorsement (structured) |
| Comment | REMOVED |
| Like | REMOVED |
| Follower | REMOVED |

---

## 7. Closed-Loop Validation

### System Audit Checklist:
- [ ] No unstructured posting exists
- [ ] All submissions go through Signal schema
- [ ] SS is calculated on every submission
- [ ] Tier is updated after each submission
- [ ] Jobs are gated by tier
- [ ] Matching uses SS in ranking
- [ ] No social metrics visible to users

---

## 8. MVP Implementation Priority

1. Signal Schema & Migration
2. Signal Submission Form
3. Scoring Engine
4. Tier System
5. Marketplace Gating
6. Matching Engine
7. User Dashboard
8. Buyer Experience