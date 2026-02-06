import { Garment } from "@/types/garment";

function escapeHtml(s: string | undefined | null): string {
  const str = String(s ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Export garment data as CSV
 */
export function exportToCSV(garments: Garment[], filename: string = "garments.csv"): void {
  if (garments.length === 0) return;

  // Get all unique keys from all garments
  const allKeys = new Set<string>();
  garments.forEach((garment) => {
    Object.keys(garment).forEach((key) => allKeys.add(key));
  });

  const headers = Array.from(allKeys);

  // Create CSV rows
  const rows = garments.map((garment) => {
    return headers.map((header) => {
      const value = (garment as any)[header];
      if (value === null || value === undefined) return "";
      if (Array.isArray(value)) return value.join("; ");
      if (typeof value === "object") return JSON.stringify(value);
      return String(value).replace(/"/g, '""');
    });
  });

  // Create CSV content
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  // Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export garment data as JSON
 */
export function exportToJSON(garments: Garment[], filename: string = "garments.json"): void {
  const blob = new Blob([JSON.stringify(garments, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export garment data as PDF (simple text-based PDF)
 */
export async function exportToPDF(garments: Garment[], filename: string = "garments.pdf"): Promise<void> {
  // For a proper PDF, you'd want to use a library like jsPDF or pdfkit
  // This is a simple implementation that creates a printable HTML page
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Garment Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .garment { margin-bottom: 30px; page-break-inside: avoid; }
          .garment h2 { color: #666; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .field { margin: 5px 0; }
          .field-label { font-weight: bold; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Garment Collection Export</h1>
        <p>Exported on ${new Date().toLocaleString()}</p>
        <p>Total garments: ${garments.length}</p>
        ${garments.map((garment, index) => `
          <div class="garment">
            <h2>${index + 1}. ${escapeHtml(garment.name || garment.label || garment.editorial_title || "Untitled")}</h2>
            <div class="field"><span class="field-label">ID:</span> ${escapeHtml(garment.id || "—")}</div>
            <div class="field"><span class="field-label">Date:</span> ${escapeHtml(garment.decade || garment.date || "—")}</div>
            <div class="field"><span class="field-label">Era:</span> ${escapeHtml(garment.era || "—")}</div>
            <div class="field"><span class="field-label">Type:</span> ${escapeHtml(garment.work_type || garment.type || "—")}</div>
            <div class="field"><span class="field-label">Colors:</span> ${escapeHtml(Array.isArray(garment.colors) ? garment.colors.join(", ") : (garment.colors || "—"))}</div>
            <div class="field"><span class="field-label">Materials:</span> ${escapeHtml(Array.isArray(garment.materials) ? garment.materials.join(", ") : (garment.materials || "—"))}</div>
            <div class="field"><span class="field-label">Description:</span> ${escapeHtml(garment.description || garment.tagline || "—")}</div>
          </div>
        `).join("")}
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Export comparison as image (screenshot approach)
 */
export async function exportComparisonAsImage(elementId: string, filename: string = "comparison.png"): Promise<void> {
  // This would require html2canvas or similar library
  // For now, we'll provide a function that can be enhanced
  console.log("Export comparison as image - requires html2canvas library");
}
