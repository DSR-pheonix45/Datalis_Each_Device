/**
 * OCR Service for Document Processing
 * Supports both images and PDFs (converts PDF to images first)
 */

import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Configure PDF.js worker - use local worker from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class OCRService {
    constructor() {
        this.worker = null;
    }

    /**
     * Initialize Tesseract worker
     */
    async initialize() {
        if (!this.worker) {
            this.worker = await Tesseract.createWorker('eng');
        }
        return this.worker;
    }

    /**
     * Check if file is a PDF
     */
    isPDF(file) {
        return file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    }

    /**
     * Convert PDF page to image
     * @param {File} pdfFile - PDF file object
     * @param {number} pageNum - Page number (1-indexed)
     * @returns {Promise<string>} - Base64 image data URL
     */
    async pdfPageToImage(pdfFile, pageNum = 1) {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(pageNum);

            const scale = 2.0; // Higher scale = better quality
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('PDF to image conversion failed:', error);
            throw new Error(`Failed to convert PDF page ${pageNum}: ${error.message}`);
        }
    }

    /**
     * Extract text from PDF (converts to images first)
     * @param {File} pdfFile - PDF file object
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} - Extracted text and metadata from all pages
     */
    async extractTextFromPDF(pdfFile, onProgress = null) {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;

            let allText = '';
            let totalConfidence = 0;
            const allLines = [];
            const allWords = [];

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                if (onProgress) {
                    onProgress(Math.round((pageNum / numPages) * 80)); // Reserve 20% for final processing
                }

                // Convert PDF page to image
                const imageDataUrl = await this.pdfPageToImage(pdfFile, pageNum);

                // Extract text from image using OCR
                await this.initialize();
                const { data } = await this.worker.recognize(imageDataUrl);

                allText += (pageNum > 1 ? '\n\n--- Page ' + pageNum + ' ---\n\n' : '') + data.text;
                totalConfidence += data.confidence;
                if (data.lines) allLines.push(...data.lines);
                if (data.words) allWords.push(...data.words);
            }

            if (onProgress) {
                onProgress(100);
            }

            return {
                text: allText,
                confidence: totalConfidence / numPages,
                lines: allLines.map(line => ({
                    text: line.text,
                    confidence: line.confidence,
                    bbox: line.bbox
                })),
                words: allWords.map(word => ({
                    text: word.text,
                    confidence: word.confidence,
                    bbox: word.bbox
                })),
                numPages
            };
        } catch (error) {
            console.error('PDF OCR failed:', error);
            throw new Error(`PDF OCR failed: ${error.message}`);
        }
    }

    /**
     * Extract text from image or PDF
     * @param {File|string} file - File object or base64 string
     * @param {Function} onProgress - Progress callback (optional)
     * @returns {Promise<Object>} - Extracted text and metadata
     */
    async extractText(file, onProgress = null) {
        try {
            // Check if it's a PDF
            if (file instanceof File && this.isPDF(file)) {
                return await this.extractTextFromPDF(file, onProgress);
            }

            // For images, process directly
            await this.initialize();

            const { data } = await this.worker.recognize(file);

            if (onProgress) {
                onProgress(100);
            }

            return {
                text: data.text || '',
                confidence: data.confidence || 0,
                lines: (data.lines || []).map(line => ({
                    text: line.text,
                    confidence: line.confidence,
                    bbox: line.bbox
                })),
                words: (data.words || []).map(word => ({
                    text: word.text,
                    confidence: word.confidence,
                    bbox: word.bbox
                }))
            };
        } catch (error) {
            console.error('OCR extraction failed:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error occurred during OCR';
            throw new Error(`OCR failed: ${errorMessage}`);
        }
    }

    /**
     * Classify document type based on extracted text
     * @param {string} text - Extracted text
     * @returns {Object} - Document type and confidence
     */
    classifyDocumentType(text) {
        const lowerText = text.toLowerCase();
        const classifications = [];

        // Bank Statement Detection - More comprehensive patterns
        if (this.containsKeywords(lowerText, [
            'bank statement', 'account statement', 'opening balance',
            'closing balance', 'transaction history', 'account number',
            'ifsc', 'swift', 'branch', 'transaction date', 'deposits',
            'withdrawals', 'available balance', 'current balance', 'statement period'
        ], 2)) {
            classifications.push({
                type: 'bank_statement', score: this.calculateScore(lowerText, [
                    'bank statement', 'account number', 'opening balance', 'closing balance',
                    'debit', 'credit', 'transaction', 'balance', 'statement', 'deposits', 'withdrawals'
                ])
            });
        }

        // Invoice Detection - Enhanced patterns
        if (this.containsKeywords(lowerText, [
            'invoice', 'invoice no', 'invoice number', 'invoice date',
            'bill to', 'ship to', 'total amount', 'amount due',
            'subtotal', 'tax', 'grand total', 'payment terms',
            'quantity', 'unit price', 'description', 'tax invoice'
        ], 2)) {
            classifications.push({
                type: 'invoice', score: this.calculateScore(lowerText, [
                    'invoice', 'bill to', 'total', 'amount', 'due date', 'payment',
                    'quantity', 'price', 'tax', 'subtotal'
                ])
            });
        }

        // Ledger Detection - Financial records
        if (this.containsKeywords(lowerText, [
            'ledger', 'general ledger', 'debit', 'credit',
            'account name', 'journal entry', 'balance c/f', 'balance b/f',
            'trial balance', 'account code', 'posting date'
        ], 2)) {
            classifications.push({
                type: 'ledger', score: this.calculateScore(lowerText, [
                    'ledger', 'debit', 'credit', 'balance', 'account', 'journal', 'posting'
                ])
            });
        }

        // Compliance Document Detection - Tax and regulatory
        if (this.containsKeywords(lowerText, [
            'gst', 'gstin', 'tax', 'compliance', 'filing',
            'return', 'assessment', 'tin', 'pan', 'registration',
            'tax invoice', 'hsn', 'sac', 'igst', 'cgst', 'sgst'
        ], 2)) {
            classifications.push({
                type: 'compliance', score: this.calculateScore(lowerText, [
                    'gst', 'tax', 'compliance', 'filing', 'return', 'gstin', 'pan'
                ])
            });
        }

        // Contract Detection - Legal documents
        if (this.containsKeywords(lowerText, [
            'agreement', 'contract', 'party of the first part',
            'party of the second part', 'witnesseth', 'terms and conditions',
            'signed', 'executed', 'whereas', 'hereby', 'parties agree'
        ], 2)) {
            classifications.push({
                type: 'contract', score: this.calculateScore(lowerText, [
                    'agreement', 'contract', 'party', 'terms', 'signed', 'whereas', 'hereby'
                ])
            });
        }

        // Return best match or 'other'
        if (classifications.length === 0) {
            return { type: 'other', confidence: 0.5 };
        }

        classifications.sort((a, b) => b.score - a.score);
        const best = classifications[0];

        return {
            type: best.type,
            confidence: Math.min(best.score / 100, 0.99), // Normalize to 0-0.99
            alternates: classifications.slice(1, 3).map(c => ({
                type: c.type,
                confidence: Math.min(c.score / 100, 0.99)
            }))
        };
    }

    /**
     * Check if text contains minimum number of keywords
     */
    containsKeywords(text, keywords, minMatches) {
        let matches = 0;
        for (const keyword of keywords) {
            if (text.includes(keyword)) matches++;
            if (matches >= minMatches) return true;
        }
        return false;
    }

    /**
     * Calculate classification score based on keyword frequency
     */
    calculateScore(text, keywords) {
        let score = 0;
        for (const keyword of keywords) {
            const regex = new RegExp(keyword, 'gi');
            const matches = (text.match(regex) || []).length;
            score += matches * 10; // 10 points per match
        }
        return Math.min(score, 100);
    }

    /**
     * Preprocess image for better OCR results
     * @param {File} file - Image file
     * @returns {Promise<string>} - Base64 processed image
     */
    async preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set canvas size
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw image
                    ctx.drawImage(img, 0, 0);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Apply grayscale and contrast enhancement
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        const enhanced = avg < 128 ? 0 : 255; // Binary threshold
                        data[i] = enhanced;
                        data[i + 1] = enhanced;
                        data[i + 2] = enhanced;
                    }

                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Cleanup worker
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}

export default new OCRService();
