# BTP Platform - UX/UI Overview

## Design Philosophy

The BTP platform operates on a "calm execution" design philosophy. Unlike traditional job platforms that maximize engagement through notifications, gamification, and social features, BTP is designed to minimize cognitive load while maximizing execution efficiency.

**Core Principles:**
- Information density over visual noise
- Progressive disclosure of complexity
- Behavioral feedback through subtle affordances
- Anonymity-first presentation
- Zero gamification elements

---

## Color System

### Primary Palette

```
┌─────────────────────────────────────────────────────────────────┐
│ PRIMARY COLORS - Trust & Execution                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DEEP_NAVY        #0A1628    ████████  Background, headers      │
│  SLATE_BLUE       #1E3A5F    ████████  Cards, elevated surfaces │
│  STEEL_GRAY       #4A5568    ████████  Secondary text, borders  │
│  MIST_WHITE       #F7FAFC    ████████  Primary background       │
│  PURE_WHITE       #FFFFFF    ████████  Content areas, inputs    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ACCENT COLORS - Status & Feedback                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VERIFIED_GREEN   #10B981    ████████  Success, confirmed       │
│  CAUTION_AMBER    #F59E0B    ████████  Warning, pending         │
│  ALERT_RED        #EF4444    ████████  Error, rejection         │
│  NEUTRAL_TEAL     #14B8A6    ████████  Primary actions          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tier-Based Color Coding (Internal Only)

```
┌─────────────────────────────────────────────────────────────────┐
│ ACCESS TIER INDICATORS (Admin/Internal View Only)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TIER_1           #059669    ████████  High-access operators    │
│  TIER_2           #0EA5E9    ████████  Medium-access operators  │
│  TIER_3           #6B7280    ████████  Limited-access operators │
│                                                                  │
│  NOTE: Tier colors are NEVER shown to operators. Used only      │
│        in internal admin dashboards and system logs.            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Semantic Color Usage

| Context | Color | Hex | Usage |
|---------|-------|-----|-------|
| Opportunity Available | VERIFIED_GREEN | #10B981 | Match cards, status indicators |
| Application Pending | CAUTION_AMBER | #F59E0B | In-progress states |
| Opportunity Closed | STEEL_GRAY | #4A5568 | Completed, archived |
| Action Required | NEUTRAL_TEAL | #14B8A6 | Primary buttons, links |
| Error State | ALERT_RED | #EF4444 | Form errors, system failures |
| Idle State | SLATE_BLUE | #1E3A5F | Inactive, waiting |

### Dark Mode Support

```
┌─────────────────────────────────────────────────────────────────┐
│ DARK MODE PALETTE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DARK_BG         #0D1117    ████████  Primary background        │
│  DARK_SURFACE    #161B22    ████████  Cards, panels             │
│  DARK_BORDER     #30363D    ████████  Dividers, borders         │
│  DARK_TEXT       #E6EDF3    ████████  Primary text              │
│  DARK_MUTED      #8B949E    ████████  Secondary text            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Typography

### Font Stack

```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  --font-display: 'Cal Sans', 'Inter', sans-serif;
}
```

### Type Scale

```
┌─────────────────────────────────────────────────────────────────┐
│ TYPOGRAPHY SCALE                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Display Large    48px / 56px    700    Page headlines          │
│  Display Medium   36px / 44px    600    Section headers         │
│  Heading Large    24px / 32px    600    Card titles             │
│  Heading Medium   18px / 28px    500    Subsections             │
│  Body Large       16px / 24px    400    Primary content         │
│  Body Medium      14px / 20px    400    Secondary content       │
│  Caption          12px / 16px    500    Labels, metadata        │
│  Micro            10px / 14px    600    Timestamps, badges      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Typography Usage Examples

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Display Large                                                   │
│  ████████████████████████████████████                           │
│  Your Opportunities                                              │
│                                                                  │
│  Heading Large                                                   │
│  ████████████████████████████                                    │
│  Senior Protocol Engineer                                        │
│                                                                  │
│  Body Large                                                      │
│  ████████████████████████████████████████████████████████████    │
│  You have been matched with this opportunity based on your      │
│  verified capabilities and project history.                     │
│                                                                  │
│  Caption                                                         │
│  ████████████████                                                │
│  Posted 3 days ago                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Behavior

