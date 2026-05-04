-- BTP Analytics Seed Script v2
-- CRITICAL: All seeded data is marked with dataSource = 'SEEDED'
-- This ensures seeded data never contaminates real KPIs

-- Clear existing data
TRUNCATE TABLE "AnalyticsEvent" CASCADE;
TRUNCATE TABLE "UserMetrics" CASCADE;
TRUNCATE TABLE "DailyMetrics" CASCADE;
TRUNCATE TABLE "AdminAccessLog" CASCADE;
TRUNCATE TABLE "IdentityMap" CASCADE;

-- Insert UserMetrics with dataSource = 'SEEDED'
-- Users (50)
INSERT INTO "UserMetrics" ("id", "anonymousUserId", "dataSource", "roleType", "verificationStatus", "signupDateBucket", "lastActiveBucket", "postCount", "interactionCount", "reflectionOpenCount", "opportunityInviteCount", "microConsultCount", "revenueGeneratedCents", "retentionStatus", "updatedAt")
SELECT
    gen_random_uuid(),
    'USR-' || substr(md5(random()::text), 1, 4),
    'SEEDED',
    'user',
    CASE WHEN random() > 0.3 THEN 'Verified' ELSE 'Pending' END,
    (CURRENT_DATE - (random() * 90)::int)::text,
    (CURRENT_DATE - (random() * 30)::int)::text,
    (random() * 20)::int,
    (random() * 50)::int,
    (random() * 10)::int,
    (random() * 5)::int,
    (random() * 3)::int,
    (random() * 50000)::int,
    CASE WHEN random() > 0.7 THEN 'active' WHEN random() > 0.4 THEN 'dormant' ELSE 'churned' END,
    NOW()
FROM generate_series(1, 50);

-- Operators (30)
INSERT INTO "UserMetrics" ("id", "anonymousUserId", "dataSource", "roleType", "verificationStatus", "signupDateBucket", "lastActiveBucket", "postCount", "interactionCount", "reflectionOpenCount", "opportunityInviteCount", "microConsultCount", "revenueGeneratedCents", "retentionStatus", "updatedAt")
SELECT
    gen_random_uuid(),
    'OPR-' || substr(md5(random()::text), 1, 4),
    'SEEDED',
    'operator',
    CASE WHEN random() > 0.2 THEN 'Verified' ELSE 'Pending' END,
    (CURRENT_DATE - (random() * 90)::int)::text,
    (CURRENT_DATE - (random() * 30)::int)::text,
    (random() * 30)::int,
    (random() * 100)::int,
    (random() * 15)::int,
    (random() * 10)::int,
    (random() * 8)::int,
    (random() * 150000)::int,
    CASE WHEN random() > 0.6 THEN 'active' WHEN random() > 0.3 THEN 'dormant' ELSE 'churned' END,
    NOW()
FROM generate_series(1, 30);

-- Organizations (10)
INSERT INTO "UserMetrics" ("id", "anonymousUserId", "dataSource", "roleType", "verificationStatus", "signupDateBucket", "lastActiveBucket", "postCount", "interactionCount", "reflectionOpenCount", "opportunityInviteCount", "microConsultCount", "revenueGeneratedCents", "retentionStatus", "updatedAt")
SELECT
    gen_random_uuid(),
    'ORG-' || substr(md5(random()::text), 1, 4),
    'SEEDED',
    'organization',
    CASE WHEN random() > 0.1 THEN 'Verified' ELSE 'Pending' END,
    (CURRENT_DATE - (random() * 90)::int)::text,
    (CURRENT_DATE - (random() * 30)::int)::text,
    (random() * 10)::int,
    (random() * 50)::int,
    0,
    (random() * 20)::int,
    0,
    (random() * 500000)::int,
    CASE WHEN random() > 0.5 THEN 'active' ELSE 'dormant' END,
    NOW()
FROM generate_series(1, 10);

