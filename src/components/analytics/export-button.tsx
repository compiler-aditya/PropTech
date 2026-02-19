"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2, FileText, FileSpreadsheet, FileType } from "lucide-react";
import type { AnalyticsData } from "@/actions/analytics";

interface ExportButtonProps {
  data: AnalyticsData;
  scopeLabel: string;
}

function buildCSVRows(data: AnalyticsData, scopeLabel: string): (string | number)[][] {
  const rows: (string | number)[][] = [
    ["Analytics Report", scopeLabel],
    ["Generated", new Date().toLocaleDateString()],
    [],
    ["SUMMARY"],
    ["Metric", "Value"],
    ["Total Tickets", data.summary.total],
    ["Active", data.summary.active],
    ["Completed (in range)", data.summary.completedInRange],
    ["Urgent Open", data.summary.urgentOpen],
    ["Avg Resolution (days)", data.summary.avgResolutionDays ?? "N/A"],
    [],
    ["BY STATUS"],
    ["Status", "Count"],
    ...data.byStatus.map((s) => [s.label, s.count]),
    [],
    ["BY PRIORITY"],
    ["Priority", "Count"],
    ...data.byPriority.map((p) => [p.label, p.count]),
    [],
    ["BY CATEGORY"],
    ["Category", "Count"],
    ...data.byCategory.map((c) => [c.label, c.count]),
    [],
    ["MONTHLY TREND (LAST 6 MONTHS)"],
    ["Month", "Created", "Completed"],
    ...data.monthlyTrend.map((m) => [m.month, m.created, m.completed]),
    [],
    ["PROPERTY SUMMARY"],
    ["Property", "Total", "Active", "Completed", "Done %"],
    ...data.byProperty.map((p) => {
      const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
      return [p.name, p.total, p.open, p.completed, `${pct}%`];
    }),
    [],
    ["TECHNICIAN WORKLOAD"],
    ["Technician", "Active", "Completed"],
    ...data.technicianWorkload.map((t) => [t.name, t.active, t.completed]),
  ];
  return rows;
}

function toCSVString(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    )
    .join("\n");
}

export function ExportButton({ data, scopeLabel }: ExportButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const filename = `analytics-${new Date().toISOString().slice(0, 10)}`;

  // ── CSV ────────────────────────────────────────────────────────────────────
  function exportCSV() {
    setLoading("csv");
    const csv = toCSVString(buildCSVRows(data, scopeLabel));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(null);
  }

  // ── Excel ──────────────────────────────────────────────────────────────────
  async function exportExcel() {
    setLoading("excel");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Summary
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["Analytics Report", scopeLabel],
          ["Generated", new Date().toLocaleDateString()],
          [],
          ["Metric", "Value"],
          ["Total Tickets", data.summary.total],
          ["Active", data.summary.active],
          ["Completed (in range)", data.summary.completedInRange],
          ["Urgent Open", data.summary.urgentOpen],
          ["Avg Resolution (days)", data.summary.avgResolutionDays ?? "N/A"],
        ]),
        "Summary"
      );

      // By Status
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["Status", "Count"],
          ...data.byStatus.map((s) => [s.label, s.count]),
        ]),
        "By Status"
      );

      // By Priority
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["Priority", "Count"],
          ...data.byPriority.map((p) => [p.label, p.count]),
        ]),
        "By Priority"
      );

      // By Category
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["Category", "Count"],
          ...data.byCategory.map((c) => [c.label, c.count]),
        ]),
        "By Category"
      );

      // Monthly Trend
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["Month", "Created", "Completed"],
          ...data.monthlyTrend.map((m) => [m.month, m.created, m.completed]),
        ]),
        "Monthly Trend"
      );

      // Property Summary
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["Property", "Total", "Active", "Completed", "Done %"],
          ...data.byProperty.map((p) => {
            const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            return [p.name, p.total, p.open, p.completed, `${pct}%`];
          }),
        ]),
        "Properties"
      );

      // Technician Workload
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["Technician", "Active", "Completed"],
          ...data.technicianWorkload.map((t) => [t.name, t.active, t.completed]),
        ]),
        "Technicians"
      );

      XLSX.writeFile(wb, `${filename}.xlsx`);
    } finally {
      setLoading(null);
    }
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  async function exportPDF() {
    setLoading("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Analytics Report", 14, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(scopeLabel, 14, 27);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 14, 27, {
        align: "right",
      });
      doc.setTextColor(0);

      const H = { fillColor: [59, 130, 246] as [number, number, number] };
      const ALT = { fillColor: [248, 250, 252] as [number, number, number] };

      // Summary
      autoTable(doc, {
        head: [["Metric", "Value"]],
        body: [
          ["Total Tickets", data.summary.total],
          ["Active", data.summary.active],
          ["Completed (in range)", data.summary.completedInRange],
          ["Urgent Open", data.summary.urgentOpen],
          ["Avg Resolution (days)", data.summary.avgResolutionDays ?? "N/A"],
        ],
        startY: 33,
        headStyles: H,
        alternateRowStyles: ALT,
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
      });

      // Status + Priority side by side
      const half = (pageW - 32) / 2;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let y = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        head: [["Status", "Count"]],
        body: data.byStatus.map((s) => [s.label, s.count]),
        startY: y,
        headStyles: { fillColor: [99, 102, 241] as [number, number, number] },
        alternateRowStyles: ALT,
        styles: { fontSize: 9 },
        tableWidth: half,
        margin: { left: 14, right: pageW - 14 - half },
      });

      autoTable(doc, {
        head: [["Priority", "Count"]],
        body: data.byPriority.map((p) => [p.label, p.count]),
        startY: y,
        headStyles: { fillColor: [245, 158, 11] as [number, number, number] },
        alternateRowStyles: ALT,
        styles: { fontSize: 9 },
        tableWidth: half,
        margin: { left: 14 + half + 4, right: 14 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8;

      // Monthly Trend
      autoTable(doc, {
        head: [["Month", "Created", "Completed"]],
        body: data.monthlyTrend.map((m) => [m.month, m.created, m.completed]),
        startY: y,
        headStyles: { fillColor: [16, 185, 129] as [number, number, number] },
        alternateRowStyles: ALT,
        styles: { fontSize: 9 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8;

      // By Category
      if (data.byCategory.length > 0) {
        autoTable(doc, {
          head: [["Category", "Count"]],
          body: data.byCategory.map((c) => [c.label, c.count]),
          startY: y,
          headStyles: { fillColor: [96, 165, 250] as [number, number, number] },
          alternateRowStyles: ALT,
          styles: { fontSize: 9 },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Property Summary
      autoTable(doc, {
        head: [["Property", "Total", "Active", "Completed", "Done %"]],
        body: data.byProperty.map((p) => {
          const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
          return [p.name, p.total, p.open, p.completed, `${pct}%`];
        }),
        startY: y,
        headStyles: H,
        alternateRowStyles: ALT,
        styles: { fontSize: 9 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8;

      // Technician Workload
      if (data.technicianWorkload.length > 0) {
        autoTable(doc, {
          head: [["Technician", "Active", "Completed"]],
          body: data.technicianWorkload.map((t) => [t.name, t.active, t.completed]),
          startY: y,
          headStyles: { fillColor: [139, 92, 246] as [number, number, number] },
          alternateRowStyles: ALT,
          styles: { fontSize: 9 },
        });
      }

      doc.save(`${filename}.pdf`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading !== null}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV} disabled={loading !== null}>
          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel} disabled={loading !== null}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} disabled={loading !== null}>
          <FileType className="h-4 w-4 mr-2 text-red-500" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
