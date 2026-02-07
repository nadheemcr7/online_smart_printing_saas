# Solve Print - Final Architecture (No AI)

## Overview
This document describes the complete, AI-free implementation of Solve Print. The system now uses **manual payment verification** and **local PDF analysis** for a more reliable and cost-effective solution.

---

## Core Workflow

### Student Flow
1. **Upload PDF** → Local page counting (instant, uses `pdf-lib`)
2. **Select Options** → B/W or Color, Single or Double-sided
3. **See Cost** → Calculated instantly based on page count and rates
4. **Make Payment** → UPI QR code or deep link shown
5. **Upload Screenshot** → Proof of payment submitted
6. **Wait for Verification** → Status: `pending_verification`
7. **Queue Confirmed** → Owner verifies, status becomes `queued`

### Owner Flow
1. **View Queue** → See all orders with statuses
2. **Check "Verifying"** → Orders waiting for payment confirmation
3. **View Screenshot** → Click Eye icon to see payment proof
4. **Confirm Payment** → Click Checkmark to move to `queued`
5. **Download Document** → Click Printer icon to get the PDF
6. **Update Status** → Use batch actions for `printing` → `ready`

---

## Database Schema Changes

### `orders` Table
```sql
-- New columns added
file_path TEXT;           -- Path to uploaded PDF
payment_screenshot TEXT;  -- Path to payment proof image

-- Updated status constraint
status IN ('pending_payment', 'pending_verification', 'queued', 'printing', 'ready', 'completed')

-- Updated payment_status constraint
payment_status IN ('unpaid', 'waiting', 'paid', 'refunded')
```

### `shop_settings` Table
```sql
-- Owner configures their UPI here
primary_vpa TEXT;
backup_vpa TEXT;
active_vpa_type TEXT;  -- 'primary' or 'backup'
```

### Storage Buckets
- `documents` - Student uploaded PDFs
- `screenshots` - Payment proof images

---

## Key Components

### UploadModal.tsx
- Uses `pdf-lib` for local page counting
- No AI dependency
- Shows QR code for desktop users
- Uploads to storage before creating order

### PaymentView.tsx
- Shows owner's UPI ID (from `shop_settings`)
- Generates dynamic QR code
- Handles screenshot upload
- Updates order to `pending_verification`

### Owner Dashboard (page.tsx)
- Shows "Verifying" count in stats
- Eye icon to view payment screenshots
- Checkmark to confirm and move to queue
- Printer icon to download documents

### Owner Settings (settings/page.tsx)
- Configure shop name and status
- Set Primary and Backup UPI IDs
- Toggle which UPI is active
- Saved to `shop_settings` table

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 + React |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage |
| PDF Parsing | pdf-lib (client-side) |
| QR Codes | qrcode.react |
| Realtime | Supabase Channels |

---

## No Python Required

The entire system runs on:
- **Next.js** (frontend + API routes if needed)
- **Supabase** (database + storage + auth + realtime)

No separate backend server is needed. All logic runs in the browser or through Supabase functions.

---

## Security

- Row Level Security (RLS) on all tables
- Students can only see their own orders
- Owners can see all orders
- Storage policies restrict access appropriately

---

## How Payment Confirmation Works

```
STUDENT                          OWNER
   |                               |
   |-- Upload PDF --------------->|
   |-- Select Options ----------->|
   |-- See QR / UPI ID ---------->|
   |                               |
   |   (Pay via UPI App)          |
   |                               |
   |-- Upload Screenshot -------->|
   |                               |
   |   Status: pending_verification
   |                               |
   |                               |<-- View Screenshot
   |                               |<-- Confirm Payment
   |                               |
   |   Status: queued              |
   |                               |
   |                               |<-- Download PDF
   |                               |<-- Print Document
   |                               |<-- Mark Ready
   |                               |
   |   Status: ready               |
   |                               |
   |-- Show Pickup Code           |
   |-- Collect Print ------------>|
```

---

## Running the App

```bash
cd /Users/m.mohamednadheem/Documents/solve_print
npm run dev
```

Open: http://localhost:3000

---

## Test Credentials

Login as different roles to test:
- **Student**: Upload documents, make payments
- **Owner**: Verify payments, manage queue, update statuses
