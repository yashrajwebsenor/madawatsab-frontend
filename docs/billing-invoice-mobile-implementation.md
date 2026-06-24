# Billing & Invoice — Mobile App Implementation Guide

API contract + implementation notes for building the **Billing & Invoices** screen in the
mobile app, including **downloading any invoice as a PDF**. This mirrors what ships on the
web panel (`/billing`), so behaviour and data fields are identical.

> **Source of truth = backend.** Amounts, invoice numbers, and names are resolved
> server-side and snapshotted at purchase time. The client only **renders** what the API
> returns. Never compute or trust a client-supplied amount.

---

## 1. Conventions (read first)

| Thing | Value |
|---|---|
| Base URL | `<host>/api` (global prefix `api` — see `main.ts`) |
| Auth | **JWT Bearer required** on every endpoint below. Header: `Authorization: Bearer <token>` |
| Content-Type | `application/json` |
| Owner scoping | All invoice endpoints are scoped to the logged-in user (from the token). A user can only ever see their own billing. |

### 1.1 Success envelope
Every response is wrapped by a global interceptor:

```jsonc
{
  "status": 200,
  "message": "Request successful",
  "data": <payload>,        // <-- read this
  "pagination": { ... }     // only on paginated endpoints (not used here)
}
```

So for the invoice list, the array is at `response.data.data`.

### 1.2 Error envelope
Thrown errors come back in a **different** shape (not the success envelope):

```jsonc
{
  "success": false,
  "statusCode": 404,
  "message": "Invoice not found.",
  "timestamp": "2026-06-23T...",
  "path": "/api/payments/invoices/xyz"
}
```

Read `message` for the toast, `statusCode` to branch UI.

---

## 2. The Invoice object

Returned by both invoice endpoints. This is the **complete** record needed to render a row
**and** generate the PDF — no extra fetch required.

```ts
interface Invoice {
  invoiceNumber: string | null;   // e.g. "MDW1750483720" — null on legacy rows
  userId: string;                 // owner _id
  userName: string | null;        // snapshot of name at purchase time
  planName: string | null;        // "App Entry Fee" for entry fee; plan name for plans
  paymentType: "entry_fee" | "plan";
  amount: number;                 // RUPEES (already ÷100 from paise). e.g. 499 or 1499.00
  currency: "INR";
  status: "captured";             // only captured payments are ever returned
  razorpayPaymentId: string | null; // gateway txn id, for the PDF footer
  purchasedAt: string;            // ISO date (the payment createdAt)
}
```

Notes:
- **`amount` is already in rupees.** Do **not** divide by 100 again. (Only the *order
  create* response below is in paise.)
- `planName` is a snapshot — renaming a plan later does not change issued invoices.
- Only `status: "captured"` payments appear here. Pending/failed are never listed.

---

## 3. Endpoints

### 3.1 List billing history
```
GET /api/payments/invoices
```
Returns all captured payments (entry fee + plans) for the user, **newest first**.

**Response** (`data` is an array):
```jsonc
{
  "status": 200,
  "message": "Request successful",
  "data": [
    {
      "invoiceNumber": "MDW1750483720",
      "userId": "665f...",
      "userName": "Aisha Khan",
      "planName": "Gold",
      "paymentType": "plan",
      "amount": 1499,
      "currency": "INR",
      "status": "captured",
      "razorpayPaymentId": "pay_2921Xaa921",
      "purchasedAt": "2026-06-21T07:15:20.000Z"
    },
    {
      "invoiceNumber": "MDW1747891200",
      "userId": "665f...",
      "userName": "Aisha Khan",
      "planName": "App Entry Fee",
      "paymentType": "entry_fee",
      "amount": 499,
      "currency": "INR",
      "status": "captured",
      "razorpayPaymentId": "pay_18aa...",
      "purchasedAt": "2026-05-22T05:20:00.000Z"
    }
  ]
}
```
Empty history → `data: []`. Render the empty state.

### 3.2 Single invoice
```
GET /api/payments/invoices/:id
```
`:id` = the **payment document `_id`** (Mongo ObjectId). Returns one `Invoice` (same shape),
owner-scoped. `404` "Invoice not found." if the id isn't the user's captured payment.

