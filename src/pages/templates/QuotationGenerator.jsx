import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2, Globe, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export default function QuotationGenerator() {
  const { theme } = useTheme();
  const [quotationData, setQuotationData] = useState({
    quotationNumber: "QT-001",
    date: new Date().toISOString().split('T')[0],
    expiryDate: "",
    senderName: "",
    senderEmail: "",
    senderAddress: "",
    senderGstin: "",
    senderCin: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    clientGstin: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: "",
    taxRate: 18,
  });

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuotationData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...quotationData.items];
    newItems[index][name] = name === "description" ? value : parseFloat(value) || 0;
    setQuotationData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setQuotationData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    const newItems = quotationData.items.filter((_, i) => i !== index);
    setQuotationData(prev => ({ ...prev, items: newItems }));
  };

  const calculateSubtotal = () => {
    return quotationData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (quotationData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();
    const symbol = "₹";
    const primaryColor = [0, 71, 171]; // Royal Blue

    // Header Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", 105, 25, { align: "center" });

    // Document Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Quotation #:`, 20, 55);
    doc.setFont("helvetica", "normal");
    doc.text(quotationData.quotationNumber, 45, 55);

    doc.setFont("helvetica", "bold");
    doc.text(`Date:`, 20, 62);
    doc.setFont("helvetica", "normal");
    doc.text(quotationData.date, 45, 62);

    if (quotationData.expiryDate) {
      doc.setFont("helvetica", "bold");
      doc.text(`Valid Until:`, 20, 69);
      doc.setFont("helvetica", "normal");
      doc.text(quotationData.expiryDate, 45, 69);
    }

    // Section Headers
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 80, 80, 8, 'F');
    doc.rect(110, 80, 80, 8, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text("FROM", 25, 86);
    doc.text("FOR CLIENT", 115, 86);

    // Details
    doc.setFont("helvetica", "normal");
    let senderY = 95;
    doc.text(quotationData.senderName || "Your Name", 20, senderY);
    senderY += 6;
    doc.text(quotationData.senderEmail || "your@email.com", 20, senderY);
    senderY += 6;
    if (quotationData.senderGstin) {
      doc.text(`GSTIN: ${quotationData.senderGstin}`, 20, senderY);
      senderY += 6;
    }
    const senderAddrLines = doc.splitTextToSize(quotationData.senderAddress || "Your Address", 80);
    doc.text(senderAddrLines, 20, senderY);
    senderY += (senderAddrLines.length * 6);

    let clientY = 95;
    doc.text(quotationData.clientName || "Client Name", 110, clientY);
    clientY += 6;
    doc.text(quotationData.clientEmail || "client@email.com", 110, clientY);
    clientY += 6;
    if (quotationData.clientGstin) {
      doc.text(`GSTIN: ${quotationData.clientGstin}`, 110, clientY);
      clientY += 6;
    }
    const clientAddrLines = doc.splitTextToSize(quotationData.clientAddress || "Client Address", 80);
    doc.text(clientAddrLines, 110, clientY);
    clientY += (clientAddrLines.length * 6);

    const tableStartY = Math.max(senderY, clientY) + 10;

    const tableData = quotationData.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${symbol}${item.price.toFixed(2)}`,
      `${symbol}${(item.quantity * item.price).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["Description", "Quantity", "Price", "Total"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: 'F', fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    
    // Totals Section
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, finalY);
    doc.text(`${symbol}${subtotal.toFixed(2)}`, 190, finalY, { align: "right" });
    
    finalY += 7;
    doc.text(`GST (${quotationData.taxRate}%):`, 140, finalY);
    doc.text(`${symbol}${tax.toFixed(2)}`, 190, finalY, { align: "right" });
    
    finalY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setFillColor(...primaryColor);
    doc.rect(135, finalY - 6, 60, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("Total Amount:", 140, finalY);
    doc.text(`${symbol}${total.toFixed(2)}`, 190, finalY, { align: "right" });

    if (quotationData.notes) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      finalY += 20;
      doc.text("Notes:", 20, finalY);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(quotationData.notes, 170);
      doc.text(noteLines, 20, finalY + 7);
      finalY += (noteLines.length * 6) + 10;
    }

    // Footer Branding
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Professional Document Generated via Dabby", pageWidth / 2, pageHeight - 10, { align: "center" });

    doc.save(`Quotation_${quotationData.quotationNumber}.pdf`);
  };

  const generateWord = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header Bar replacement in Word
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BorderStyle.NONE,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "0047AB" },
                    margins: { top: 400, bottom: 400, left: 400, right: 400 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "QUOTATION", bold: true, size: 48, color: "FFFFFF" }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400 } }),

          // Document Info
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BorderStyle.NONE,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Quotation #: ", bold: true }), new TextRun({ text: quotationData.quotationNumber })] }),
                      new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun({ text: quotationData.date })] }),
                      ...(quotationData.expiryDate ? [new Paragraph({ children: [new TextRun({ text: "Valid Until: ", bold: true }), new TextRun({ text: quotationData.expiryDate })] })] : []),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400 } }),

          // From / For Client
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F2F2F2" },
                    children: [new Paragraph({ children: [new TextRun({ text: "FROM", bold: true, size: 20 })] })],
                    margins: { left: 100, top: 100, bottom: 100 },
                  }),
                  new TableCell({
                    shading: { fill: "F2F2F2" },
                    children: [new Paragraph({ children: [new TextRun({ text: "FOR CLIENT", bold: true, size: 20 })] })],
                    margins: { left: 100, top: 100, bottom: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: quotationData.senderName || "Your Name", bold: true })] }),
                      new Paragraph({ text: quotationData.senderEmail || "your@email.com" }),
                      ...(quotationData.senderGstin ? [new Paragraph({ text: `GSTIN: ${quotationData.senderGstin}` })] : []),
                      new Paragraph({ text: quotationData.senderAddress || "Your Address" }),
                    ],
                    borders: BorderStyle.NONE,
                    margins: { top: 200, bottom: 200, left: 100 },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: quotationData.clientName || "Client Name", bold: true })] }),
                      new Paragraph({ text: quotationData.clientEmail || "client@email.com" }),
                      ...(quotationData.clientGstin ? [new Paragraph({ text: `GSTIN: ${quotationData.clientGstin}` })] : []),
                      new Paragraph({ text: quotationData.clientAddress || "Client Address" }),
                    ],
                    borders: BorderStyle.NONE,
                    margins: { top: 200, bottom: 200, left: 100 },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400, after: 400 } }),

          // Items Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "0047AB" }, children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true, color: "FFFFFF" })] })] }),
                  new TableCell({ shading: { fill: "0047AB" }, children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true, color: "FFFFFF" })] })], alignment: AlignmentType.CENTER }),
                  new TableCell({ shading: { fill: "0047AB" }, children: [new Paragraph({ children: [new TextRun({ text: "Price (₹)", bold: true, color: "FFFFFF" })] })], alignment: AlignmentType.RIGHT }),
                  new TableCell({ shading: { fill: "0047AB" }, children: [new Paragraph({ children: [new TextRun({ text: "Total (₹)", bold: true, color: "FFFFFF" })] })], alignment: AlignmentType.RIGHT }),
                ],
              }),
              ...quotationData.items.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: item.description })], margins: { left: 100, top: 100, bottom: 100 } }),
                  new TableCell({ children: [new Paragraph({ text: item.quantity.toString(), alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
                  new TableCell({ children: [new Paragraph({ text: item.price.toFixed(2), alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
                  new TableCell({ children: [new Paragraph({ text: (item.quantity * item.price).toFixed(2), alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
                ],
              })),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400 } }),

          // Totals Section
          new Paragraph({
            children: [
              new TextRun({ text: `Subtotal: ₹${subtotal.toFixed(2)}` }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `GST (${quotationData.taxRate}%): ₹${tax.toFixed(2)}` }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total Amount: ₹${total.toFixed(2)}`, bold: true, size: 28, color: "0047AB" }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200 },
          }),

          ...(quotationData.notes ? [
            new Paragraph({ text: "", spacing: { before: 400 } }),
            new Paragraph({ children: [new TextRun({ text: "Notes:", bold: true })] }),
            new Paragraph({ text: quotationData.notes }),
          ] : []),

          new Paragraph({ text: "", spacing: { before: 1200 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "Professional Document Generated via Dabby", color: "808080", size: 18, italic: true }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Quotation_${quotationData.quotationNumber}.docx`);
    });
  };

  return (
    <div className={`min-h-screen py-24 px-6 md:px-12 ${
      theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-4xl mx-auto">
        <Link to="/templates" className="flex items-center gap-2 text-[#81E6D9] mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </Link>

        <div className={`rounded-3xl border p-8 md:p-12 ${
          theme === "dark" ? "bg-[#111] border-white/10" : "bg-white border-gray-200 shadow-xl"
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Quotation Generator</h1>
              <p className="text-sm opacity-70">Create professional quotations for your clients</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 bg-[#81E6D9] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#71d6c9] transition-all"
              >
                <Download className="w-5 h-5" /> Export Document <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
              </button>

              {showExportMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border z-50 overflow-hidden ${
                  theme === "dark" ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
                }`}>
                  <button
                    onClick={() => {
                      generatePDF();
                      setShowExportMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#81E6D9]/10 transition-colors ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Download className="w-4 h-4 text-red-500" />
                    </div>
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      generateWord();
                      setShowExportMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#81E6D9]/10 transition-colors ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-500" />
                    </div>
                    Download Word
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Quotation Details</h2>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-70">Quotation Number</label>
                <input
                  type="text"
                  name="quotationNumber"
                  value={quotationData.quotationNumber}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${
                    theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-70">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={quotationData.date}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-xl border ${
                      theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-70">Valid Until</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={quotationData.expiryDate}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-xl border ${
                      theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Tax & Currency</h2>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-70">GST Rate (%)</label>
                <input
                  type="number"
                  name="taxRate"
                  value={quotationData.taxRate}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${
                    theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                  }`}
                />
              </div>
              <div className="p-4 rounded-xl bg-[#81E6D9]/5 border border-[#81E6D9]/20">
                <p className="text-xs opacity-70">Default Currency: <span className="font-bold text-[#81E6D9]">INR (₹)</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">From</h2>
              <input
                type="text"
                name="senderName"
                placeholder="Your Name / Company"
                value={quotationData.senderName}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="senderGstin"
                  placeholder="GST Number"
                  value={quotationData.senderGstin}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
                <input
                  type="text"
                  name="senderCin"
                  placeholder="CIN"
                  value={quotationData.senderCin}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <input
                type="email"
                name="senderEmail"
                placeholder="Email Address"
                value={quotationData.senderEmail}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
              <textarea
                name="senderAddress"
                placeholder="Address"
                value={quotationData.senderAddress}
                onChange={handleInputChange}
                rows="3"
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">For Client</h2>
              <input
                type="text"
                name="clientName"
                placeholder="Client's Name / Company"
                value={quotationData.clientName}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />

              <input
                type="text"
                name="clientGstin"
                placeholder="Client GST Number"
                value={quotationData.clientGstin}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
              />

              <input
                type="email"
                name="clientEmail"
                placeholder="Client's Email"
                value={quotationData.clientEmail}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
              <textarea
                name="clientAddress"
                placeholder="Client's Address"
                value={quotationData.clientAddress}
                onChange={handleInputChange}
                rows="3"
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-lg font-semibold border-b pb-4 mb-6">Line Items</h2>
            <div className="space-y-4">
              {quotationData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-6">
                    <label className="block text-xs font-medium mb-1 opacity-70">Description</label>
                    <input
                      type="text"
                      name="description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, e)}
                      placeholder="Service/Product description"
                      className={`w-full p-3 rounded-xl border ${
                        theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                      }`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1 opacity-70">Qty</label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, e)}
                      className={`w-full p-3 rounded-xl border ${
                        theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                      }`}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1 opacity-70">Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, e)}
                      className={`w-full p-3 rounded-xl border ${
                        theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                      }`}
                    />
                  </div>
                  <div className="col-span-1 pb-3">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addItem}
                className="flex items-center gap-2 text-[#81E6D9] font-semibold hover:underline mt-4"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-8 pt-8 border-t">
            <div className="flex-grow">
              <label className="block text-sm font-medium mb-2 opacity-70">Notes / Comments</label>
              <textarea
                name="notes"
                placeholder="Validity terms, specific conditions..."
                value={quotationData.notes}
                onChange={handleInputChange}
                rows="4"
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
            </div>
            <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between">
                <span className="opacity-70">Subtotal</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">GST ({quotationData.taxRate}%)</span>
                <span>₹{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                <span>Total Quote</span>
                <span className="text-[#81E6D9]">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
