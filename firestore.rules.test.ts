/**
 * Dirty Dozen adversarial specification tests for Al-Ra'fah Pharmacy Firestore rules.
 * Can be run with @firebase/rules-unit-testing against the Firestore emulator.
 */
export const DIRTY_DOZEN_CASES = [
  {
    id: 1,
    name: 'Unauthenticated product creation rejected',
    auth: null,
    path: 'products/prod-evil',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Non-admin authenticated user product creation rejected',
    auth: { uid: 'user-1', email: 'visitor@example.com', email_verified: true },
    path: 'products/prod-evil',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified admin email spoof rejected',
    auth: { uid: 'spoof-1', email: 'm.a.ali19140@gmail.com', email_verified: false },
    path: 'siteSettings/main',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow field injection rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'products/prod-shadow',
    extraField: { isVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized product name > 160 chars rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'products/prod-oversize',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Negative product price rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'products/prod-negative',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client-forged createdAt timestamp rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'products/prod-time-forge',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Mutating immutable createdAt on update rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'products/prod-humana-milk',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Invalid document ID characters rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'products/invalid$id',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Client write to /admins allowlist rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'admins/admin-1',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unbounded department items array (> 10) rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'departments/dept-1',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'javascript: XSS scheme in imageSrc or mapsUrl rejected',
    auth: { uid: 'admin-1', email: 'm.a.ali19140@gmail.com', email_verified: true },
    path: 'products/prod-xss',
    expected: 'PERMISSION_DENIED',
  },
];