> ⚠️ **Known gap:** the list in §3.1 does **not** currently return the payment `_id`, so the
> client has no id to pass here. **For the billing screen you do not need this endpoint** —
> the list already contains every field for display and PDF. Build the screen off §3.1 alone.
> (Documented so it's not a surprise; flag if a per-id deep link is needed later.)

---

## 4. PDF download — client-side, no backend endpoint

**There is no server PDF endpoint.** The PDF is generated **on-device** from the Invoice JSON
(the web does this with `jspdf`). The mobile app builds the same one-page A4 invoice locally,
then saves/shares it.

### 4.1 Recommended approach (Expo / RN)
Use **`expo-print`** (`printToFileAsync`) to render an HTML template → PDF, then
**`expo-sharing`** (or `react-native-share`) to let the user save/share it. Bare RN without
Expo: `react-native-html-to-pdf` is the equivalent.

### 4.2 ⚠️ Rupee glyph caveat
The web invoice prints amounts as `INR 1,499.00` (not `₹`) because the PDF base font can't
render the `₹` glyph. For an **HTML-to-PDF** path on mobile, the system webview *can* render
`₹`, so you may use `₹`. If you fall back to a canvas/jsPDF-style renderer, use the `INR `
prefix like web. Pick one and be consistent.

### 4.3 HTML template (matches web layout)
Header: brand block (left) + `INVOICE` + number + date (right) → BILLED TO / STATUS row →
single line-item table (description = `planName`, amount) → Total Paid (incl. all taxes) →
footer with `Transaction ID` (razorpayPaymentId) + "computer-generated invoice" line.

```ts
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// Static brand block — presentation only, NOT from the API.
// TODO: business address / GSTIN once provided (web has the same TODO).
const COMPANY = { name: "Madawatsab", tagline: "Matrimony", contact: "support@madawatsab.com" };

const invoiceHtml = (inv: Invoice) => `
<html><head><meta charset="utf-8"/>
<style>
  body{font-family:Helvetica,Arial,sans-serif;color:#282828;padding:40px;}
  .row{display:flex;justify-content:space-between;align-items:flex-start;}
  .brand{font-size:22px;font-weight:bold;color:#123836;}
  .muted{color:#787878;font-size:11px;}
  .title{font-size:20px;font-weight:bold;}
  hr{border:none;border-top:1px solid #e1e1e1;margin:18px 0;}
  .label{font-size:9px;color:#969696;font-weight:bold;letter-spacing:.5px;}
  table{width:100%;border-collapse:collapse;margin-top:24px;}
  th{background:#f5f7f7;color:#5a5a5a;font-size:9px;text-align:left;padding:9px 14px;}
  th.r,td.r{text-align:right;}
  td{padding:12px 14px;border-bottom:1px solid #e1e1e1;font-size:12px;}
  .total{font-weight:bold;font-size:13px;}
  .status{color:#228b57;font-weight:bold;}
  .foot{margin-top:40px;color:#969696;font-size:9px;}
</style></head><body>
  <div class="row">
    <div>
      <div class="brand">${COMPANY.name}</div>
      <div class="muted">${COMPANY.tagline}</div>
      <div class="muted">${COMPANY.contact}</div>
    </div>
    <div style="text-align:right">
      <div class="title">INVOICE</div>
      <div class="muted"># ${inv.invoiceNumber ?? "—"}</div>
      <div class="muted">${fmtDate(inv.purchasedAt)}</div>
    </div>
  </div>
  <hr/>
  <div class="row">
    <div>
      <div class="label">BILLED TO</div>
      <div>${inv.userName ?? "—"}</div>
      <div class="muted">User ID: ${inv.userId}</div>
    </div>
    <div style="text-align:right">
      <div class="label">STATUS</div>
      <div class="status">${inv.status.toUpperCase()}</div>
    </div>
  </div>
  <table>
    <tr><th>DESCRIPTION</th><th class="r">AMOUNT</th></tr>
    <tr><td>${inv.planName ?? "Payment"}</td><td class="r">${inr(inv.amount)}</td></tr>
    <tr><td class="total">Total Paid</td><td class="r total">${inr(inv.amount)}</td></tr>
  </table>
  <div class="muted" style="text-align:right;margin-top:4px">(inclusive of all taxes)</div>
  <div class="foot">
    ${inv.razorpayPaymentId ? `Transaction ID: ${inv.razorpayPaymentId}<br/>` : ""}
    Thank you for choosing Madawatsab. This is a computer-generated invoice.
  </div>
</body></html>`;

export async function downloadInvoicePdf(inv: Invoice) {
  const { uri } = await Print.printToFileAsync({ html: invoiceHtml(inv) });
  // File name parity with web: Invoice-<number|userId>.pdf
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Invoice" });
  }
  return uri; // also usable with expo-file-system to persist to Documents
}
```

File name convention (match web): `Invoice-${invoiceNumber ?? userId}.pdf`.

---

## 5. Screen behaviour (parity with web `/billing`)

- **Header:** "Billing & Invoices" + subtitle "Your plan and entry-fee payment history.
  Download any invoice as a PDF."
- **Loading:** spinner while the list query runs.
- **Empty:** `data.length === 0` → "No invoices yet" + "Your entry-fee and plan purchases
  will appear here with a downloadable invoice."
- **Row:** receipt icon · `planName` (bold) · `invoiceNumber` · `purchasedAt` (e.g.
  `21 Jun 2026`) · `amount` formatted as `₹1,499.00` · chip = "Entry Fee" (`entry_fee`) or
  "Plan" (`plan`) · download icon button → §4 `downloadInvoicePdf(invoice)`.
- Currency format: `en-IN`, always 2 decimals.

---

## 6. (Context) How invoices get created — purchase flow

Not part of the billing *screen*, but invoices originate here. Include if mobile also does
purchases.

### 6.1 Create order
```
POST /api/payments/create
Authorization: Bearer <token>
```
Body — **send ids only; server resolves the amount**:
```jsonc
// Plan purchase
{ "paymentType": "plan", "planId": "<planId>", "planDuration": "quarterly" }
// Entry fee
{ "paymentType": "entry_fee" }
```
- `planDuration` ∈ `quarterly | half_yearly | unlimited`.
- `403` if a plan is already active (no re-purchase while active) — guard the UI too.
- **Response `data` = raw Razorpay order.** `amount` here is in **paise** (×100):
```jsonc
{ "id": "order_9A33Xaa921", "amount": 149900, "currency": "INR", "receipt": "pl_..._...", "status": "created" }
```

### 6.2 Open Razorpay checkout
Use the native Razorpay SDK (`react-native-razorpay`). The **`key_id` is NOT returned by the
API** — embed it in app config (env), same as web `RAZORPAY_KEY_ID`. Pass `order_id`,
`amount`, `currency` from §6.1, plus name/prefill/theme. Theme color web uses: `#1f5c59`.

### 6.3 Verify
```
POST /api/payments/verify
```
Body from the checkout success callback:
```jsonc
{
  "razorpayOrderId": "order_9A33Xaa921",
  "razorpayPaymentId": "pay_2921Xaa921",
  "razorpaySignature": "sig_..."
}
```
- Server verifies the HMAC signature, marks the payment `captured`, **issues the invoice**
  (number + name snapshots), then activates the plan / grants app access.
- `502` "Invalid payment signature..." on a tampered/failed signature.
- Returns `{ "success": true, "message": "Plan activated successfully." }` (or entry-fee msg).
- **Idempotent:** a replayed verify won't double-activate or burn a second invoice number.

After a successful verify, the new invoice appears in §3.1 automatically. Re-fetch the list /
own-profile (`GET /profile`, which carries the `subscription` summary) to refresh state.

---

## 7. Open items / TODO
- **Business address + GSTIN** missing from the PDF (only `support@madawatsab.com`). Web has
  the same `TODO` in `invoice-pdf.ts`. Wire in once finance provides them.
- List endpoint does not expose payment `_id` → §3.2 detail isn't reachable from list data.
  Fine for the current screen; revisit if deep-linking a single invoice is required.
