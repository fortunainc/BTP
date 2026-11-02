# Signup and requests

Published flow: `/join`. No account is required to express interest.

* Operators: email, role, optional paid product review interest. Stored in AccessRequest. Verification and membership approval are still separate.
* Founders: name, email, company or product, a short request. Stored in CompanyInquiry. No booking, payment, or community access is created.
* Investors: name, email, optional firm. Stored in Investor as pending. Existing access status is never changed by a public submission. Approved investor sign in remains on `/investors`.

Direct links: `/join?audience=professional`, `/join?audience=founder`, `/join?audience=investor`. `utm_source` records the originating campaign; `ref` is checked against an active verified member and retained. Referral attribution does not automatically approve access.

## Founder tracking

`/admin/requests` combines existing and new records. Filter by audience or follow up status, search details, and download CSV. Each request shows its email, name where collected, role/company, request, paid review interest, source/referrer, date, access/inquiry status, follow up, and private notes. One email can appear under multiple audiences.

RequestFollowUp stores private notes and follow up status keyed to the original record. Its status is separate from membership/investor approval. Saving follow up does not send emails, issue invitations, or approve access. Existing Waitlist, Companies, and Investors screens retain their specialized actions.

Public repeats preserve existing consent and access. Identical founder submissions reuse the same record; a different product request is kept separately. If an older founder-only AccessRequest is later used for an operator request, a deterministic CompanyInquiry preserves the old founder interest before the AccessRequest becomes a pending operator request. This happens in a transaction.

The original `/api/join`, `/api/companies`, and investor sign in endpoint remain compatible. The new short form posts to `/api/interest`. All writes are origin checked and rate limited. Request details and CSV require authenticated admin access. Preview deployments cannot access production data.
