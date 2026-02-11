# Next Session Tasks & Architecture Plans

## 1. Fix: Word Document Page Counting (.docx)
**Status**: Partially working (Inconsistent)
**The Problem**: Some `.docx` files still return 1 page.
**Potential Causes**:
- Non-standard XML structures in different Word versions.
- Browser sandbox limitations when reading large ZIP-compressed XMLs.
- Legacy `.doc` (binary) vs modern `.docx` (XML).

**Planned Approach**:
- **Secondary Fallback**: If `docProps/app.xml` and `core.xml` both fail, implement a "Paragraph/Table of Contents" scan inside `word/document.xml`.
- **Server-Side Rendering**: If client-side detection remains inconsistent, use a specialized Node.js library (`mammoth` or `pizzip`) in a secure API route as the ultimate source of truth.
- **User Input Override**: Allow users to manually adjust the page count if the detection is wrong (with a "Shop Owner Review" flag).

---

## 2. Feature: Customer Alert Notifications
**Objective**: Notify students instantly when their order status changes to "Ready for Pickup".

**Proposed Architecture**:

### Option A: Web Push Notifications (Recommended)
- **How it works**: Uses the browser's Service Worker to show a native notification on the phone/PC even if the website is closed.
- **Pros**: Free, high engagement, feels like a real app.
- **Cons**: Requires user permission (the "Allow Notifications" popup).

### Option B: Real-time In-App Alerts (Fastest)
- **How it works**: Use a Supabase Realtime listener in the `CustomerDashboard`.
- **Pros**: Already partially implemented; very reliable if the user keeps the tab open.
- **Cons**: Won't work if they close the browser.

### Option C: SMS/WhatsApp (Premium)
- **How it works**: Integration with Twilio or Interakt.
- **Pros**: Highest open rate.
- **Cons**: Costs money per message.

**Next Steps**:
1. Implement Option B (In-app Toast notifications) as a baseline.
2. Research PWA (Progressive Web App) manifest to enable Option A for mobile users.
3. Update the `orders` table to track `notified_at` timestamp.

---

## 3. High-Traffic Scalability Check
- [ ] Audit database indexes on `orders(customer_id, status)`.
- [ ] Implement "Heartbeat" to close inactive Supabase real-time channels.
