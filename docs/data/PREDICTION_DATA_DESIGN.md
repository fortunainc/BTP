# Prediction data design (v0.1)

Date: 2026-10-16. Governs: data track in `docs/vision/BTP_FINAL_VISION.md` section 3. Status: approved direction for data design; first target not yet chosen by the founder.

## 1. Candidate first targets

| Target | Buyer decision it changes | Outcome record | Main data risk |
|---|---|---|---|
| Site activation delay (activates >30 days after plan) | Add backup sites, escalate contract/budget, reassign start-up support | Actual activation date | Planned date often revised; need the original plan |
| Amendment implementation lag (>N days after approval) | Prioritize site support, sequence training and re-consent | Implementation completion date | Defining "complete" consistently |
| Site enrollment shortfall (below target at month 3/6) | Add sites, adjust recruitment support | Enrolled count vs target | Requires partner data for denominators |

Recommendation: start with activation delay or amendment lag, because operators can report the dates themselves; keep enrollment shortfall for when a partner provides counts.

## 2. Event model (additive, implement after target choice)

Every observation and outcome record carries:

| Field | Meaning |
|---|---|
| `observed_at` | When the reporter knew the information |
| `reported_at` | When BTP received it |
| `effective_at` | When the event actually happened |
| `resolved_at` | When the outcome was confirmed (null if open) |
| `resolution_state` | `resolved_on_time`, `resolved_late`, `open`, `withdrawn`, `unknown` |
| `source` | `panel`, `community`, `partner`, `public` |
| `permission_scope` | `community_only`, `research_aggregate`, `model_training`, `partner_restricted` |
| `subject_key` | Reporter-held pseudonymous key for the site-study; links follow-ups without names |
| `record_version` | Incremented on correction; old versions retained for audit, excluded from training |

Rules: ordinary community posts default to `community_only` and are never used for training. Missing outcomes stay `unknown`, never negative. Deletion or withdrawal removes the record from all future training sets.

## 3. Panel pilot protocol (8 weeks)

- **Participants:** 40 operators who have site-studies in start-up or implementing an amendment. Separate research consent, paid per completed check-in.
- **Check-in (weekly, about 2 minutes):** for each tracked site-study: phase, therapeutic area band, site type, planned date, milestones completed since last week (with dates), blockers (from a fixed list), current expected date.
- **Identity:** no site, sponsor, protocol or person names. The participant keeps their own `subject_key` per site-study.
- **Incentive:** $15-25 per completed check-in (hypothesis); budget about $5k-8k plus analyst time.
- **Success measures:** check-in response >75%; complete timestamps on >80% of tracked site-studies; two reviewers agree on >90% of resolved outcome labels.
- **Output:** a feasibility memo, not a model.

## 4. Evaluation rules once data exists

Simple baseline first (base rates by site type and phase). Split by time and by site/organization. Report calibration and Brier score, plus precision at the action threshold. Run silently on new site-studies before any paid use. Thresholds are planning guides, not fixed rules.
