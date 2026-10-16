# Account deletion fulfillment

The beta accepts signed-in deletion requests and queues them at `/admin/help-requests`. Submission is not fulfillment. Only an authorized founder/operator may fulfill a request, and no deletion is performed by the release scripts.

1. Verify the queued request belongs to the requesting account through an authenticated channel. Record its request ID and any legally required retention exception privately. Do not put identities, emails or request contents in GitHub.
2. Inventory records linked through User ID, Clerk ID, email, analytics identity mappings and free text. Include notifications, follows, help requests, applications/messages, verification fields, reports and audit records. Deleting a User row alone is insufficient because several stores have no foreign-key cascade.
3. Review community contributions for re-identification before retaining any de-identified content. Remove identifying text and detach the user link. Preserve only ledger digests that cannot be used to recover personal content; the ledger contains no original payload text.
4. Revoke sessions and delete the Clerk identity, then delete/anonymize application records according to the reviewed inventory. Make provider-side irreversible deletions only after verifying the specific request and target. Never delete the founder as a test account.
5. Apply retention controls to logs, observability vendors and backups. Document restoration procedures that reapply deletion tombstones, so a restore cannot silently resurrect deleted accounts.
6. Verify the account cannot sign in or be resolved through application APIs, and that retained posts contain no identifiers. Mark the request completed only after all required stores are addressed. Preserve a minimal non-identifying fulfillment record and provide confirmation through the agreed private channel.

Required before calling this workflow operational: a named owner, response target, retention policy, test-account rehearsal, and evidence of provider/database/log coverage. These are still pending; the existence of a request queue is not compliance evidence.
