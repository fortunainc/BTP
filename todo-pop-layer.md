# BTP POP Layer Implementation

## SECTION 1: Front Page of Reality
- [ ] Create route `/` (home page)
- [ ] Build Active Situations section (8-12 cards)
- [ ] Build "This Keeps Coming Up" pattern section (3-5 cards)
- [ ] Build Unresolved Pressure section (3-6 items)
- [ ] Validate <5 second understanding

## SECTION 2: Pattern Visibility Engine
- [ ] Create `/lib/pattern-engine.ts`
- [ ] Implement clustering by issueCategory, therapeuticArea, trialPhase
- [ ] Generate pattern titles and descriptions
- [ ] Track pattern status (emerging/repeating/critical)
- [ ] Track resolution status (unresolved/partial/resolved)

## SECTION 3: Seeded Demo Moment Data
- [ ] Create `/scripts/seed-btp-reality.ts`
- [ ] Insert 15 high-quality situations
- [ ] Add 2-4 interactions per situation
- [ ] Ensure tension and disagreement

## SECTION 4: Insight/Consequence Layer
- [ ] Create `/lib/insight-engine.ts`
- [ ] Generate insight statements per pattern
- [ ] Display insights under patterns

## SECTION 5: Killer Use Case (Matching)
- [ ] Build "Who has dealt with this?" UI
- [ ] Display 3 matched Capability Identities per pattern
- [ ] Show domain match explanation

## SECTION 6: Language/Experience Layer
- [ ] Remove all enterprise SaaS terms
- [ ] Replace with operator language
- [ ] Validate tone (blunt, human, direct)

## SECTION 7: Closed Demo Loop
- [ ] Build `/demo` route
- [ ] Show end-to-end flow animation
- [ ] Add step-by-step toggle

## SECTION 8: Final QA
- [ ] Experience test (<5 sec understanding)
- [ ] Impact test (patterns vs isolated)
- [ ] Value test (immediate usefulness)
- [ ] Generate output requirements