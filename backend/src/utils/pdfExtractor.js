import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text || '',
      pageCount: data.numpages || 1,
      info: data.info || {},
    };
  } catch (error) {
    console.warn('[SARTHI PDF] pdf-parse extraction notice:', error.message);
    // If it's a scanned/unreadable PDF, return graceful message
    return {
      text: 'Scanned document detected. The document contains visual pages that need OCR analysis.',
      pageCount: 1,
      isScanned: true,
    };
  }
}
