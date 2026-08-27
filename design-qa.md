# Design QA — Member Account Mobile Density

## Scope

- Route: `/dashboard/account`
- Section: Wallet
- Reference: user-provided member Wallet screenshot
- Target: mobile widths below `640px`

## Implemented

- Balance cards use a compact single-column phone layout, then two columns from 480px; Currency spans the compact two-column row.
- Mobile card padding, labels, balance typography, tabs, and action buttons are reduced.
- Long balance values remain on one line with responsive sizing and tabular numerals.
- Financial Information uses a compact two-column read view with safe word wrapping.
- Main content and Wallet containers use `min-width: 0` to prevent flex/grid overflow.
- Existing `sm:` desktop sizes and every interaction handler are preserved.

## Verification

- PASS: `git diff --check`.
- PASS: no state, data request, form validation, or event-handler logic changed.
- BLOCKED: in-app/connected browser was unavailable, so rendered screenshot comparison could not be completed.
- PASS: `http://127.0.0.1:4028/dashboard/account` responds with HTTP 200.
- PASS: TypeScript reports no errors in `src/app/dashboard/account/page.tsx` or `src/components/dashboard/DepositModal.tsx`.
- BLOCKED (pre-existing): project-wide `npm run type-check` still reports 20 errors in unrelated files.
- BLOCKED (pre-existing): ESLint 9 cannot find an `eslint.config.js|mjs|cjs` configuration.

## Remaining Browser Checks

- Verify 320px, 375px, and 390px widths have no horizontal scrolling.
- Verify the largest real balance stays inside its card.
- Verify Deposit, Withdrawal, History, Edit, Reset, and mobile navigation remain tappable.