-- Create IdentityMap entries for all seeded users
-- This maps real user IDs to anonymous IDs
INSERT INTO "IdentityMap" ("id", "realUserId", "anonymousUserId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    'seeded-user-' || substr(md5(random()::text), 1, 8),
    "anonymousUserId",
    NOW(),
    NOW()
FROM "UserMetrics" WHERE "dataSource" = 'SEEDED';

-- Insert DailyMetrics with dataSource = 'SEEDED'
INSERT INTO "DailyMetrics" ("id", "dateBucket", "dataSource", "totalUsers", "newUsers", "verifiedOperators", "verifiedOrgs", "onboardingCompleted", "dau", "sessions", "notificationsSent", "notificationsOpened", "postsCreated", "interactions", "reflectionsSent", "reflectionsOpened", "microOppsCreated", "operatorInvites", "operatorInterests", "consultsCompleted", "gmvCents", "platformRevenueCents", "operatorPayoutsCents", "flaggedContent", "redactionsApplied", "highRiskPosts", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    (CURRENT_DATE - (n - 1))::text,
    'SEEDED',
    90 + (n * 2),
    (random() * 5)::int + 1,
    25 + (n / 3),
    8 + (n / 10),
    (random() * 10)::int,
    (random() * 30)::int + 10,
    (random() * 50)::int + 20,
    (random() * 20)::int,
    (random() * 15)::int,
    (random() * 20)::int + 5,
    (random() * 50)::int + 10,
    (random() * 10)::int,
    (random() * 8)::int,
    (random() * 5)::int,
    (random() * 3)::int,
    (random() * 2)::int,
    (random() * 3)::int,
    (random() * 10000)::int,
    (random() * 3000)::int,
    (random() * 7000)::int,
    (random() * 3)::int,
    (random() * 5)::int,
    (random() * 2)::int,
    NOW(),
    NOW()
FROM generate_series(1, 31) AS n;

-- Insert AnalyticsEvents with dataSource = 'SEEDED'
-- User events
INSERT INTO "AnalyticsEvent" ("id", "anonymousUserId", "eventType", "eventCategory", "objectType", "objectId", "metadataJson", "dataSource", "createdAtBucket", "createdAt")
SELECT
    gen_random_uuid(),
    (SELECT "anonymousUserId" FROM "UserMetrics" WHERE "dataSource" = 'SEEDED' ORDER BY random() LIMIT 1),
    (ARRAY['signup_started', 'signup_completed', 'onboarding_started', 'onboarding_completed', 'login', 'session_started', 'profile_completed'])[floor(random() * 7 + 1)::int],
    'user',
    'User',
    gen_random_uuid()::text,
    '{}',
    'SEEDED',
    (CURRENT_DATE - (random() * 30)::int)::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 100);

-- Situation events
INSERT INTO "AnalyticsEvent" ("id", "anonymousUserId", "eventType", "eventCategory", "objectType", "objectId", "metadataJson", "dataSource", "createdAtBucket", "createdAt")
SELECT
    gen_random_uuid(),
    (SELECT "anonymousUserId" FROM "UserMetrics" WHERE "dataSource" = 'SEEDED' ORDER BY random() LIMIT 1),
    (ARRAY['situation_started', 'situation_submitted', 'situation_redacted', 'situation_structured', 'ai_extraction_completed', 'reflection_generated', 'reflection_opened'])[floor(random() * 7 + 1)::int],
    'situation',
    'Contribution',
    gen_random_uuid()::text,
    '{}',
    'SEEDED',
    (CURRENT_DATE - (random() * 30)::int)::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 150);

-- Engagement events
INSERT INTO "AnalyticsEvent" ("id", "anonymousUserId", "eventType", "eventCategory", "objectType", "objectId", "metadataJson", "dataSource", "createdAtBucket", "createdAt")
SELECT
    gen_random_uuid(),
    (SELECT "anonymousUserId" FROM "UserMetrics" WHERE "dataSource" = 'SEEDED' ORDER BY random() LIMIT 1),
    (ARRAY['situation_viewed', 'interaction_clicked', 'context_added', 'pattern_viewed', 'notification_sent', 'notification_opened', 'notification_clicked'])[floor(random() * 7 + 1)::int],
    'engagement',
    'Interaction',
    gen_random_uuid()::text,
    '{}',
    'SEEDED',
    (CURRENT_DATE - (random() * 30)::int)::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 150);

