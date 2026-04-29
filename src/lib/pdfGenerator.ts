import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem } from '../types';

export const generateAssetPDF = (item: InventoryItem) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header - Industrial/Patrimonial Style
  doc.setFillColor(15, 17, 21);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE HALLAZGO', 15, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA DE CONTROL PATRIMONIAL', 15, 30);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`FECHA DE GENERACIÓN: ${new Date().toLocaleString()}`, pageWidth - 15, 30, { align: 'right' });

  // Reset Colors
  doc.setTextColor(0, 0, 0);

  // Asset Info Table
  const tableData = [
    ['CAMPO', 'VALOR'],
    ['PLACA PATRIMONIAL', item.placa || '---'],
    ['DESCRIPCIÓN', item.descripcion || '---'],
    ['MARCA', item.marca || '---'],
    ['MODELO', item.modelo || '---'],
    ['SERIE', item.serie || '---'],
    ['UBICACIÓN REPORTADA', item.ubicacion || '---'],
    ['ESTADO EN SISTEMA', item.estadoCarga === 'no-ubicado' ? 'PENDIENTE -> UBICADO' : 'UBICADO'],
    ['CTA', item.cta || '---']
  ];

  autoTable(doc, {
    startY: 50,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'striped',
    headStyles: { 
      fillColor: [79, 70, 229], 
      textColor: 255, 
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 }
    }
  });

  // Photo Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  if (item.imageUrl) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EVIDENCIA FOTOGRÁFICA:', 15, finalY);

    try {
      // Image base64 handling
      const imgWidth = 140;
      const imgHeight = 100;
      const centeredX = (pageWidth - imgWidth) / 2;
      
      doc.addImage(item.imageUrl, 'JPEG', centeredX, finalY + 5, imgWidth, imgHeight);
    } catch (e) {
      doc.setTextColor(255, 0, 0);
      doc.text('Error al cargar la imagen en el PDF', 15, finalY + 15);
    }
  } else {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text('SIN EVIDENCIA FOTOGRÁFICA ADJUNTA', 15, finalY + 10);
  }

  // Footer bar
  const height = doc.internal.pageSize.height;
  doc.setFillColor(245, 245, 245);
  doc.rect(0, height - 20, pageWidth, 20, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento generado automáticamente por el Módulo de Control de Hallazgos.', 15, height - 10);
  doc.text('Página 1 de 1', pageWidth - 15, height - 10, { align: 'right' });

  // Save the PDF
  doc.save(`Hallazgo_${item.placa || 'desconocido'}_${Date.now()}.pdf`);
};

export const generateFindingsSummaryPDF = (items: InventoryItem[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(15, 17, 21);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE CONSOLIDADO DE HALLAZGOS', 15, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`TOTAL DE ACTIVOS RECUPERADOS: ${items.length}`, 15, 30);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`FECHA DE REPORTE: ${new Date().toLocaleString()}`, pageWidth - 15, 30, { align: 'right' });

  // Summary Table
  const tableData = items.map((item, index) => [
    index + 1,
    item.placa || '---',
    item.descripcion || '---',
    item.ubicacion || '---',
    item.findingDate ? new Date(item.findingDate.toDate ? item.findingDate.toDate() : item.findingDate).toLocaleDateString() : '---'
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['#', 'PLACA', 'DESCRIPCIÓN', 'UBICACIÓN HALLAZGO', 'FECHA']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [13, 148, 136] }, // Teal Color
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 50 },
      4: { cellWidth: 25 }
    }
  });

  // Appendix: Gallery of findings (Photos)
  let currentY = (doc as any).lastAutoTable.finalY + 20;

  if (items.some(i => i.imageUrl)) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Grid settings for photos
    const cols = 2;
    const margin = 15;
    const spacing = 10;
    const totalAvailableWidth = pageWidth - (margin * 2);
    const imgWidth = (totalAvailableWidth - spacing) / cols;
    const imgHeight = (imgWidth * 0.75); // 4:3 aspect ratio

    items.filter(i => i.imageUrl).forEach((item, index) => {
      // Check if we need a new page
      if (currentY + imgHeight + 20 > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      const col = index % cols;
      const x = margin + (col * (imgWidth + spacing));
      
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text(`PLACA: ${item.placa}`, x, currentY - 2);

      try {
        doc.addImage(item.imageUrl!, 'JPEG', x, currentY, imgWidth, imgHeight);
      } catch (e) {
        doc.rect(x, currentY, imgWidth, imgHeight);
        doc.text('Error de imagen', x + 5, currentY + 5);
      }

      // If it's the second column, move Y down for next row
      if (col === 1) {
        currentY += imgHeight + 20;
      } else if (index === items.length - 1) {
        // Last item but in first col
        currentY += imgHeight + 20;
      }
    });
  }

  // Footer bar (each page)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
    doc.text('Control Patrimonial - Reporte de Hallazgos', 15, pageHeight - 8);
  }

  doc.save(`Consolidado_Hallazgos_${Date.now()}.pdf`);
};
