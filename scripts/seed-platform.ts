import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: 'postgresql://btpuser:btppassword123@localhost:5432/btpdb?schema=public',
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Realistic anonymous handles for operators
const operatorHandles = [
  'Operator_4821', 'Operator_7293', 'Operator_1856', 'Operator_9147',
  'Operator_3625', 'Operator_5841', 'Operator_2178', 'Operator_6394',
  'Operator_8562', 'Operator_1437', 'Operator_9731', 'Operator_4618',
  'Operator_2859', 'Operator_7192', 'Operator_5846', 'Operator_3271'
];

// Realistic thread data - operator-level specific problems
const threadsData = [
  {
    title: "Subject missed 3 consecutive visits - sponsor asking for protocol deviation justification",
    trialPhase: "Phase 3",
    therapeuticArea: "Oncology",
    siteCountRange: "51-100",
    issueCategory: "Enrollment",
    description: "We have a subject who missed their Week 12, 16, and 20 visits due to transportation issues. The sponsor is asking us to justify why this shouldn't be a protocol deviation. The subject called ahead each time to reschedule but the site couldn't accommodate within the window. The ICF doesn't explicitly mention transportation assistance. Has anyone successfully argued this as a site limitation rather than subject non-compliance? The sponsor is hinting at potential audit findings.",
    urgencyLevel: "Urgent",
    additionalContext: "Site is community oncology, no dedicated research coordinator for this study. Subject lives 2 hours away."
  },
  {
    title: "IRB wants consent revision for already-enrolled subjects - retroactive approach?",
    trialPhase: "Phase 2",
    therapeuticArea: "Rare Disease",
    siteCountRange: "11-50",
    issueCategory: "Regulatory",
    description: "Our IRB just approved a consent form update that adds new language about genetic testing. We have 8 subjects already enrolled under the old consent. The IRB is telling us we need to re-consent everyone. The sponsor says it's not required per protocol. The new language doesn't change any procedures - it's just additional explanatory text. Do we really need to bring everyone back for re-consent? This is a rare disease population and scheduling additional visits is a nightmare.",
    urgencyLevel: "Needs Advice",
    additionalContext: "Study is 18 months, currently at month 6. Subjects visit every 4 weeks."
  },
  {
    title: "Drug temperature excursion during transit - sponsor says continue, I'm not comfortable",
    trialPhase: "Phase 3",
    therapeuticArea: "Cardiology",
    siteCountRange: "100+",
    issueCategory: "IP Management",
    description: "Our depot shipped IP that arrived at 14°C for 6 hours (should be 2-8°C). The sponsor's QP reviewed and said it's acceptable based on stability data and we should continue using it. But the excursion was outside the labeled storage conditions. I've documented everything but I'm uncomfortable administering this to subjects. The sponsor is pushing hard to continue enrollment and says we'll create supply issues if we quarantine. What's my liability here if something goes wrong?",
    urgencyLevel: "Urgent",
    additionalContext: "CRA for 3 sites, all received from same shipment. Sponsor is mid-size pharma."
  },
  {
    title: "Site PI retiring mid-study - sponsor dragging feet on replacement approval",
    trialPhase: "Phase 2",
    therapeuticArea: "Neurology",
    siteCountRange: "11-50",
    issueCategory: "Site Management",
    description: "Our PI announced retirement in 6 weeks. We identified a replacement who's already sub-I on the study. The sponsor's medical monitor is taking forever to approve the CV and the IRB amendment process hasn't started. Our sub-I can sign off on routine visits but can we continue screening new subjects? Protocol says PI must be qualified at time of consent. Anyone dealt with this transition timeline pressure before?",
    urgencyLevel: "Needs Advice",
    additionalContext: "Academic site, 22 subjects enrolled, 4 in screening."
  },
  {
    title: "Subject's spouse demanding to see lab results - HIPAA interpretation question",
    trialPhase: "Phase 3",
    therapeuticArea: "Oncology",
    siteCountRange: "51-100",
    issueCategory: "Subject Safety",
    description: "We have a subject with cognitive decline (MMSE 24, borderline capacity). Their spouse is the legally authorized representative for study procedures but wants copies of all lab results sent to their personal email. The subject is ambivalent. Our privacy officer says we need explicit written authorization. Sponsor says follow local procedures. The spouse is threatening to file a complaint. This feels like a gray area - the LIA designation covers study decisions but does it extend to routine lab sharing?",
    urgencyLevel: "Normal",
    additionalContext: "Site is in Pennsylvania. Subject is 78 years old."
  },
  {
    title: "EHR integration failing - manual source doc verification taking 6+ hours per subject",
    trialPhase: "Phase 3",
    therapeuticArea: "Cardiology",
    siteCountRange: "100+",
    issueCategory: "Data Management",
    description: "Our EHR-to-EDC integration went live 3 months ago and has been nothing but problems. Failed mappings, dropped data, duplicate entries. We're now manually verifying every single source document. For complex subjects with 20+ con meds, it's taking 6+ hours per visit. Sponsor refuses to pause enrollment. We've escalated to the CRO project manager but they keep saying 'it's being worked on.' Meanwhile my team is drowning in query resolution. Is anyone else dealing with integration failures like this?",
    urgencyLevel: "Urgent",
    additionalContext: "Large CRO-managed study, we're one of 15 sites using this EHR."
  },
  {
    title: "Competing trial opened at same site - sponsor threatening termination",
    trialPhase: "Phase 2",
    therapeuticArea: "Oncology",
    siteCountRange: "11-50",
    issueCategory: "Sponsor Expectations",
    description: "A competing pharma company just opened a similar indication trial at our site. Same PI. Our sponsor found out and sent a notice saying we're in breach of exclusivity provisions. I've reviewed our clinical trial agreement - it mentions 'reasonable efforts' for enrollment but nothing about exclusivity. The competing trial has better reimbursement. The PI wants to keep both. Has anyone successfully pushed back on these exclusivity claims?",
    urgencyLevel: "Urgent",
    additionalContext: "We have 12 subjects on our study, 8 active. Competing trial just started screening."
  },
  {
    title: "Protocol amendment added 4 new safety assessments - no additional budget",
    trialPhase: "Phase 3",
    therapeuticArea: "Rare Disease",
    siteCountRange: "11-50",
    issueCategory: "Budget",
    description: "Latest protocol amendment added ECGs at every visit, additional blood draws, and a new patient-reported outcome questionnaire. Sponsor says it's 'within scope' and won't adjust the budget. Our finance team calculated this as 23 additional procedures per subject. For our 18 subjects, that's over 400 extra procedures with no additional compensation. The sponsor is saying we signed a global budget. Is there any recourse here or do we just eat the cost?",
    urgencyLevel: "Needs Advice",
    additionalContext: "Academic site, already operating on thin margins."
  },
  {
    title: "Subject enrolled with exclusion criteria missed - discovered at Month 8",
    trialPhase: "Phase 2",
    therapeuticArea: "Gastroenterology",
    siteCountRange: "11-50",
    issueCategory: "Enrollment",
    description: "Just discovered a subject who was enrolled 8 months ago had a baseline creatinine that should have excluded them (1.9 mg/dL, exclusion cutoff was 1.5). The PI signed off on eligibility. The lab was drawn at a local facility and the value was buried in a 15-page lab report. The medical monitor just caught it during a routine review. Subject has been on study drug the whole time and is doing fine clinically. Do we need to report this as a protocol deviation? Unblinding concern? Sponsor is being vague about next steps.",
    urgencyLevel: "Urgent",
    additionalContext: "PI is very experienced, this is their 40th study. Pure oversight on the lab review."
  },
  {
    title: "CRA monitoring visit turned into a 3-day audit - normal or red flag?",
    trialPhase: "Phase 3",
    therapeuticArea: "Oncology",
    siteCountRange: "51-100",
    issueCategory: "Monitoring",
    description: "Had a CRA visit last week that was supposed to be routine SDV. They ended up spending 3 days on-site, requested every single source document for the past 6 months, and interviewed our coordinators about the consenting process. No findings presented yet but the CRA was taking extensive notes. Sponsor hasn't said anything. Is this level of scrutiny normal or should I be preparing for something bigger? Our enrollment is ahead of target and our query rate is below average. Feeling paranoid.",
    urgencyLevel: "Needs Advice",
    additionalContext: "First time working with this CRO. Site has been open 14 months."
  },
  {
    title: "Subject wants to continue study drug after completing treatment phase",
    trialPhase: "Phase 2",
    therapeuticArea: "Neurology",
    siteCountRange: "11-50",
    issueCategory: "Subject Safety",
    description: "Subject completed the 6-month double-blind phase and entered the 6-month open-label extension. They're convinced the study drug is helping and are asking if they can continue after the OLE ends. The sponsor has no expanded access program and no plans for a follow-on study. The PI is sympathetic but says their hands are tied. Subject is talking about buying the compound from overseas. I feel like we need to document this somehow but not sure what the sponsor wants to hear. Anyone navigated compassionate use requests?",
    urgencyLevel: "Normal",
    additionalContext: "Rare neurodegenerative condition, no approved treatments. Subject is 34."
  },
  {
    title: "Site filing cabinet flooded - source documents damaged but readable",
    trialPhase: "Phase 3",
    therapeuticArea: "Cardiology",
    siteCountRange: "51-100",
    issueCategory: "Data Management",
    description: "A pipe burst over the weekend and flooded our investigator site file storage. About 40 source document binders got wet. Pages are warped and some ink has run but 90%+ is still readable. We're in the process of copying everything to new binders. The CRA is due next week. Do we need to notify the sponsor before their visit? File a memo? The original signatures are intact. This feels like something that should be documented but I'm not sure at what level. Afraid of making a mountain out of a molehill.",
    urgencyLevel: "Needs Advice",
    additionalContext: "Community site, no dedicated regulatory coordinator."
  },
  {
    title: "Subject traveling internationally - how to handle IP shipment?",
    trialPhase: "Phase 2",
    therapeuticArea: "Rare Disease",
    siteCountRange: "11-50",
    issueCategory: "IP Management",
    description: "We have a subject who needs to travel to their home country for a family emergency. They'll be gone for 6 weeks and will miss one scheduled visit. They're asking if we can ship study drug to them internationally. The sponsor says it's not allowed but the protocol doesn't explicitly prohibit it. The subject is threatening to withdraw if we can't accommodate. This is a rare disease study and every subject counts. Has anyone successfully navigated international IP shipment for a subject?",
    urgencyLevel: "Urgent",
    additionalContext: "Subject is traveling to India. Study drug requires cold chain."
  },
  {
    title: "Sub-I left to work for sponsor - conflict of interest concerns?",
    trialPhase: "Phase 3",
    therapeuticArea: "Oncology",
    siteCountRange: "51-100",
    issueCategory: "Site Management",
    description: "Our sub-I just resigned to take a medical director role at the sponsor company running our study. She was involved in 12 active subjects' care. She'll have access to unblinded data in her new role. The PI isn't concerned but I feel like there's a conflict of interest issue here. Should this be reported to the IRB? Does the sponsor need to implement firewalls? She signed confidentiality agreements but this feels like a gray area. The sponsor HR says they're 'aware' but won't give us details.",
    urgencyLevel: "Needs Advice",
    additionalContext: "Sub-I was with our site for 3 years. Her new role starts in 2 weeks."
  },
  {
    title: "Monitor questioning every con med spelling - spending hours on trivial queries",
    trialPhase: "Phase 3",
    therapeuticArea: "Cardiology",
    siteCountRange: "100+",
    issueCategory: "Monitoring",
    description: "Our new CRA is querying every single con med spelling variation. 'Metoprolol succinate' vs 'Metoprolol Succinate ER' vs 'Toprol XL' - she wants them all to match the reference drug dictionary exactly. I'm spending 3+ hours per visit just on con med queries. Previous CRA never cared about this as long as the drug was identifiable. Is this normal? Feels like busywork. The study is using a commercial EDC with auto-complete, so the spellings come from what's in the system. Frustrated.",
    urgencyLevel: "Normal",
    additionalContext: "Large cardiovascular outcomes trial, very high con med burden per subject."
  },
  {
    title: "Site over-enrolled - sponsor says to keep subjects, CRA says protocol deviation",
    trialPhase: "Phase 3",
    therapeuticArea: "Oncology",
    siteCountRange: "51-100",
    issueCategory: "Enrollment",
    description: "Our site was capped at 15 subjects per the site selection letter. We enrolled 17 because the coordinator misunderstood and thought it was a recommendation not a hard cap. All 17 are already randomized and on treatment. Sponsor operations team says to keep them - they'll adjust the cap retroactively. But the CRA is saying it's a major protocol deviation because we exceeded the site-specific enrollment limit. Who's right here? Do I need to document this as a deviation or does the sponsor's approval make it not a deviation?",
    urgencyLevel: "Urgent",
    additionalContext: "Site is in the top 3 enrollers globally. Sponsor is happy with our performance."
  },
  {
    title: "E-signature system down for 2 weeks - wet signatures acceptable?",
    trialPhase: "Phase 2",
    therapeuticArea: "Neurology",
    siteCountRange: "11-50",
    issueCategory: "Data Management",
    description: "Our site's e-signature system has been down for 2 weeks due to a cyberattack on our institution. IT says it could be another 2 weeks before it's restored. Sponsors are asking about signed forms. Can we temporarily use wet signatures on paper and scan them? The protocols all specify e-signatures. Our QA team is drafting an SOP deviation memo but I'm not sure if that's sufficient for all our studies. Anyone dealt with e-signature system outages before?",
    urgencyLevel: "Needs Advice",
    additionalContext: "Academic medical center, 8 active studies affected."
  },
  {
    title: "Patient advocacy group pressuring site to enroll specific patients",
    trialPhase: "Phase 2",
    therapeuticArea: "Rare Disease",
    siteCountRange: "11-50",
    issueCategory: "Enrollment",
    description: "A patient advocacy group for this rare disease has been contacting our site, pressuring us to enroll specific patients they've identified. They're sending us pre-screened patient contact info and asking us to reach out. Some of these patients don't meet eligibility criteria but the group is insistent. They're now threatening to go to the sponsor if we don't accommodate. I feel like this crosses a line - we can't just enroll whoever they send. But I also don't want to damage relationships. Has anyone navigated advocacy group pressure like this?",
    urgencyLevel: "Needs Advice",
    additionalContext: "Rare disease with small patient population. Advocacy group is well-connected."
  },
  {
    title: "Subject died in unrelated accident - sponsor wants to unblind for safety report",
    trialPhase: "Phase 3",
    therapeuticArea: "Oncology",
    siteCountRange: "51-100",
    issueCategory: "Subject Safety",
    description: "One of our subjects died in a car accident - completely unrelated to the study. They were on study drug for 4 months. Sponsor is saying they need to unblind for the safety report. I thought unblinding was only for suspected relatedness? The subject's family is already stressed and now we're telling them we need to break the blind for a clearly unrelated death. The PI thinks it's excessive. Is this standard practice or is the sponsor being overly cautious?",
    urgencyLevel: "Needs Advice",
    additionalContext: "Double-blind oncology study. Death was clearly traumatic, no study drug involvement."
  },
  {
    title: "IRB wants financial disclosure for all site staff including coordinators",
    trialPhase: "Phase 3",
    therapeuticArea: "Cardiology",
    siteCountRange: "51-100",
    issueCategory: "Regulatory",
    description: "Our IRB just sent a new requirement asking for financial disclosure forms for ALL site staff involved in the research - not just investigators. This includes our CRCs, data entry staff, and even the receptionist who schedules visits. The forms ask about equity holdings in pharma companies. Is this normal? Sponsor's financial disclosure template only covers PIs and sub-Is. We have 15 staff members who would need to complete these. Seems excessive and I'm not sure how to handle the discrepancy between IRB and sponsor requirements.",
    urgencyLevel: "Normal",
    additionalContext: "Community site, local IRB. Study is sponsor-initiated."
  },
  {
    title: "Monitoring visit findings: 47 deviations in one day - realistic or audit prep?",
    trialPhase: "Phase 2",
    therapeuticArea: "Oncology",
    siteCountRange: "11-50",
    issueCategory: "Monitoring",
    description: "Had a CRA visit yesterday that resulted in 47 protocol deviation findings. Everything from 'consent signed 3 minutes before first study procedure' to 'vital signs done 2 minutes outside window.' Our site has been running smoothly for 18 months with no major issues. This feels like the CRA is building a paper trail for something. Our previous visits had maybe 3-4 findings total. Should I be concerned? The PI thinks it's a new CRA trying to prove themselves but I'm worried this is audit prep or worse.",
    urgencyLevel: "Urgent",
    additionalContext: "CRO changed 2 months ago. This was our first visit with the new team."
  },
  {
    title: "Sponsor asking us to change AE onset dates to match their 'expected range'",
    trialPhase: "Phase 3",
    therapeuticArea: "Cardiology",
    siteCountRange: "100+",
    issueCategory: "Data Management",
    description: "We have an AE with an onset date that the sponsor's medical monitor says is 'biologically implausible' based on the mechanism of action. They're asking us to 're-evaluate' the date. The PI stands by the documented date - it's what the subject reported. The sponsor keeps sending queries asking us to reconsider. This feels like they're trying to manipulate the data for a cleaner safety profile. The AE is mild and unrelated to efficacy. I don't feel comfortable changing accurate documentation. How do I push back?",
    urgencyLevel: "Urgent",
    additionalContext: "Large cardiovascular outcomes trial approaching primary endpoint."
  },
  {
    title: "Subject's employer requesting confirmation of participation for insurance",
    trialPhase: "Phase 2",
    therapeuticArea: "Oncology",
    siteCountRange: "11-50",
    issueCategory: "Subject Safety",
    description: "One of our subjects' employers is requesting written confirmation that they're participating in a clinical trial for insurance purposes. The subject has asked us to provide this. The insurance company apparently offers benefits for trial participants. The consent form says we won't disclose participation without authorization but the subject IS authorizing. Is there any reason we shouldn't provide this? Seems straightforward but I want to make sure I'm not missing something about confidentiality.",
    urgencyLevel: "Normal",
    additionalContext: "Subject is a teacher at a public school with good trial insurance benefits."
  },
  {
    title: "Site coordinator turnover at 40% this year - sponsor threatening suspension",
    trialPhase: "Phase 3",
    therapeuticArea: "Oncology",
    siteCountRange: "51-100",
    issueCategory: "Site Management",
    description: "Our site has lost 4 of 10 coordinators this year. Burnout, better offers, one moved. The sponsor sent a letter saying our 'staff instability' is a risk and they may suspend enrollment until we stabilize. We're actively hiring but training takes months. The remaining team is stretched thin. I feel like the sponsor's threat will only make retention worse. Has anyone successfully pushed back on these enrollment suspension threats? We're a high-enrolling site and I don't think they actually want to lose us.",
    urgencyLevel: "Urgent",
    additionalContext: "Site is in a rural area, hard to recruit experienced coordinators."
  }
];