-- Micro-opportunity events
INSERT INTO "AnalyticsEvent" ("id", "anonymousUserId", "eventType", "eventCategory", "objectType", "objectId", "metadataJson", "dataSource", "createdAtBucket", "createdAt")
SELECT
    gen_random_uuid(),
    (SELECT "anonymousUserId" FROM "UserMetrics" WHERE "dataSource" = 'SEEDED' ORDER BY random() LIMIT 1),
    (ARRAY['micro_opportunity_created', 'operator_invited', 'operator_viewed_micro_opportunity', 'operator_interested', 'buyer_invited', 'buyer_interested', 'consult_scheduled', 'consult_completed', 'payout_recorded', 'platform_fee_recorded'])[floor(random() * 10 + 1)::int],
    'micro_opportunity',
    'MicroOpportunity',
    gen_random_uuid()::text,
    '{}',
    'SEEDED',
    (CURRENT_DATE - (random() * 30)::int)::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 50);

-- Marketplace events
INSERT INTO "AnalyticsEvent" ("id", "anonymousUserId", "eventType", "eventCategory", "objectType", "objectId", "metadataJson", "dataSource", "createdAtBucket", "createdAt")
SELECT
    gen_random_uuid(),
    (SELECT "anonymousUserId" FROM "UserMetrics" WHERE "dataSource" = 'SEEDED' ORDER BY random() LIMIT 1),
    (ARRAY['organization_onboarded', 'opportunity_posted', 'match_created', 'match_viewed', 'operator_interest_expressed', 'organization_interest_expressed', 'mutual_interest_created', 'connection_unlocked', 'hire_confirmed', 'fee_record_created', 'outcome_submitted'])[floor(random() * 11 + 1)::int],
    'marketplace',
    'MarketplaceOpportunity',
    gen_random_uuid()::text,
    '{}',
    'SEEDED',
    (CURRENT_DATE - (random() * 30)::int)::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 30);

-- Safety events
INSERT INTO "AnalyticsEvent" ("id", "anonymousUserId", "eventType", "eventCategory", "objectType", "objectId", "metadataJson", "dataSource", "createdAtBucket", "createdAt")
SELECT
    gen_random_uuid(),
    (SELECT "anonymousUserId" FROM "UserMetrics" WHERE "dataSource" = 'SEEDED' ORDER BY random() LIMIT 1),
    (ARRAY['redaction_applied', 'high_risk_content_detected', 'content_flagged', 'suspicious_org_behavior', 'fake_job_probe_detected'])[floor(random() * 5 + 1)::int],
    'safety',
    'Content',
    gen_random_uuid()::text,
    '{}',
    'SEEDED',
    (CURRENT_DATE - (random() * 30)::int)::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 20);

-- Insert AdminAccessLog for audit trail
INSERT INTO "AdminAccessLog" ("id", "adminUserId", "action", "reason", "targetType", "targetId", "fieldsAccessed", "ipAddress", "createdAt")
SELECT
    gen_random_uuid(),
    'seeded-admin-' || n::text,
    (ARRAY['view_analytics', 'investigation_access', 'identity_lookup', 'admin_access_granted'])[floor(random() * 4 + 1)::int],
    CASE WHEN random() > 0.5 THEN (ARRAY['abuse', 'spam', 'legal_issue', 'suspected_deanonymization_attack', 'safety_escalation'])[floor(random() * 5 + 1)::int] ELSE NULL END,
    'Dashboard',
    'analytics',
    ARRAY['overview', 'metrics'],
    '192.168.1.' || (random() * 255)::int::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 20) AS n;

-- Verification query: Show data source distribution
SELECT 'UserMetrics' as table_name, dataSource, COUNT(*) as count FROM "UserMetrics" GROUP BY dataSource
UNION ALL
SELECT 'AnalyticsEvent', dataSource, COUNT(*) FROM "AnalyticsEvent" GROUP BY dataSource
UNION ALL
SELECT 'DailyMetrics', dataSource, COUNT(*) FROM "DailyMetrics" GROUP BY dataSource;

-- Show sample IdentityMap (without revealing sensitive data)
SELECT 'IdentityMap entries created: ' || COUNT(*)::text FROM "IdentityMap";