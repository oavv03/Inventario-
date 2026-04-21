# Security Specification - SistInven

## Data Invariants
1. `InventoryItem` must have a valid `placa` (unique ID) and `descripcion`.
2. `valorReal` must be a non-negative number.
3. Only authorized administrators can modify the `inventory` collection.
4. The `admins` collection is the source of truth for authorization.

## The "Dirty Dozen" Payloads (Expect PERMISSION_DENIED)

1. **Anonymous Write**: Attempt to create an item without being signed in.
2. **Unauthorized Write**: Sign in with a non-admin account and try to delete an item.
3. **Admin Escalation**: Attempt to add yourself to the `admins` collection.
4. **Invalid Type**: Try to set `valorReal` as a string instead of a number.
5. **Path Poisoning**: Create an item with a 1MB string as the document ID.
6. **Shadow Update**: Add an `isVerified: true` field to an item.
7. **Timestamp Spoofing**: Provide a future date in `updatedAt` instead of `request.time`.
8. **Email Spoofing**: Login with an unverified email that matches an admin email.
9. **Bulk Delete Escape**: Attempt to delete the entire collection without admin privileges.
10. **Orphaned Write**: Create an item without a description.
11. **ID Injection**: Use special characters in the ID.
12. **PII Leak**: Attempt to read the entire `admins` collection as an anonymous user.

## Firestore Rules Draft
(See `DRAFT_firestore.rules`)