// Realistic replies for threads
const repliesData: Record<number, Array<{content: string; isMostHelpful: boolean}>> = {
  0: [
    { content: "Had almost this exact situation last year. Document that the subject proactively contacted the site within the window and the site couldn't accommodate. Frame it as a site capacity issue, not subject non-compliance. We successfully argued this avoided a deviation by showing the subject's intent to comply. The key documentation was the phone log showing the reschedule request. Sponsor accepted it as a site limitation deviation rather than subject fault.", isMostHelpful: true },
    { content: "Check your subject reimbursement language in the ICF. Most sponsors now include language about travel support being available. If it's there, you might be able to argue the site failed to offer resources. That shifts blame from the subject. Also check if there's a patient support program through the CRO.", isMostHelpful: false },
    { content: "The transportation issue is real. We've started using ride-share services for subjects within 50 miles and it's dramatically improved visit adherence. The sponsor might approve it as a pass-through cost if you frame it as retention investment.", isMostHelpful: false }
  ],
  1: [
    { content: "21 CFR 50.25(b)(5) says informed consent must be obtained under circumstances that allow the subject to consider whether to participate. A consent revision that doesn't change procedures is a gray area. Our IRB requires re-consent for ANY consent form change, but we've successfully argued that informational updates can be presented as an information sheet rather than requiring a full re-consent signature. The subjects still get the new information. Worth discussing with your IRB chair.", isMostHelpful: false },
    { content: "If the new language is truly just explanatory and doesn't affect rights or safety, you can often do a 'consent addendum' rather than a full re-consent. The subject signs that they received the additional information. Much simpler than a full re-consent process. We've done this for clarifying language updates. Talk to your IRB about this approach - they may accept it.", isMostHelpful: true },
    { content: "Rare disease population here too - we keep our subjects for years. We've learned to batch consent updates. If we know something is coming, we wait for the next scheduled visit rather than calling them in separately. Your IRB might accept a longer implementation window for non-critical updates.", isMostHelpful: false }
  ],
  2: [
    { content: "Document everything in writing. Your concern about administering excursed product is valid. Ask the sponsor for written confirmation from their quality unit that specifically addresses your liability question. If they won't put it in writing, that's a red flag. We've quarantined product before when we weren't comfortable - the sponsor grumbled but ultimately replaced it. Patient safety trumps supply chain concerns.", isMostHelpful: true },
    { content: "The QP assessment should give you some cover. If their stability data supports the excursion, that's documented evidence. But your concern is also documented. Ask the sponsor to add language to the site file acknowledging the excursion and their determination. That protects you.", isMostHelpful: false },
    { content: "Had a similar situation. We ended up using the product but documented our concern in the regulatory binder. The sponsor's QP letter is on file. If anything goes wrong, we have a paper trail showing we raised the issue. That's really all you can do if the sponsor is adamant and their QP has signed off.", isMostHelpful: false }
  ],
  3: [
    { content: "This is a common scenario. The key question is whether your sub-I is already delegated for screening activities. If yes, they can continue. If no, you need PI delegation or a formal handover. For new subjects, I'd pause screening until you have clarity. It's not worth the compliance risk. The sponsor's delay is their problem, not yours - document your requests.", isMostHelpful: false },
    { content: "Start the IRB amendment NOW even without sponsor approval. Most IRBs will accept a 'pending sponsor approval' notation. You can update the CV once you have it. The 6-week timeline is tight but doable if you initiate immediately. For screening, check if your sub-I is already delegated for consent - if so, you can argue they're qualified.", isMostHelpful: true },
    { content: "We went through PI transition last year. The key is having a documented plan for coverage. Your sub-I should already be signing routine visit notes. For screening, most protocols allow a qualified delegate to obtain consent if the PI is unavailable. Check your delegation log and consent SOP.", isMostHelpful: false }
  ],
  4: [
    { content: "LIA designation covers study procedures but routine lab results are medical records. The spouse would need a HIPAA authorization signed by the subject. If the subject is borderline capacity, have the capacity conversation separately from the HIPAA question. The spouse's LIA role doesn't automatically extend to medical records access. Our privacy officer handles these regularly - they're annoying but solvable.", isMostHelpful: true },
    { content: "Pennsylvania has specific laws about spouse access to medical information. Check if there's a state-level provision that might apply. But generally, LIA for research ≠ healthcare proxy. The spouse might need to establish separate healthcare decision-making authority to access records.", isMostHelpful: false },
    { content: "For subjects with cognitive decline, we do a capacity assessment at each consent checkpoint. If the subject can understand and appreciate the decision about sharing their labs, they can authorize. If not, the LIA steps in. But it's two separate questions. The spouse is conflating their roles.", isMostHelpful: false }
  ],
  5: [
    { content: "Integration failures are rampant right now. Our site had similar issues with Epic-to-Medidata. We escalated to the sponsor's data management team directly (skipped the CRO) and got results in 2 weeks. The CRO PMs often don't understand the technical severity. Go to the people who actually run the integration. Also document the hours - you may be able to claim additional coordinator FTE as pass-through.", isMostHelpful: true },
    { content: "Query your fellow sites using the same EHR through the investigator meeting contacts. If 15 sites are affected, that's a study-level problem. Organize a call with the sponsor's data lead. Individual site complaints get ignored; collective pressure works.", isMostHelpful: false },
    { content: "We switched to manual entry for critical fields and let the integration handle the rest. Imperfect but manageable. For queries, we document the known integration issue and ask the CRA to close with that justification. They understand it's a systemic problem.", isMostHelpful: false }
  ],
  6: [
    { content: "Your CTA governs. If there's no exclusivity clause, the sponsor is bluffing. We've successfully kept both trials open by showing the CTA language to the sponsor's legal team. They backed down quickly once they realized their position was weak. Get your institution's research contracts office involved - they've seen this before.", isMostHelpful: true },
    { content: "Check if the competing trial has a cross-trial prohibition. Some sponsors specifically exclude subjects from concurrent trials. That's different from site exclusivity. Also check your PI's financial disclosure - if they have equity in the competing company, that's a real conflict.", isMostHelpful: false },
    { content: "The 'reasonable efforts' language is your friend. You can demonstrate reasonable efforts by showing your enrollment performance. The competing trial doesn't change your commitment. This sounds like a sponsor trying to intimidate rather than a legitimate contract issue.", isMostHelpful: false }
  ],
  7: [
    { content: "A global budget doesn't mean unlimited scope changes. Document the additional procedures and their time. Send a formal change order request with calculated costs. We've gotten budget amendments approved 80% of the time by showing the concrete impact. Sponsors know sites operate on margins. The key is making it quantitative, not just complaining.", isMostHelpful: true },
    { content: "Check if the protocol amendment was substantial enough to trigger a contract renegotiation. Major procedural additions often qualify. Your institution's contracts office should review. Also see if the IRB required additional review - that's billable time.", isMostHelpful: false },
    { content: "For rare disease studies, sponsors are often more flexible because sites are scarce. Frame it as: 'We want to continue participating but this impacts our ability to meet the budget.' They may find money they claim doesn't exist.", isMostHelpful: false }
  ],
  8: [
    { content: "This is a major protocol deviation and needs to be reported. The subject should have been excluded. The bigger question is what to do now. Sponsor's medical monitor should guide whether to continue or discontinue. If the study drug could affect kidney function, that's a safety concern. Document everything, including how the oversight happened and your corrective action plan for lab review. This will likely trigger a monitor visit.", isMostHelpful: true },
    { content: "The unblinding question depends on whether the creatinine clearance would have excluded them for safety reasons (usually yes). The sponsor needs to report this to their safety committee. The subject staying clinically stable is good but doesn't change the eligibility violation. Prepare for an audit.", isMostHelpful: false },
    { content: "We had a similar exclusion miss at Month 6. The sponsor kept the subject on study with increased renal monitoring. But it was fully documented and reported. The key is transparency - trying to hide it would be far worse than the original error.", isMostHelpful: false }
  ],
  9: [
    { content: "Three-day visits are unusual for routine SDV but not unprecedented. If your enrollment is good and queries are low, it might be a 'for cause' trigger from another site's issues. Don't panic. Ask the CRA directly: 'Is there anything specific I should be aware of?' Their response will tell you if this is routine or targeted.", isMostHelpful: false },
    { content: "CRO transitions often trigger more thorough baseline assessments. They're essentially re-validating the site. Our site went through this - turned out the previous CRO had quality issues at other sites and the new team was being thorough everywhere. We actually appreciated the fresh look after the initial anxiety passed. If your documentation is solid, you'll be fine.", isMostHelpful: true },
    { content: "Interviewing coordinators about consent process is a red flag. Someone may have reported an issue. Review your consent documentation from the past 6 months proactively. Make sure everything is in order before the findings come through.", isMostHelpful: false }
  ],
  10: [
    { content: "Expanded access is complicated but possible. The sponsor would need to file an IND supplement for a single-patient IND. Many sponsors avoid it because of liability concerns. Document the subject's request and your discussion. You can provide the FDA expanded access contact information if they want to pursue it independently. It's not your responsibility to make the case to the sponsor.", isMostHelpful: false },
    { content: "For rare diseases with no approved treatments, there's sometimes a pathway through the FDA's Right to Try provisions if the sponsor refuses expanded access. But it requires manufacturer cooperation. The sponsor's position is frustrating but legal. Document their response and move on. You can't force them.", isMostHelpful: false },
    { content: "Had this conversation with a family last year. We documented the request, the PI's discussion with the sponsor, and the sponsor's response. We also provided the subject with the clinicaltrials.gov contact for the sponsor's medical affairs department - they can inquire about future studies or expanded access directly. We can't facilitate overseas purchasing - that's a liability we won't touch.", isMostHelpful: true }
  ],
  11: [
    { content: "Document the incident in a memo to file including date, cause, affected documents, and remediation steps. Take photos of the damage. Your copy process is correct. The CRA will want to see the memo. This is more common than you'd think - your institution's facilities management should also have an incident report. That demonstrates institutional response.", isMostHelpful: true },
    { content: "No need to notify sponsor before the visit - this isn't a safety issue. But have the documentation ready. The key is showing you took immediate corrective action. Warped pages are acceptable as long as content is legible. Consider making certified copies and noting 'copy of water-damaged original' on each page.", isMostHelpful: false },
    { content: "If any original signatures were affected, you may need a re-signing affidavit. Check each one. For documents with legible content but cosmetic damage, note it in your TMF index. Auditors have seen this before.", isMostHelpful: false }
  ],
  12: [
    { content: "International IP shipment is extremely complex. Most sponsors prohibit it due to import/export regulations, chain of custody, and GCP concerns. If the subject withdraws, document it as lost to follow-up due to travel, not protocol non-compliance on your part. You tried to accommodate within your authority. Better to lose one subject than create a GCP violation.", isMostHelpful: true },
    { content: "Some sponsors will allow a local site or medical facility to administer doses under your supervision. We've done this for subjects traveling within the US. Internationally is much harder due to regulatory differences. Ask if the sponsor has sites in India that could temporarily assume care.", isMostHelpful: false },
    { content: "The cold chain requirement makes this nearly impossible. IP can't be shipped to unqualified locations. The sponsor's refusal is correct from a regulatory standpoint, even if frustrating for the subject. Document their request and your inability to accommodate due to protocol and regulatory constraints.", isMostHelpful: false }
  ],
  13: [
    { content: "This is a potential conflict that should be reported to your IRB. The sub-I will have access to unblinded data that could influence her new employer's product development. The sponsor should implement firewalls - but that's their responsibility, not yours. Document the transition and notify the IRB. Let them determine if additional action is needed.", isMostHelpful: true },
    { content: "Check your site's financial disclosure forms - the sub-I's new role might trigger an update requirement since she'll have financial interest in the sponsor. The PI's lack of concern is concerning. This could affect study integrity.", isMostHelpful: false },
    { content: "We had a similar situation. The sponsor implemented a data firewall and removed the former sub-I from any communications about the study. Your institution's conflict of interest committee should also be notified. This is exactly the kind of thing they track.", isMostHelpful: false }
  ],
  14: [
    { content: "This CRA is being overly pedantic. Con meds should be identifiable, not dictionary-perfect. Escalate to the monitoring manager. Ask for written guidance on acceptable format. We pushed back on similar requests and got a site-specific clarification that saved us hours. Most CRAs have discretion - this one is choosing not to use it.", isMostHelpful: true },
    { content: "Some EDC systems have drug dictionaries that auto-correct. If yours does, use it consistently. If it doesn't, document that the entries match the source document verbatim. The CRA is creating work, but you can push back on non-standardized drug names being a query-worthy issue.", isMostHelpful: false },
    { content: "This sounds like a new CRA who doesn't understand risk-based monitoring. Point out that con med spelling variations have no impact on subject safety or data integrity. Request that the CRA focus on meaningful findings. Your time is better spent on actual issues.", isMostHelpful: false }
  ],
  15: [
    { content: "The sponsor's retroactive approval makes it NOT a protocol deviation. A deviation is a failure to follow the protocol. If the sponsor (who controls the protocol) approves the additional enrollments, you're compliant. Document the sponsor's approval in writing. The CRA is applying the original cap, but the sponsor has modified it. Sponsor's operations team has the authority here.", isMostHelpful: true },
    { content: "This is a communication gap between the CRA and sponsor operations. The CRA is technically correct that you exceeded the original cap, but the deviation is 'resolved' by the sponsor's retroactive adjustment. Document it as a deviation with immediate corrective action (sponsor approval). Everyone wins.", isMostHelpful: false },
    { content: "We over-enrolled once and the sponsor thanked us. The cap was based on enrollment projections that turned out to be conservative. Your site's strong performance probably made them happy to adjust. The CRA is being rigid; ask the sponsor PM to clarify with the CRA's manager.", isMostHelpful: false }
  ],
  16: [
    { content: "Wet signatures during e-system outages are generally acceptable as a temporary measure. Document the outage, its duration, and your mitigation plan. The SOP deviation memo is the right approach. Most protocols say 'documented signature' not specifically 'electronic.' Check with each sponsor individually, but I've never had one refuse wet signatures during an outage.", isMostHelpful: true },
    { content: "21 CFR Part 11 allows for alternative signature methods during system failures. Your QA approach is correct. The key is documentation and timely migration to e-signatures once the system is restored. You may need to re-sign electronically as a batch.", isMostHelpful: false },
    { content: "Contact your sponsors immediately. They may have guidance from other affected sites. This is likely bigger than your institution if it's a cyberattack - other hospitals may have faced similar issues. There may be industry guidance emerging.", isMostHelpful: false }
  ],
  17: [
    { content: "Advocacy groups are important partners but they don't control enrollment criteria. Document their requests and your responses. If a patient doesn't meet eligibility, they're not eligible - period. The sponsor would reject them at randomization anyway. Explain that you can pre-screen but eligibility is protocol-defined. If they escalate to the sponsor, the sponsor will back you on eligibility criteria.", isMostHelpful: true },
    { content: "We work closely with advocacy groups and have learned to manage expectations. We share our general enrollment criteria (not patient-specific) and offer to add patients to a notification list for future studies. Most groups appreciate transparency about what you can and can't do.", isMostHelpful: false },
    { content: "Sending patient contact info without patient consent is a HIPAA issue for them, not you. You can't reach out to patients who haven't contacted you directly. That's cold outreach using protected information. Gently explain this to the advocacy group.", isMostHelpful: false }
  ],
  18: [
    { content: "Sponsor is being overly cautious but not wrong. For fatal events, many sponsors now unblind as standard practice for complete safety reporting, regardless of relatedness. It's a conservative approach driven by regulatory expectations. The family doesn't need to know the treatment assignment - it's for the sponsor's DSUR. Annoying but not inappropriate.", isMostHelpful: true },
    { content: "Check your protocol's unblinding section. Some protocols specify criteria for unblinding. If it says 'suspected relatedness,' the sponsor may be overstepping. But most modern protocols allow sponsor discretion for any death. This is increasingly common.", isMostHelpful: false },
    { content: "The unblinding doesn't change anything for the family. It's an administrative step for the sponsor's safety database. You can explain it that way. The blind is broken for reporting purposes only.", isMostHelpful: false }
  ],
  19: [
    { content: "IRBs can set their own requirements beyond regulations. Your options are: comply, negotiate, or find a different IRB. For a study already underway, compliance is usually the path of least resistance. But you can ask the IRB to accept the sponsor's financial disclosure process as equivalent. They might accept it for non-investigators.", isMostHelpful: false },
    { content: "Financial disclosure regulations (21 CFR 54) only require disclosure for investigators, not coordinators. Your IRB is going beyond requirements. You can push back by citing the regulation and asking why the additional staff are included. They may modify their request. Otherwise, it's a 15-form annoyance you'll need to complete.", isMostHelpful: true },
    { content: "We had this fight with our IRB. We compromised by having coordinators sign a simplified form acknowledging they have no relevant financial interests. Less burdensome than the full form. Worth proposing.", isMostHelpful: false }
  ],
  20: [
    { content: "CRO change + dramatically increased findings = new team establishing baseline. They're finding everything that was missed or tolerated before. This is actually good for your site's compliance long-term. Review the findings seriously, fix what's real, and don't take it personally. The number of findings says more about the previous CRO than your site.", isMostHelpful: true },
    { content: "47 findings in one visit is excessive for a site with no prior issues. Ask for a meeting with the CRA's manager. Some of those 'deviations' may not be deviations at all - consent timing within the same visit, for example. Get clarity on their expectations before the next visit.", isMostHelpful: false },
    { content: "This could be audit prep, but more likely it's a new CRA team proving themselves. Document your concerns and ask the CRA for their finding criteria. Some things like vital signs within reasonable windows are usually not flagged. The team may need calibration.", isMostHelpful: false }
  ],
  21: [
    { content: "This is a major red flag. Do not change accurate documentation. The sponsor's request could be construed as data manipulation. Document the query, your PI's response, and the sponsor's persistence. If they continue pushing, escalate to your institution's research integrity office. Your responsibility is to accurate source documentation, not the sponsor's preferred safety profile.", isMostHelpful: true },
    { content: "Ask the sponsor to put their request in writing with a clinical justification. If they won't, that tells you everything. An AE onset date is what the subject reported. You can add a note: 'Medical monitor suggests alternative onset based on MOA' but you can't change the primary documentation.", isMostHelpful: false },
    { content: "FDA has taken action against sponsors for this exact behavior. Document everything. If you're uncomfortable, you can file a protected report with the FDA. The sponsor is putting your site in an impossible position.", isMostHelpful: false }
  ],
  22: [
    { content: "This is straightforward. The subject can authorize disclosure of their participation. HIPAA allows it. Provide a letter confirming enrollment without revealing protocol details. The subject signs an authorization specifying what information to share. We've done this several times for insurance purposes.", isMostHelpful: true },
    { content: "Check with your IRB - some consent forms specifically address external disclosures. If the consent allows it with subject authorization, you're fine. If it's silent, a HIPAA authorization form covers it. Your privacy officer should have a template.", isMostHelpful: false },
    { content: "We provide a standard letter: '[Subject name] is enrolled in a clinical trial at [Site] under the supervision of [PI].' No diagnosis, no drug name, no protocol details. That's usually sufficient for insurance purposes and protects the subject's full medical information.", isMostHelpful: false }
  ],
  23: [
    { content: "Sponsor threats often backfire exactly as you describe. Push back by showing your enrollment metrics and the industry-average coordinator turnover (which is 30%+). Offer a retention plan with specific milestones. Sponsors rarely actually suspend high-performing sites - they need your enrollment numbers. Call their bluff professionally.", isMostHelpful: false },
    { content: "This is a real challenge. Rural sites face this constantly. Some solutions: 1) Remote work options for administrative tasks, 2) Relocation/signing bonuses built into the budget, 3) Training partnerships with local nursing programs. Document your efforts. The sponsor's threat should come with support, not just pressure.", isMostHelpful: true },
    { content: "Ask the sponsor for coordinator support - some will fund a floating coordinator or provide CRO staff temporarily. Turn it around: 'We need your help to stabilize.' If they want the site to succeed, they'll invest.", isMostHelpful: false }
  ]
};

