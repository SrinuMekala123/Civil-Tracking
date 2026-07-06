import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface ExportPDFOptions {
  orientation?: "portrait" | "landscape";
  themeColor?: [number, number, number];
}

export function exportToPDF(
  filename: string,
  title: string,
  headers: string[],
  rows: string[][],
  options: ExportPDFOptions = {}
) {
  const orientation = options.orientation || "portrait";
  const themeColor = options.themeColor || [79, 70, 229]; // default indigo

  const doc = new jsPDF({
    orientation: orientation,
    unit: "mm",
    format: "a4",
  });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 20);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

  // Table
  autoTable(doc, {
    startY: 32,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: themeColor },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  doc.save(filename);
}
