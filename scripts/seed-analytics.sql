-- Seed Analytics Data for BTP Dashboard
-- All user IDs are anonymized - no real identities

-- Clear existing data
TRUNCATE TABLE "AnalyticsEvent" CASCADE;
TRUNCATE TABLE "UserMetrics" CASCADE;
TRUNCATE TABLE "DailyMetrics" CASCADE;
TRUNCATE TABLE "AdminAccessLog" CASCADE;

-- Insert UserMetrics (anonymized users)
INSERT INTO "UserMetrics" ("id", "anonymousUserId", "roleType", "verificationStatus", "signupDateBucket", "lastActiveBucket", "postCount", "interactionCount", "reflectionOpenCount", "opportunityInviteCount", "microConsultCount", "revenueGeneratedCents", "retentionStatus", "updatedAt")
SELECT
    gen_random_uuid(),
    'USR-' || substr(md5(random()::text), 1, 4),
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

-- Insert OperatorMetrics
INSERT INTO "UserMetrics" ("id", "anonymousUserId", "roleType", "verificationStatus", "signupDateBucket", "lastActiveBucket", "postCount", "interactionCount", "reflectionOpenCount", "opportunityInviteCount", "microConsultCount", "revenueGeneratedCents", "retentionStatus", "updatedAt")
SELECT
    gen_random_uuid(),
    'OPR-' || substr(md5(random()::text), 1, 4),
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

-- Insert OrganizationMetrics
INSERT INTO "UserMetrics" ("id", "anonymousUserId", "roleType", "verificationStatus", "signupDateBucket", "lastActiveBucket", "postCount", "interactionCount", "reflectionOpenCount", "opportunityInviteCount", "microConsultCount", "revenueGeneratedCents", "retentionStatus", "updatedAt")
SELECT
    gen_random_uuid(),
    'ORG-' || substr(md5(random()::text), 1, 4),
    'organization',
    CASE WHEN random() > 0.3 THEN 'Verified' ELSE 'Pending' END,
    (CURRENT_DATE - (random() * 90)::int)::text,
    (CURRENT_DATE - (random() * 7)::int)::text,
    (random() * 50)::int,
    (random() * 20)::int,
    0,
    (random() * 30)::int,
    0,
    (random() * 500000)::int,
    'active',
    NOW()
FROM generate_series(1, 10);

-- Insert DailyMetrics for last 30 days
INSERT INTO "DailyMetrics" ("id", "dateBucket", "totalUsers", "newUsers", "verifiedOperators", "verifiedOrgs", "onboardingCompleted", "dau", "sessions", "notificationsSent", "notificationsOpened", "postsCreated", "interactions", "reflectionsSent", "reflectionsOpened", "microOppsCreated", "operatorInvites", "operatorInterests", "consultsCompleted", "gmvCents", "platformRevenueCents", "operatorPayoutsCents", "flaggedContent", "redactionsApplied", "highRiskPosts", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    (CURRENT_DATE - i)::text,
    (90 - i * 3 + (random() * 5)::int),
    (2 + (random() * 6)::int),
    ((90 - i * 3) * 0.3)::int,
    ((90 - i * 3) * 0.1)::int,
    (2 + (random() * 6)::int) * 0.7::int,
    (15 + (random() * 25)::int),
    (30 + (random() * 50)::int),
    (20 + (random() * 40)::int),
    (10 + (random() * 30)::int),
    (5 + (random() * 10)::int),
    (10 + (random() * 20)::int),
    (3 + (random() * 7)::int),
    (2 + (random() * 6)::int),
    (1 + (random() * 4)::int),
    (3 + (random() * 9)::int),
    (1 + (random() * 5)::int),
    (random() * 3)::int,
    (5000 + (random() * 45000)::int),
    (1000 + (random() * 9000)::int),
    (3000 + (random() * 27000)::int),
    (random() * 3)::int,
    (5 + (random() * 15)::int),
    (random() * 2)::int,
    NOW(),
    NOW()
FROM generate_series(0, 30) AS i;

-- Insert AnalyticsEvents
INSERT INTO "AnalyticsEvent" ("id", "anonymousUserId", "eventType", "eventCategory", "objectType", "objectId", "metadataJson", "createdAtBucket", "createdAt")
SELECT
    gen_random_uuid(),
    (SELECT "anonymousUserId" FROM "UserMetrics" ORDER BY random() LIMIT 1),
    (ARRAY['signup_completed', 'onboarding_completed', 'login', 'situation_submitted', 'situation_reflection_opened', 'interaction_clicked', 'notification_opened', 'micro_opportunity_created', 'operator_interested', 'consult_completed'])[1 + (random() * 9)::int],
    (ARRAY['user', 'situation', 'engagement', 'micro_opportunity'])[1 + (random() * 3)::int],
    NULL,
    NULL,
    '{}',
    (CURRENT_DATE - (random() * 30)::int)::text,
    NOW() - (random() * '30 days'::interval)
FROM generate_series(1, 500);

-- Insert AdminAccessLogs
INSERT INTO "AdminAccessLog" ("id", "adminUserId", "action", "reason", "targetType", "targetId", "fieldsAccessed", "ipAddress", "userAgent", "createdAt")
SELECT
    gen_random_uuid(),
    'admin-demo',
    (ARRAY['view_analytics', 'view_user', 'investigate', 'export_data'])[1 + (random() * 3)::int],
    CASE WHEN random() > 0.7 THEN (ARRAY['abuse', 'spam', 'safety_escalation'])[1 + (random() * 2)::int] ELSE NULL END,
    CASE WHEN random() > 0.5 THEN 'User' ELSE NULL END,
    CASE WHEN random() > 0.7 THEN (SELECT "anonymousUserId" FROM "UserMetrics" ORDER BY random() LIMIT 1) ELSE NULL END,
    CASE WHEN random() > 0.5 THEN ARRAY['postCount', 'interactionCount'] ELSE ARRAY[]::text[] END,
    '192.168.1.' || (random() * 255)::int::text,
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    NOW() - (random() * '7 days'::interval)
FROM generate_series(1, 20);

-- Verify counts
SELECT 'UserMetrics' as table_name, COUNT(*) as count FROM "UserMetrics"
UNION ALL
SELECT 'DailyMetrics', COUNT(*) FROM "DailyMetrics"
UNION ALL
SELECT 'AnalyticsEvent', COUNT(*) FROM "AnalyticsEvent"
UNION ALL
SELECT 'AdminAccessLog', COUNT(*) FROM "AdminAccessLog";