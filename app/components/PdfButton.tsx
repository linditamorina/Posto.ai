"use client";
import jsPDF from "jspdf";

interface PdfButtonProps {
  post: any;
}

export default function PdfButton({ post }: PdfButtonProps) {
  
  // Konvertimi i imazhit në format që jsPDF e kupton
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

  const exportPDF = async () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    const cardPadding = 12; 
    let y = 0;

    // Funksion për gjenerimin e faqeve të reja me sfond dark
    const addNewDarkPage = () => {
      doc.addPage();
      doc.setFillColor(2, 6, 23); // Slate-950
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      return 25; 
    };

    // --- FAQA E PARË ---
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    
    // Linja Indigo lart
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 2, "F");

    // Header Info
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("POSTO.AI", margin, 20);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("STRATEGIC CONTENT EXPORT", margin, 27);

    y = 40;

    // --- IMAZHI I REFERENCËS ---
    if (post.reference_image) {
      try {
        const imgData = await getBase64ImageFromURL(post.reference_image);
        doc.addImage(imgData, "PNG", margin, y, contentWidth, 70);
        y += 85;
      } catch (e) {
        y += 10;
      }
    }

    // --- TITULLI I BIZNESIT ---
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    const title = (post.business_name || "BUSINESS PLAN").toUpperCase();
    doc.text(title, margin, y);
    y += 20;

    // --- CONTENT NODES (POSTIMET) ---
    const posts = post.content?.posts || [];
    
    for (let idx = 0; idx < posts.length; idx++) {
      const p = posts[idx];

      // Llogaritja e lartësive për të parandaluar mbivendosjen
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const hookLines = doc.splitTextToSize(`"${p.hook || p.title}"`, contentWidth - (cardPadding * 2));
      const hookHeight = hookLines.length * 7; 

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const captionLines = doc.splitTextToSize(p.caption || p.content || "", contentWidth - (cardPadding * 2));
      const captionHeight = captionLines.length * 5.5; 

      // Hashtags
      const tagsText = p.hashtags ? p.hashtags.map((t: string) => `#${t.replace('#', '')}`).join(" ") : "";
      const tagLines = tagsText ? doc.splitTextToSize(tagsText, contentWidth - (cardPadding * 2)) : [];
      const tagsHeight = tagLines.length > 0 ? (tagLines.length * 5) + 5 : 0;

      // Lartësia totale e kartelës me padding
      const totalCardHeight = 15 + hookHeight + 8 + captionHeight + tagsHeight + 15;

      // Kontrolli për faqe të re
      if (y + totalCardHeight > pageHeight - 30) {
        y = addNewDarkPage();
      }

      // Vizatimi i kartelës (Slate-900)
      doc.setFillColor(15, 23, 42); 
      doc.roundedRect(margin, y, contentWidth, totalCardHeight - 5, 5, 5, "F");

      // Label "Node"
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`NODE #${idx + 1}`, margin + cardPadding, y + 10);

      y += 20;

      // Hook (Titulli i postimit)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(hookLines, margin + cardPadding, y);

      y += hookHeight + 8;

      // Caption (Përmbajtja)
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(captionLines, margin + cardPadding, y);

      y += captionHeight + 5;

      // Renderimi i Hashtags
      if (tagsText) {
        doc.setTextColor(99, 102, 241); 
        doc.setFontSize(9);
        doc.text(tagLines, margin + cardPadding, y);
        y += tagsHeight;
      }

      y += 15; 
    }

    // --- SEKSIONI I OFERTAVE ---
    const offers = post.content?.special_offers || post.content?.offers || [];
    if (offers.length > 0) {
      if (y > pageHeight - 60) y = addNewDarkPage();
      
      y += 10;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("EXCLUSIVE OFFERS", margin, y);
      y += 12;

      offers.forEach((offer: any) => {
        const offerText = typeof offer === 'string' ? offer : (offer.title || offer.description);
        if (y > pageHeight - 25) y = addNewDarkPage();

        doc.setFillColor(30, 41, 59); 
        doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
        doc.setTextColor(129, 140, 248);
        doc.setFontSize(9);
        doc.text(`> ${offerText}`, margin + 5, y + 6.5);
        y += 14;
      });
    }

    // --- FOOTER PËR ÇDO FAQE ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      doc.text(`STRATEGIST: LINDITA MORINA  |  PAGE ${i}/${pageCount}`, margin, pageHeight - 10);
      doc.text("© 2026 POSTO.AI - ALL RIGHTS RESERVED", pageWidth - margin - 65, pageHeight - 10);
    }

    doc.save(`Strategy_${post.business_name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <button 
      onClick={exportPDF} 
      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center gap-2"
    >
      <span>Download PDF Report</span>
    </button>
  );
}