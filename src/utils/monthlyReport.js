import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export async function generateMonthlyPDF({
  year,
  month,
  sales,
  ledgerEntries,
}) {
  const monthLabel = MONTH_NAMES[month];
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Filter everything to just this month
  const monthSales = sales.filter((s) => s.date.startsWith(monthPrefix));
  const monthLedger = ledgerEntries.filter((e) =>
    e.date.startsWith(monthPrefix),
  );
  const monthJama = monthLedger.filter((e) => e.type === "jama");
  const monthKharch = monthLedger.filter((e) => e.type === "kharch");

  // Totals
  const salesTotal = monthSales.reduce((s, x) => s + x.total, 0);
  const jamaTotal = monthJama.reduce((s, x) => s + x.amount, 0) + salesTotal;
  const kharchTotal = monthKharch.reduce((s, x) => s + x.amount, 0);
  const netProfit = salesTotal - kharchTotal; // cash-basis, matching P&L page

  const doc = new jsPDF();
  let y = 20;
  // ---- Header ----
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("CBN CHAI", 14, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  doc.text(`Monthly Summary — ${monthLabel} ${year}`, 14, y);
  y += 10;

  // ---- Summary box ----
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Summary", 14, y);
  y += 6;
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(`Total Jama (Income): Rs ${jamaTotal.toFixed(2)}`, 14, y);
  y += 6;
  doc.text(`Total Kharch (Expenses): Rs ${kharchTotal.toFixed(2)}`, 14, y);
  y += 6;
  doc.text(`Sales Revenue: Rs ${salesTotal.toFixed(2)}`, 14, y);
  y += 6;
  doc.setFont(undefined, "bold");
  doc.text(`Net Profit: Rs ${netProfit.toFixed(2)}`, 14, y);
  y += 10;

  // ---- Sales table ----
  if (monthSales.length > 0) {
    doc.setFontSize(11);
    doc.text("Sales (Sale Voucher)", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [
        ["Date", "Time", "Product", "Qty", "Payment", "Customer", "Total"],
      ],
      body: monthSales.map((s) => [
        s.date,
        s.time,
        s.productName,
        s.qtySold,
        s.paymentMode,
        s.customerName || "-",
        `Rs ${s.total.toFixed(2)}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ---- Jama table ----
  if (monthJama.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.text("Jama (Other Income)", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Type", "Note", "Amount"]],
      body: monthJama.map((e) => [
        e.date,
        e.subtype,
        e.note || "-",
        `Rs ${e.amount.toFixed(2)}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ---- Kharch table ----
  if (monthKharch.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.text("Kharch (Expenses)", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Type", "Note", "Amount"]],
      body: monthKharch.map((e) => [
        e.date,
        e.subtype,
        e.note || "-",
        `Rs ${e.amount.toFixed(2)}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ---- Footer ----
  if (monthSales.length === 0 && monthLedger.length === 0) {
    doc.setFontSize(10);
    doc.text("No transactions recorded for this month.", 14, y);
  }

  const fileName = `summary_of_${monthLabel.toLowerCase()}_${year}.pdf`;
  doc.save(fileName);
}
