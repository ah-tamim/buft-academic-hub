import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Capture a DOM element and download it as a high-resolution portrait A4 PDF.
 */
export async function downloadA4PDF(elementId: string, filename: string = 'BUFT-Document.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[pdfGenerator] Element with ID "${elementId}" not found.`);
    return;
  }

  // Save the current scroll positions
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  try {
    // Set rendering options for premium crispness (300 DPI equivalent via scale: 3)
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    // Create jsPDF document: A4 Portrait (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add high-resolution image to exactly fit the A4 page
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    
    // Save file
    pdf.save(filename);
  } catch (error) {
    console.error('[pdfGenerator] Error exporting PDF:', error);
    alert('An error occurred during PDF generation. Please try again.');
  } finally {
    // Restore window scroll
    window.scrollTo(scrollX, scrollY);
  }
}
