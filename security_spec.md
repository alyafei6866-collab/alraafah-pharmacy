# Security Specification — صيدلية الرأفة للأدوية (Firestore Rules)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false`).
2. **Admin-Only Mutations**: Only verified administrators (`isAdmin()`) can `create`, `update`, or `delete` documents in `siteSettings`, `products`, `faqs`, `departments`, or `gallery`.
3. **Email Verification Gate**: Email-based admin authorization strictly enforces `request.auth.token.email_verified == true` so unverified or spoofed email accounts cannot bypass authorization.
4. **Immutable Creation Timestamps & Server Time**: `createdAt` and `updatedAt` MUST equal `request.time` on `create`; `createdAt` is immutable on `update` (`incoming().createdAt == existing().createdAt`) and `updatedAt == request.time`.
5. **Strict Schema & Size Bounds**: Every string field enforces `.size() >= min && .size() <= max`; `price`, `deliveryFee`, `freeDeliveryThreshold`, and `sortOrder` enforce bounded numeric ranges; unknown/shadow fields are rejected via `keys().hasAll(...) && keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update.
6. **ID Poisoning Guard**: Every single-document target checks `isValidId(docId)` (`^[a-zA-Z0-9_\-]+$` and `<= 128` chars).
7. **Admin Allowlist Isolation**: `/admins/{adminId}` can only be read by the matching authenticated user and can never be written from client SDKs (`allow write: if false`).

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `create` on `/products/prod-test`
2. Authenticated non-admin (`visitor@example.com`, `email_verified: true`) `create` on `/products/prod-test`
3. Unverified admin email (`m.a.ali19140@gmail.com`, `email_verified: false`) `update` on `/siteSettings/main`
4. Shadow field injection (`isVerified: true`) in `/products/prod-test` create payload
5. Oversized `name` (500 chars > 160 max) in `/products/prod-test`
6. Negative `price: -5` in `/products/prod-test`
7. Client-forged `createdAt` timestamp not equal to `request.time` on `/products/prod-test` create
8. Modifying immutable `createdAt` during `/products/prod-test` update
9. Invalid document ID containing path/junk characters (`../../evil` or 200-char ID) on `/products/{productId}`
10. Client `create` or `update` on `/admins/{uid}` attempting privilege escalation
11. Unbounded `items` array (> 10 elements) or non-string `items[0]` on `/departments/dept-1`
12. `javascript:alert(1)` URL injected into `imageSrc` on `/products/prod-test` or `mapsUrl` on `/siteSettings/main`