### 1. Opportunity Card

```
┌─────────────────────────────────────────────────────────────────┐
│                      OPPORTUNITY CARD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ┌──────┐                                                   │ │
│  │ │ ICON │  Senior Protocol Engineer                         │ │
│  │ │ ANON │  ───────────────────────────                      │ │
│  │ └──────┘  Healthcare Technology · Remote                    │ │
│  │                                                            │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │ MATCH CONFIDENCE                                       │ │ │
│  │ │ █████████████████████░░░░░░░░░░  72%                   │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ Required Capabilities:                                     │ │
│  │ • Protocol Design ──── ████████ Verified                   │ │
│  │ • Rust Development ─── ████████ Verified                   │ │
│  │ • Zero-Knowledge Proofs ── ████░░░░ Partial                │ │
│  │                                                            │ │
│  │ Compensation: $180K - $250K                                │ │
│  │                                                            │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │  RESPONSE WINDOW                                        │ │ │
│  │ │  This opportunity expires in 47 hours                   │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │              ┌─────────────────────────────┐                │ │
│  │              │     Express Interest        │                │ │
│  │              └─────────────────────────────┘                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Component States:**

| State | Visual Treatment | Behavior |
|-------|------------------|----------|
| Available | Green indicator, full opacity | Clickable, shows full details |
| Pending Response | Amber indicator, countdown visible | Timer running, urgency shown |
| Accepted | Green checkmark, locked | Shows confirmation, next steps |
| Declined | Grayed out, 50% opacity | Archived, minimal display |
| Expired | Red indicator, faded | Shows "Missed Opportunity" label |

### 2. Match Confidence Meter

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATCH CONFIDENCE METER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EXTERNAL VIEW (Operator sees):                                  │
│                                                                  │
│  Low         Medium        High        Exceptional               │
│  ├───────────┼────────────┼───────────┤                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░                          │
│              ↑                                                  │
│           52% Match                                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  INTERNAL VIEW (Admin only):                                     │
│                                                                  │
│  Signal Score: 67/100                                            │
│  TrustVector: [Tech: 72, Reliability: 65, Ethics: 61]           │
│  Access Tier: TIER_2                                             │
│  Behavior Modifier: +0.12                                        │
│                                                                  │
│  NOTE: The external "Match %" is a transformed representation    │
│  that does NOT directly expose Signal Score. Operators never    │
│  see their actual SS value.                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Response Timer

```
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSE TIMER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tier-Based Visibility Windows:                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER_1 (80-100% SS)                                        │ │
│  │ ████████████████████████████████████████████  72 hours     │ │
│  │ Full visibility, priority access                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER_2 (40-79% SS)                                         │ │
│  │ ████████████████████████████  48 hours                     │ │
│  │ Standard visibility window                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TIER_3 (0-39% SS)                                          │ │
│  │ ████████████████  24 hours                                 │ │
│  │ Limited visibility, shorter window                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Timer Display:                                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⏱ This opportunity expires in                              │ │
│  │                                                            │ │
│  │    23  :  47  :  12                                        │ │
│  │   hrs    min    sec                                        │ │
│  │                                                            │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░             │ │
│  │                                                            │ │
│  │ ⚠ TIER_2 access · 47 hours remaining                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  NOTE: Tier label shown internally only. External display        │
│  shows just the countdown without tier reference.               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Trust Vector Visualization (Internal Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│              TRUST VECTOR - ADMIN DASHBOARD VIEW                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Operator: anon_7f3d2a1b                                         │
│  Signal Score: 78/100 ─── Access Tier: TIER_1                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  TECHNICAL_CAPABILITY                                      │ │
│  │  ███████████████████████████████████████░░░░░░░  85%       │ │
│  │  Based on: 12 verified projects, 3 certifications          │ │
│  │                                                            │ │
│  │  RELIABILITY_INDEX                                         │ │
│  │  ██████████████████████████████████░░░░░░░░░░░░  76%       │ │
│  │  Based on: 8/8 completed contracts, avg 2.1 day response   │ │
│  │                                                            │ │
│  │  ETHICS_ALIGNMENT                                          │ │
│  │  ████████████████████████████████████░░░░░░░░░░  72%       │ │
│  │  Based on: 0 policy violations, peer attestations          │ │
│  │                                                            │ │
│  │  BEHAVIORAL_PRESSURE                                       │ │
│  │  ██████████████████████████████████████████████  94%       │ │
│  │  Status: HEALTHY · No concerning patterns detected         │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Decision-Correction History:                                    │
│  ├── Divergence Signals: 1 (resolved)                           │
│  ├── Silence Signals: 0                                         │
│  └── Last Correction: 47 days ago                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Behavioral Pressure Indicator (Internal)

```
┌─────────────────────────────────────────────────────────────────┐
│              BEHAVIORAL PRESSURE MONITORING                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status Indicators:                                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ● HEALTHY          Normal behavior patterns               │ │
│  │    ████████████████████████████████████████  94%           │ │
│  │                                                            │ │
│  │  ● ELEVATED         Slightly unusual activity              │ │
│  │    ██████████████████████████████░░░░░░░░░░  72%           │ │
│  │                                                            │ │
│  │  ● PRESSURED        Significant behavioral deviation        │ │
│  │    ██████████████████████░░░░░░░░░░░░░░░░░░  45%           │ │
│  │    ⚠ Triggers enhanced monitoring                          │ │
│  │                                                            │ │
│  │  ● CRITICAL         Severe anomaly detected                │ │
│  │    ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  18%           │ │
│  │    🚨 Triggers immediate review                            │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  WARNING: This component is NEVER shown to operators.           │
│  It exists solely for internal fraud detection and system       │
│  integrity monitoring.                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Fee Disclosure Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEE DISCLOSURE MODAL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │    CONTRACT SUMMARY                                        │ │
│  │    ═══════════════════════════════════════════════════     │ │
│  │                                                            │ │
│  │    Organization:        [ANONYMIZED]                       │ │
│  │    Role:                Senior Protocol Engineer           │ │
│  │    Contract Duration:   12 months                          │ │
│  │                                                            │ │
│  │    ─────────────────────────────────────────────────────── │ │
│  │                                                            │ │
│  │    AGREED COMPENSATION                                    │ │
│  │                                                            │ │
│  │    Base Amount:        $200,000                           │ │
│  │    Platform Fee (25%): -$50,000                           │ │
│  │    ─────────────────────────────────────────────────────── │ │
│  │    YOU RECEIVE:        $150,000                           │ │
│  │                                                            │ │
│  │    ─────────────────────────────────────────────────────── │ │
│  │                                                            │ │
│  │    ℹ The 25% platform fee supports:                       │ │
│  │      • Anonymity infrastructure                           │ │
│  │      • Matching algorithm development                      │ │
│  │      • Dispute resolution services                        │ │
│  │      • Operator verification systems                      │ │
│  │                                                            │ │
│  │    ┌─────────────────────┐  ┌─────────────────────┐        │ │
│  │    │       Cancel        │  │   Accept & Proceed  │        │ │
│  │    └─────────────────────┘  └─────────────────────┘        │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Screen Layouts

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HEADER                                                   │   │
│  │  ┌─────┐                        ┌─────────────────────┐  │   │
│  │  │ BTP │  Opportunities (3)     │ Profile │ Settings  │  │   │
│  │  └─────┘                        └─────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  FILTER BAR                                          │ │ │
│  │  │  [All] [Active] [Pending] [Completed]  Sort: [Recent] │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌────────────────────┐  ┌────────────────────┐           │ │
│  │  │                    │  │                    │           │ │
│  │  │  OPPORTUNITY CARD  │  │  OPPORTUNITY CARD  │           │ │
│  │  │                    │  │                    │           │ │
│  │  │  Match: 72%        │  │  Match: 65%        │           │ │
│  │  │  Expires: 47h      │  │  Expires: 23h      │           │ │
│  │  │                    │  │                    │           │ │
│  │  └────────────────────┘  └────────────────────┘           │ │
│  │                                                            │ │
│  │  ┌────────────────────┐                                    │ │
│  │  │                    │                                    │ │
│  │  │  OPPORTUNITY CARD  │                                    │ │
│  │  │                    │                                    │ │
│  │  │  Match: 58%        │                                    │ │
│  │  │  Expires: 12h      │                                    │ │
│  │  │                    │                                    │ │
│  │  └────────────────────┘                                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FOOTER                                                   │   │
│  │  Privacy · Terms · Support                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Organization Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ORGANIZATION PORTAL                                      │   │
│  │  Dashboard · Opportunities · Candidates · Billing         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │    12        │  │    47        │  │    3         │      │ │
│  │  │  Active      │  │  Matches     │  │  Hired       │      │ │
│  │  │  Opps        │  │  Pending     │  │  This Month  │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  ACTIVE MATCHES                                      │ │ │
│  │  │                                                      │ │ │
│  │  │  Role: Sr. Protocol Engineer                         │ │ │
│  │  │  ┌────────────────────────────────────────────────┐ │ │ │
│  │  │  │ anon_7f3d │ Match: 89% │ $180K │ [Review]     │ │ │ │
│  │  │  └────────────────────────────────────────────────┘ │ │ │
│  │  │  ┌────────────────────────────────────────────────┐ │ │ │
│  │  │  │ anon_2a1c │ Match: 76% │ $195K │ [Review]     │ │ │ │
│  │  │  └────────────────────────────────────────────────┘ │ │ │
│  │  │  ┌────────────────────────────────────────────────┐ │ │ │
│  │  │  │ anon_9b4e │ Match: 72% │ $165K │ [Review]     │ │ │ │
│  │  │  └────────────────────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interaction Patterns

### Hover States

```css
/* Opportunity Card Hover */
.opportunity-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.opportunity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Button Hover */
.btn-primary {
  background-color: var(--NEUTRAL_TEAL);
  transition: background-color 0.15s ease;
}

.btn-primary:hover {
  background-color: #0D9488; /* Darker teal */
}

/* Match Meter Animation */
.match-meter {
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Loading States

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOADING STATES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Card Skeleton:                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Pulse Animation:                                                │
│  @keyframes skeleton-pulse {                                    │
│    0%, 100% { opacity: 0.4; }                                   │
│    50% { opacity: 0.8; }                                        │
│  }                                                              │
│                                                                  │
│  Button Loading:                                                 │
│  ┌─────────────────────────────┐                                │
│  │  ◌ Processing...            │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Empty States

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMPTY STATE                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                    ┌─────────────┐                         │ │
│  │                    │             │                         │ │
│  │                    │    📋       │                         │ │
│  │                    │             │                         │ │
│  │                    └─────────────┘                         │ │
│  │                                                            │ │
│  │              No opportunities available                     │ │
│  │                                                            │ │
│  │    Complete your capability verification to receive        │ │
│  │    matched opportunities from organizations.               │ │
│  │                                                            │ │
│  │              ┌─────────────────────────────┐                │ │
│  │              │  Update Capabilities        │                │ │
│  │              └─────────────────────────────┘                │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | Minimum 4.5:1 for body text, 3:1 for large text |
| Focus Indicators | 2px solid outline on all interactive elements |
| Keyboard Navigation | Full tab order support, logical flow |
| Screen Reader Support | ARIA labels on all interactive components |
| Motion Reduction | Respects `prefers-reduced-motion` |

### Focus Ring Design

```css
:focus-visible {
  outline: 2px solid var(--NEUTRAL_TEAL);
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :focus-visible {
    outline: 3px solid var(--PURE_WHITE);
    outline-offset: 3px;
  }
}
```

---

## Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    BREAKPOINT SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Mobile First Approach                                           │
│                                                                  │
│  xs:  0px     - 479px      (Mobile portrait)                    │
│  sm:  480px   - 767px      (Mobile landscape)                   │
│  md:  768px   - 1023px     (Tablet)                             │
│  lg:  1024px  - 1279px     (Desktop)                            │
│  xl:  1280px  - 1535px     (Large desktop)                      │
│  2xl: 1536px+              (Wide screens)                       │
│                                                                  │
│  Card Grid Behavior:                                             │
│                                                                  │
│  xs/sm:  1 column                                               │
│  md:     2 columns                                              │
│  lg:     3 columns                                              │
│  xl/2xl: 4 columns                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Animation Guidelines

### Motion Principles

1. **Purposeful**: Every animation serves a functional purpose
2. **Quick**: Transitions complete in 150-300ms
3. **Natural**: Use easing curves that feel organic
4. **Unobtrusive**: Never distract from the primary task

### Easing Curves

```css
:root {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Prohibited UI Elements

The following UI patterns are explicitly **PROHIBITED** on the BTP platform:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ❌ PROHIBITED ELEMENTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ❌ Like/Heart buttons                                           │
│  ❌ Follower counts                                              │
│  ❌ Public profile pages                                         │
│  ❌ Public score displays                                        │
│  ❌ Leaderboards                                                 │
│  ❌ Achievement badges                                           │
│  ❌ Gamification elements                                        │
│  ❌ Social sharing buttons                                       │
│  ❌ Comment sections                                             │
│  ❌ Testimonial carousels                                        │
│  ❌ "Top performer" highlights                                   │
│  ❌ Notification badges (except essential alerts)                │
│  ❌ Progress bars showing "completion percentage"                │
│  ❌ Comparison features between operators                        │
│                                                                  │
│  RATIONALE: BTP is an execution platform, not a social          │
│  network. Behavioral integrity requires isolation from          │
│  social pressure and comparison dynamics.                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Library Reference

### Button Variants

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUTTON VARIANTS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Primary:                                                        │
│  ┌─────────────────────────────┐                                │
│  │  Express Interest           │  Solid teal background         │
│  └─────────────────────────────┘                                │
│                                                                  │
│  Secondary:                                                      │
│  ┌─────────────────────────────┐                                │
│  │  View Details               │  Outlined, no fill             │
│  └─────────────────────────────┘                                │
│                                                                  │
│  Tertiary:                                                       │
│  ┌─────────────────────────────┐                                │
│  │  Learn More →               │  Text only, underline on hover │
│  └─────────────────────────────┘                                │
│                                                                  │
│  Danger:                                                         │
│  ┌─────────────────────────────┐                                │
│  │  Decline                    │  Solid red background          │
│  └─────────────────────────────┘                                │
│                                                                  │
│  Sizes:                                                          │
│  Small (sm):   32px height                                       │
│  Medium (md):  40px height                                       │
│  Large (lg):   48px height                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Input Fields

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT FIELDS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Default:                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Enter your response...                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Focused:                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  │Enter your response...                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│    ↑ Teal border on focus                                        │
│                                                                  │
│  Error:                                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Invalid input                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│    ⚠ This field is required                                      │
│    ↑ Red border + error message                                  │
│                                                                  │
│  Disabled:                                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│  └────────────────────────────────────────────────────────────┘ │
│    ↑ Gray background, no interaction                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Documentation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Color System | ✅ Complete | Includes dark mode |
| Typography | ✅ Complete | Full scale defined |
| Opportunity Card | ✅ Complete | All states documented |
| Match Confidence Meter | ✅ Complete | Internal/external views |
| Response Timer | ✅ Complete | Tier-based windows |
| Trust Vector Viz | ✅ Complete | Admin only |
| Behavioral Pressure | ✅ Complete | Internal monitoring |
| Fee Disclosure | ✅ Complete | 25% platform fee |
| Dashboard Layouts | ✅ Complete | Both operator and org |
| Accessibility | ✅ Complete | WCAG 2.1 AA |
| Responsive Design | ✅ Complete | Mobile-first |
| Prohibited Elements | ✅ Complete | Social features banned |

---

*This document defines the complete UX/UI specification for the BTP platform. All frontend implementation must adhere to these standards to maintain system integrity and brand consistency.*