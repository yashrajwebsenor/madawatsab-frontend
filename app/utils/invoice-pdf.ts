import { jsPDF } from "jspdf";
import dayjs from "dayjs";
import { Invoice } from "@/app/types/types";

// Brand block printed on every invoice header. Kept here (not the API) because
// it's static presentation, not transaction data.
const COMPANY = {
  name: "Madawatsab",
  tagline: "Matrimony",
  // TODO: replace with the registered business address / GSTIN once provided.
  line1: "support@madawatsab.com",
};

const inr = (amount: number) =>
  `INR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Builds a one-page A4 invoice from a stored Invoice record and triggers a
// browser download. jsPDF's built-in Helvetica is WinAnsi-encoded and can't
// render the ₹ glyph, so amounts are printed as "INR" here.
export const downloadInvoicePdf = (invoice: Invoice) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  const right = pageWidth - 48;

  // --- Header: brand (left) + INVOICE (right) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(18, 56, 54); // brand teal (#123836)
  doc.text(COMPANY.name, left, 64);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(COMPANY.tagline, left, 80);
  doc.text(COMPANY.line1, left, 94);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("INVOICE", right, 64, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`# ${invoice.invoiceNumber ?? "—"}`, right, 80, { align: "right" });
  doc.text(
    dayjs(invoice.purchasedAt).format("DD MMM YYYY, hh:mm A"),
    right,
    94,
    { align: "right" },
  );

  // --- Divider ---
  doc.setDrawColor(225, 225, 225);
  doc.line(left, 116, right, 116);

  // --- Bill to ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("BILLED TO", left, 144);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(invoice.userName ?? "—", left, 162);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`User ID: ${invoice.userId}`, left, 178);

  // --- Status (right) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("STATUS", right, 144, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(34, 139, 87); // success green
  doc.text(invoice.status.toUpperCase(), right, 162, { align: "right" });

  // --- Line-item table ---
  const tableTop = 212;
  doc.setFillColor(245, 247, 247);
  doc.rect(left, tableTop, right - left, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text("DESCRIPTION", left + 14, tableTop + 18);
  doc.text("AMOUNT", right - 14, tableTop + 18, { align: "right" });

  const rowY = tableTop + 28 + 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(invoice.planName ?? "Payment", left + 14, rowY);
  doc.text(inr(invoice.amount), right - 14, rowY, { align: "right" });

  doc.setDrawColor(225, 225, 225);
  doc.line(left, rowY + 16, right, rowY + 16);

  // --- Total ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text("Total Paid", left + 14, rowY + 42);
  doc.text(inr(invoice.amount), right - 14, rowY + 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("(inclusive of all taxes)", right - 14, rowY + 56, {
    align: "right",
  });

  // --- Footer ---
  if (invoice.razorpayPaymentId) {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Transaction ID: ${invoice.razorpayPaymentId}`,
      left,
      rowY + 100,
    );
  }
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Thank you for choosing Madawatsab. This is a computer-generated invoice.",
    left,
    rowY + 120,
  );

  doc.save(`Invoice-${invoice.invoiceNumber ?? invoice.userId}.pdf`);
};

export default downloadInvoicePdf;
