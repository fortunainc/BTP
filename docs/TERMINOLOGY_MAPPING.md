# BTP Terminology Mapping - System Integrity Sweep

## Purpose
This document defines the official terminology for BTP (BehindTheProtocol), ensuring consistency across all modules. BTP is a **closed-loop execution intelligence system** — NOT a job board or social platform.

## Core Terminology Standards

### Operators (Not "Candidates" or "Freelancers")
| Legacy Term | BTP Term | Rationale |
|-------------|----------|-----------|
| Candidate | **Operator** | Execution-focused terminology |
| Freelancer | **Operator** | Platform-agnostic, professional |
| User | **Operator** (when referring to execution side) | Clear role distinction |
| Profile | **Capability Identity** | Anonymized, skill-focused representation |

### Organizations (Not "Employers" or "Clients")
| Legacy Term | BTP Term | Rationale |
|-------------|----------|-----------|
| Employer | **Organization** | Neutral, enterprise-focused |
| Client | **Organization** | Consistent naming |
| Company | **Organization** | Unified terminology |

### Opportunities (Not "Jobs" or "Gigs")
| Legacy Term | BTP Term | Rationale |
|-------------|----------|-----------|
| Job | **Opportunity** | Execution-focused, not employment |
| Gig | **Opportunity** | Platform-neutral |
| Job Posting | **Opportunity Specification** | Formal, structured |
| JobPosting | **OpportunitySpec** | Code identifier |
| Position | **Opportunity** | Consistent naming |

### Matching (Core System)
| Legacy Term | BTP Term | Rationale |
|-------------|----------|-----------|
| Match | **Execution Match** | Emphasizes execution context |
| Match Score | **Execution Alignment Score** | Context-aware terminology |
| Recommendation | **Execution Recommendation** | Intelligence-driven |

### Contributions (Anonymity-Critical)
| Legacy Term | BTP Term | Rationale |
|-------------|----------|-----------|
| Work History | **Contribution Record** | Anonymized representation |
| Experience | **Contribution Band** | Banded, not exact |
| Resume | **PROHIBITED** | Not applicable to BTP |
| Portfolio | **Contribution Summary** | Anonymized collection |

### Economic System
| Legacy Term | BTP Term | Rationale |
|-------------|----------|-----------|
| Salary | **Contract Value** | Project-based economics |
| Rate | **Contract Value** | Consistent naming |
| Fee | **Platform Fee (25%)** | Explicit percentage |
| Payment | **Transaction** | Economic tracking |

### Identity System
| Legacy Term | BTP Term | Rationale |
|-------------|----------|-----------|
| User ID | **Operator ID** or **Organization ID** | Role-specific |
| Profile ID | **Capability Identity ID** | Anonymized |
| Public Profile | **PROHIBITED** | No public profiles |
| Score | **Signal Score (SS)** | Internal only |

## PROHIBITED Terms & Features
The following are explicitly PROHIBITED in BTP:

### Social Features (NEVER IMPLEMENT)
- ❌ Likes
- ❌ Followers / Following
- ❌ Public Profiles
- ❌ Public Scores
- ❌ Leaderboards
- ❌ Badges
- ❌ Achievements (Public)
- ❌ Social Sharing
- ❌ Comments on Profiles
- ❌ Mentions
- ❌ Endorsements

### Job Board Terminology (NEVER USE)
- ❌ Job Board
- ❌ Job Search
- ❌ Apply
- ❌ Candidate
- ❌ Resume
- ❌ Interview (use "Execution Discussion")

## Code Naming Conventions

### File Names
```
✅ signal-score.ts          # Signal Score system
✅ opportunity-scarcity.ts  # Opportunity control
✅ hiring-loop.ts           # Full execution lifecycle
✅ matching-finalization.ts # Matching engine
✅ decision-correction.ts   # Patent-critical IP

❌ job-matching.ts          # Legacy terminology
❌ candidate-scoring.ts     # Legacy terminology
❌ freelancer-system.ts     # Legacy terminology
```

### Type/Interface Names
```typescript
✅ Operator, Organization, Opportunity
✅ CapabilityIdentity, ExecutionMatch
✅ SignalScore, AccessTier
✅ ContributionBand, ExecutionAlignment

❌ Candidate, Freelancer, JobPosting
❌ UserProfile, MatchScore
```

### Function Names
```typescript
✅ calculateSignalScore()
✅ shouldShowOpportunity()
✅ confirmHire()
✅ detectDivergenceSignal()

❌ rankCandidates()
❌ matchJobs()
❌ calculateFreelancerScore()
```

## Implementation Status

### Completed Replacements
- [x] `signal-score.ts` - Uses Signal Score, Access Tier
- [x] `opportunity-scarcity.ts` - Uses Opportunity, not Job
- [x] `hiring-loop.ts` - Uses Operator, Organization
- [x] `organization-control.ts` - Uses Organization terminology
- [x] `behavioral-pressure.ts` - No social features
- [x] `matching-finalization.ts` - Execution-focused
- [x] `decision-correction.ts` - Patent-critical naming
- [x] `anonymity-hardening.ts` - Contribution-focused

### Legacy Files to Update
- [ ] `matching.ts` - Contains JobPosting terminology
- [ ] `matching-v2.ts` - Contains JobPosting terminology
- [ ] `decoy-enhancer.ts` - Contains jobPosting references
- [ ] `anonymity-engine.ts` - Contains job posting references

## Verification Checklist
- [ ] All "job" references replaced with "opportunity"
- [ ] All "candidate" references replaced with "operator"
- [ ] No social feature terminology present
- [ ] No public score/leaderboard references
- [ ] Contribution-based terminology consistent