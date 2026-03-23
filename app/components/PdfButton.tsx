"use client";
// Ky skedar ekziston vetëm për të izoluar jsPDF nga Turbopack SSR
import jsPDF from "jspdf";

interface PdfButtonProps {
  post: any;
}

export default function PdfButton({ post }: PdfButtonProps) {
  const exportPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 30;

    // Header Indigo
    doc.setFillColor(79, 70, 229); 
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Posto.ai", margin, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("AI CONTENT STRATEGY PLAN", pageWidth - margin - 50, 25);

    // Business Info
    y = 55;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(post.business_name.toUpperCase(), margin, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${new Date(post.created_at).toLocaleDateString()}`, margin, y);

    // Posts Loop
    post.content.posts.forEach((p: any) => {
      if (y > 240) { doc.addPage(); y = 30; }
      y += 20;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 12, 3, 3, "F");
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(11);
      doc.text(`STRATEGY #${p.id}`, margin + 5, y + 8);
      y += 20;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      const hookLines = doc.splitTextToSize(p.hook, pageWidth - (margin * 2));
      doc.text(hookLines, margin, y);
      y += (hookLines.length * 7);
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(10);
      const captionLines = doc.splitTextToSize(p.caption, pageWidth - (margin * 2));
      doc.text(captionLines, margin, y);
      y += (captionLines.length * 6) + 10;
    });

    // Footer me emrin tënd
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text("STRATEGIST: LINDITA MORINA", margin, 290);
      doc.text(`PAGE ${i} OF ${pageCount}`, pageWidth - margin - 20, 290);
    }

    doc.save(`Plan_${post.business_name}.pdf`);
  };

  return (
    <button 
      onClick={exportPDF} 
      className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
    >
      Download Professional PDF
    </button>
  );
}