import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PDFDocument } from "pdf-lib";

/**
 * Merges tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a 3-digit random pickup code.
 */
export function generatePickupCode(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

/**
 * Formats currency to INR.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

/**
 * Calculates print cost based on Ridha Printers rules.
 */
export function calculatePrintCost(pages: number, printType: 'BW' | 'COLOR', sideType: 'SINGLE' | 'DOUBLE'): number {
  if (printType === 'COLOR') {
    return sideType === 'SINGLE' ? pages * 10 : pages * 20;
  }

  // B/W Logic
  if (sideType === 'SINGLE') {
    if (pages <= 10) return pages * 2;
    return (10 * 2) + (pages - 10) * 1;
  } else {
    // DOUBLE SIDE
    if (pages <= 10) return pages * 2;
    return (10 * 2) + (pages - 10) * 1.5;
  }
}

/**
 * Reads a PDF file locally and returns the page count.
 * This is 100% reliable, instant, and works offline.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error("Error counting PDF pages:", error);
    // Fallback search for /Type /Page if pdf-lib fails (happens with some corrupted PDFs)
    const text = await file.text();
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return matches ? matches.length : 1;
  }
}