// Realistic job postings
const jobPostingsData = [
  {
    title: "Senior CRA - Oncology Phase 3",
    description: "Large Phase 3 oncology study with 80+ sites needs experienced CRA coverage. Primary responsibilities include site initiation, routine monitoring, and close-out visits. Must be comfortable with high-volume SDV and complex safety reporting. Study involves immunotherapy agent with specific AE profile requiring careful monitoring. Travel 60-70% across assigned region.",
    contractorType: "Independent Contractor",
    requiredRole: "CRA",
    requiredSkills: ["Oncology experience", "Phase 3 monitoring", "Immunotherapy AE recognition", "Medidata Rave"],
    experienceLevel: "Senior",
    duration: "12 months",
    therapeuticArea: "Oncology",
    trialPhase: "Phase 3",
    location: "Remote with travel",
    remoteCapable: true,
    organizationType: "cro",
    compensationBand: "$85-110/hr"
  },
  {
    title: "CRC Float - Multi-Study Coverage",
    description: "Academic medical center needs experienced CRC to cover 4 ongoing studies during maternity leave. Studies include Phase 2 rare disease and Phase 3 cardiology. Must be comfortable with complex eligibility criteria and high-volume subject interaction. EDC experience with both Medidata and Oracle InForm required. Opportunity to extend beyond initial coverage period.",
    contractorType: "Independent Contractor",
    requiredRole: "CRC",
    requiredSkills: ["Multi-study coordination", "ICF process", "Medidata Rave", "Oracle InForm", "EHR documentation"],
    experienceLevel: "Mid",
    duration: "6 months",
    therapeuticArea: "Rare Disease",
    trialPhase: "Phase 2",
    location: "Boston, MA",
    remoteCapable: false,
    organizationType: "academic",
    compensationBand: "$55-70/hr"
  },
  {
    title: "Regulatory Specialist - IND Submission Support",
    description: "Biotech sponsor needs regulatory support for upcoming IND submission. Primary deliverables include organizing pre-IND meeting package, compiling nonclinical and CMC summaries, and coordinating with FDA. Must have experience with eCTD format and FDA submission process. Oncology or rare disease experience preferred but not required.",
    contractorType: "Independent Contractor",
    requiredRole: "Regulatory Specialist",
    requiredSkills: ["IND preparation", "eCTD", "FDA meetings", "CMC documentation"],
    experienceLevel: "Senior",
    duration: "4 months",
    therapeuticArea: "Oncology",
    trialPhase: "Phase 1",
    location: "Remote",
    remoteCapable: true,
    organizationType: "sponsor",
    compensationBand: "$90-115/hr"
  },
  {
    title: "Site Start-Up Lead - Neurology Study",
    description: "Global Phase 2 neurology study initiating 30 US sites. Need experienced site start-up specialist to manage regulatory submissions, IRB approvals, and site activation timelines. Must have relationships with major central IRBs and experience with compressed timelines. Study uses adaptive design with potential for protocol amendments during start-up phase.",
    contractorType: "Independent Contractor",
    requiredRole: "Operations",
    requiredSkills: ["Site activation", "IRB submissions", "Regulatory binders", "CTMS tracking", "Central IRB experience"],
    experienceLevel: "Senior",
    duration: "8 months",
    therapeuticArea: "Neurology",
    trialPhase: "Phase 2",
    location: "Remote with occasional travel",
    remoteCapable: true,
    organizationType: "cro",
    compensationBand: "$75-95/hr"
  },
  {
    title: "Clinical Data Manager - Study Build",
    description: "Phase 3 cardiovascular outcomes trial needs data management support for EDC build and UAT. Study has complex endpoint adjudication workflow and integration with central lab and ECG vendors. Must have Medidata Rave build experience and familiarity with CDISC standards. Opportunity to continue through study conduct if desired.",
    contractorType: "Independent Contractor",
    requiredRole: "Data Entry",
    requiredSkills: ["Medidata Rave build", "Edit check specifications", "CDISC SDTM", "Vendor integration", "UAT"],
    experienceLevel: "Senior",
    duration: "5 months",
    therapeuticArea: "Cardiology",
    trialPhase: "Phase 3",
    location: "Remote",
    remoteCapable: true,
    organizationType: "cro",
    compensationBand: "$70-90/hr"
  },
  {
    title: "Study Coordinator - Phase 1 Unit",
    description: "Early phase clinical research unit needs experienced coordinator for first-in-human study. Responsibilities include intensive PK sampling coordination, subject recruitment, and safety monitoring. Unit runs 24-hour admissions with overnight stays. Must be comfortable with intensive visit schedules and real-time safety reporting. Investigator-initiated study with novel mechanism.",
    contractorType: "Independent Contractor",
    requiredRole: "CRC",
    requiredSkills: ["Phase 1 experience", "PK sampling", "Intensive monitoring", "Overnight coverage", "Safety reporting"],
    experienceLevel: "Senior",
    duration: "9 months",
    therapeuticArea: "Rare Disease",
    trialPhase: "Phase 1",
    location: "San Francisco, CA",
    remoteCapable: false,
    organizationType: "academic",
    compensationBand: "$60-80/hr"
  },
  {
    title: "CTM - Global Study Oversight",
    description: "Mid-size pharma seeks CTM for global Phase 2 study across 45 sites. Study just completed enrollment and entering treatment phase. Need experienced CTM to oversee CRO performance, manage sponsor oversight, and handle regulatory submissions. Must be comfortable with limited travel and strong matrix management. Study has had enrollment challenges - need someone who can stabilize operations.",
    contractorType: "Independent Contractor",
    requiredRole: "CTM",
    requiredSkills: ["CRO oversight", "Sponsor-side experience", "Global study management", "Risk mitigation", "TMF management"],
    experienceLevel: "Senior",
    duration: "18 months",
    therapeuticArea: "Oncology",
    trialPhase: "Phase 2",
    location: "Remote with quarterly travel",
    remoteCapable: true,
    organizationType: "sponsor",
    compensationBand: "$100-130/hr"
  },
  {
    title: "Quality Assurance Specialist - Pre-Inspection Readiness",
    description: "Site network preparing for FDA inspection of 3 studies. Need QA specialist to conduct internal audits, develop corrective action plans, and prepare staff for inspection interviews. Focus is on consent documentation, source data integrity, and investigational product accountability. Must have FDA inspection experience and GCP audit certification.",
    contractorType: "Independent Contractor",
    requiredRole: "Quality",
    requiredSkills: ["GCP auditing", "FDA inspection preparation", "CAPA development", "Consent review", "FDA 483 response"],
    experienceLevel: "Senior",
    duration: "4 months",
    therapeuticArea: "Oncology",
    trialPhase: "Phase 3",
    location: "Chicago, IL",
    remoteCapable: false,
    organizationType: "site",
    compensationBand: "$80-105/hr"
  }
];

