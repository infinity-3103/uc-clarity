# Architectural Decisions and Defaults

This document records the design choices and default assumptions made where the specification was silent or open to implementation details.

## 1. Project Root Directory
- Built directly in the workspace root directory so standard npm scripts (`npm test`, `npm run dev`, `npm run build`) execute cleanly without subfolder navigation.

## 2. Shared State Architecture
- Implemented a unified Zustand store with `persist` middleware backed by `localStorage`.
- Actions taken in one perspective (Customer, Professional, Bank, Operations) immediately reflect across all other views in real time without manual reloads.
- A one-click `Reset demo` button restores the mulberry32 deterministic seed state at any time.

## 3. Mobile Simulation Frame
- Customer and Professional applications render inside an iPhone-dimensioned frame (390px by 844px) with mouse click interactions.
- A persistent warning header: "Prototype: simulated data" is embedded across both mobile and desktop views.

## 4. Plain Copy and Punctuation Compliance
- As mandated by the specification, em dashes are completely excluded from all user interface copy, notifications, and documentation. Standard hyphens, colons, and parentheses are used instead.

## 5. Arjun Verma Thin-File Calibration
- Calibrated Arjun Verma (Pune, Wakad) with verified monthly credits of Rs 30,000, verified existing debt obligations of Rs 9,750, and a replacement double-door refrigerator (Rs 28,000 retail less Rs 2,400 trade-in credit) financed over 9 months (EMI = Rs 2,844).
- The resulting Fixed Obligation to Income Ratio (FOIR) is (9,750 + 2,844) / 30,000 = 42.1%, precisely hitting the required 40% to 45% approval range for the Account Aggregator underwriting path.

## 6. Dedicated Pune Refrigerator Technician
- Added Rahul Shinde to the seeded partner roster (Pune, Wakad; skills: Refrigerator and AC; rating: 4.6; opted in to referral role). This ensures Arjun's refrigerator booking can be matched to a local qualified professional in Pune alongside Sanjay Patil (who handles washing machines and geysers).

## 7. Currency Formatting
- Standard Indian currency formatting with comma grouping by thousands and lakhs (for example, Rs 14,55,000, Rs 24,25,000) is used across dashboards and comparisons.

## 8. Removal of Bank Frontend
- Because the solution is designed for Urban Company (operating as the Lending Service Provider and customer/technician interface), the internal bank underwriter dashboard was removed from the UI.
- The bank's operations (Aarambh Bank) function purely as a simulated regulated backend API. Urban Company's own frontend surfaces comprise the Customer mobile app, Professional mobile app, and the UC Operations desktop command center.
