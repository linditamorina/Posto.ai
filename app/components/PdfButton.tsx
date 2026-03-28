"use client";
import { useState } from "react";

interface PdfButtonProps {
  post: any;
}

export default function PdfButton({ post }: PdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const exportPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post || isGenerating) return;

    setIsGenerating(true);

    try {
      // Detyrojmë Next.js të marrë versionin ES Module që është i pastër nga Node dependencies
      // @ts-ignore
      const { default: jsPDF } = await import("jspdf/dist/jspdf.es.min.js");
      
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (margin * 2);
      const cardPadding = 12; 
      let y = 0;

      const addNewDarkPage = () => {
        doc.addPage();
        doc.setFillColor(2, 6, 23);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        return 25; 
      };

      // Faqja e parë
      doc.setFillColor(2, 6, 23);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("POSTO.AI", margin, 20);
      
      y = 40;

      if (post.reference_image) {
        try {
          const imgData = await getBase64ImageFromURL(post.reference_image);
          doc.addImage(imgData, "PNG", margin, y, contentWidth, 70);
          y += 85;
        } catch (err) { y += 10; }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      const title = (post.business_name || "BUSINESS").toUpperCase();
      doc.text(title, margin, y);
      y += 20;

      const posts = post.content?.posts || [];
      for (let idx = 0; idx < posts.length; idx++) {
        const p = posts[idx];
        
        doc.setFontSize(14);
        const titleText = p.hook || p.title || "Social Post";
        const hookLines = doc.splitTextToSize(`"${titleText}"`, contentWidth - (cardPadding * 2));
        const hookHeight = hookLines.length * 7; 

        doc.setFontSize(10);
        const captionLines = doc.splitTextToSize(p.caption || p.content || "", contentWidth - (cardPadding * 2));
        const captionHeight = captionLines.length * 5.5; 

        const totalCardHeight = 15 + hookHeight + 8 + captionHeight + 15;
        if (y + totalCardHeight > pageHeight - 30) y = addNewDarkPage();

        doc.setFillColor(15, 23, 42); 
        doc.roundedRect(margin, y, contentWidth, totalCardHeight - 5, 5, 5, "F");
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(8);
        doc.text(`NODE #${idx + 1}`, margin + cardPadding, y + 10);

        y += 20;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text(hookLines, margin + cardPadding, y);

        y += hookHeight + 8;
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(10);
        doc.text(captionLines, margin + cardPadding, y);

        y += captionHeight + 15; 
      }

      doc.save(`Strategy_${(post.business_name || 'Export').replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error("PDF Export Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={exportPDF} 
      disabled={isGenerating}
      className={`bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span>{isGenerating ? "Processing..." : "PDF ⬇"}</span>
    </button>
  );
}