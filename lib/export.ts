import { Garment } from "@/types/garment";

export function exportGarmentsToJSON(garments: Garment[], filename?: string) {
  const data = garments.map((g) => ({
    id: g.id,
    name: g.name || g.label || g.editorial_title,
    slug: g.slug,
    decade: g.decade,
    date: g.date,
    yearApprox: g.yearApprox,
    era: g.era,
    work_type: g.work_type,
    type: g.type,
    colors: g.colors,
    materials: g.materials,
    function: g.function,
    gender: g.gender,
    age: g.age,
    condition: g.condition,
    description: g.description,
    editorial_title: g.editorial_title,
    editorial_subtitle: g.editorial_subtitle,
    aesthetic_description: g.aesthetic_description,
    story: g.story,
    inspiration: g.inspiration,
    context: g.context,
    tagline: g.tagline,
    curatorNote: g.curatorNote,
    accessionNumber: g.accessionNumber,
    collection: g.collection,
    provenance: g.provenance,
    dimensions: g.dimensions,
    images: g.images,
    imageUrl: g.imageUrl,
    thumbnailUrl: g.thumbnailUrl,
    model3d_url: g.model3d_url,
    modelUrl: g.modelUrl,
    relatedIds: g.relatedIds,
  }));

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `garments-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportGarmentsToCSV(garments: Garment[], filename?: string) {
  if (garments.length === 0) return;

  const headers = [
    "ID",
    "Name",
    "Slug",
    "Decade",
    "Date",
    "Year Approx",
    "Era",
    "Work Type",
    "Type",
    "Colors",
    "Materials",
    "Function",
    "Gender",
    "Age",
    "Condition",
    "Description",
    "Editorial Title",
    "Editorial Subtitle",
    "Tagline",
    "Accession Number",
    "Collection",
    "Provenance",
    "Dimensions",
  ];

  const rows = garments.map((g) => [
    g.id || "",
    g.name || g.label || g.editorial_title || "",
    g.slug || "",
    g.decade || "",
    g.date || "",
    g.yearApprox?.toString() || "",
    g.era || "",
    g.work_type || "",
    g.type || "",
    Array.isArray(g.colors) ? g.colors.join("; ") : (g.colors || ""),
    Array.isArray(g.materials) ? g.materials.join("; ") : (g.materials || ""),
    g.function || "",
    g.gender || "",
    g.age || "",
    g.condition || "",
    g.description || "",
    g.editorial_title || "",
    g.editorial_subtitle || "",
    g.tagline || "",
    g.accessionNumber || "",
    g.collection || "",
    g.provenance || "",
    g.dimensions || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `garments-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeHtml(s: string | undefined | null): string {
  return escapeHtml(String(s ?? ""));
}

export function exportGarmentToPDF(garment: Garment) {
  // This is a placeholder - would need a PDF library like jsPDF or pdfmake
  // For now, we'll create a simple HTML page that can be printed
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const title = safeHtml(garment.name || garment.label || garment.editorial_title);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          h1 { font-size: 28px; margin-bottom: 10px; }
          h2 { font-size: 18px; margin-top: 30px; margin-bottom: 10px; color: #666; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .label { font-weight: 600; color: #555; }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          ${safeHtml(garment.decade || garment.date)} ${garment.work_type ? `• ${safeHtml(garment.work_type)}` : ""}
        </div>
        
        ${garment.editorial_title ? `<h2>${safeHtml(garment.editorial_title)}</h2>` : ""}
        ${garment.editorial_subtitle ? `<p class="meta">${safeHtml(garment.editorial_subtitle)}</p>` : ""}
        ${garment.tagline ? `<p><em>${safeHtml(garment.tagline)}</em></p>` : ""}
        
        ${garment.description ? `<div class="section"><div class="label">Description</div><p>${safeHtml(garment.description)}</p></div>` : ""}
        ${garment.aesthetic_description ? `<div class="section"><div class="label">Aesthetic Description</div><p>${safeHtml(garment.aesthetic_description)}</p></div>` : ""}
        ${garment.story ? `<div class="section"><div class="label">Story</div><p>${safeHtml(garment.story)}</p></div>` : ""}
        ${garment.inspiration ? `<div class="section"><div class="label">Inspiration</div><p>${safeHtml(garment.inspiration)}</p></div>` : ""}
        ${garment.context ? `<div class="section"><div class="label">Context</div><p>${safeHtml(garment.context)}</p></div>` : ""}
        
        <h2>Details</h2>
        ${garment.era ? `<p><span class="label">Era:</span> ${safeHtml(garment.era)}</p>` : ""}
        ${garment.colors && (Array.isArray(garment.colors) ? garment.colors.length > 0 : garment.colors) ? `<p><span class="label">Colors:</span> ${safeHtml(Array.isArray(garment.colors) ? garment.colors.join(", ") : String(garment.colors))}</p>` : ""}
        ${garment.materials && (Array.isArray(garment.materials) ? garment.materials.length > 0 : garment.materials) ? `<p><span class="label">Materials:</span> ${safeHtml(Array.isArray(garment.materials) ? garment.materials.join(", ") : String(garment.materials))}</p>` : ""}
        ${garment.dimensions ? `<p><span class="label">Dimensions:</span> ${safeHtml(garment.dimensions)}</p>` : ""}
        ${garment.condition ? `<p><span class="label">Condition:</span> ${safeHtml(garment.condition)}</p>` : ""}
        ${garment.collection ? `<p><span class="label">Collection:</span> ${safeHtml(garment.collection)}</p>` : ""}
        ${garment.accessionNumber ? `<p><span class="label">Accession Number:</span> ${safeHtml(garment.accessionNumber)}</p>` : ""}
        ${garment.provenance ? `<p><span class="label">Provenance:</span> ${safeHtml(garment.provenance)}</p>` : ""}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
          <p>UVA Fashion Archive</p>
          <p>Exported on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