async function main() {
  console.log('🌱 Starting platform seeding...');

  // Create seed users (operators)
  console.log('Creating seed users...');
  const users = [];
  for (let i = 0; i < operatorHandles.length; i++) {
    const handle = operatorHandles[i];
    const roleCategories = ['cra', 'crc', 'pi', 'regulatory', 'data_mgmt', 'quality', 'operations', 'ctm'];
    const companyCategories = ['cro', 'site', 'sponsor', 'vendor', 'academic'];
    
    const user = await prisma.user.upsert({
      where: { handle },
      update: {},
      create: {
        clerkId: `seed_${i}_${Date.now()}`,
        handle,
        userRole: 'operator',
        roleCategory: roleCategories[i % roleCategories.length],
        companyCategory: companyCategories[i % companyCategories.length],
        verificationStatus: 'Approved',
        email: `${handle.toLowerCase()}@seed.operator`,
        emailVerified: true,
        trustScore: 100,
        isFoundingOperator: i < 5,
      }
    });
    users.push(user);
  }
  console.log(`Created ${users.length} seed users`);

  // Create contributions (replacing threads with new architecture)
  console.log('Creating contributions...');
  const contributions = [];
  for (let i = 0; i < threadsData.length; i++) {
    const threadData = threadsData[i];
    const contribution = await prisma.contribution.create({
      data: {
        userId: users[i % users.length].id,
        contributionType: 'situation',
        title: threadData.title,
        description: threadData.description,
        therapeuticArea: threadData.therapeuticArea,
        trialPhase: threadData.trialPhase,
        issueCategory: threadData.issueCategory,
        correlationRisk: Math.random() * 0.3,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }
    });
    contributions.push(contribution);
  }
  console.log(`Created ${contributions.length} contributions`);

  // Create interactions (replacing replies with new architecture)
  console.log('Creating interactions...');
  let interactionCount = 0;
  for (const [threadIndex, replies] of Object.entries(repliesData)) {
    const threadIdx = parseInt(threadIndex);
    if (threadIdx >= contributions.length) continue;
    
    for (const replyData of replies) {
      await prisma.interaction.create({
        data: {
          contributionId: contributions[threadIdx].id,
          userId: users[(threadIdx + Math.floor(Math.random() * 5) + 1) % users.length].id,
          interactionType: 'ADD_CONTEXT',
          context: replyData.content,
          weight: replyData.isMostHelpful ? 2.0 : 1.0,
          createdAt: new Date(contributions[threadIdx].createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        }
      });
      interactionCount++;
    }
  }
  console.log(`Created ${interactionCount} interactions`);

  // Create job postings
  console.log('Creating job postings...');
  const jobPostings = [];
  for (let i = 0; i < jobPostingsData.length; i++) {
    const jobData = jobPostingsData[i];
    const job = await prisma.jobPosting.create({
      data: {
        creatorId: users[i % 3].id,
        title: jobData.title,
        description: jobData.description,
        contractorType: jobData.contractorType,
        requiredRole: jobData.requiredRole,
        requiredSkills: jobData.requiredSkills,
        experienceLevel: jobData.experienceLevel,
        duration: jobData.duration,
        therapeuticArea: jobData.therapeuticArea,
        trialPhase: jobData.trialPhase,
        location: jobData.location,
        remoteCapable: jobData.remoteCapable,
        organizationType: jobData.organizationType,
        compensationBand: jobData.compensationBand,
        status: 'Open',
        priorityLevel: i < 3 ? 'Urgent' : 'Normal',
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      }
    });
    jobPostings.push(job);
  }
  console.log(`Created ${jobPostings.length} job postings`);

  console.log('✅ Platform seeding complete!');
  console.log(`Summary: ${users.length} users, ${contributions.length} contributions, ${interactionCount} interactions, ${jobPostings.length} job postings`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});