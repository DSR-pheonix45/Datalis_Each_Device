import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2, Globe, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export default function ProformaInvoiceGenerator() {
  const { theme } = useTheme();
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "PI-001",
    date: new Date().toISOString().split('T')[0],
    senderName: "",
    senderGstin: "",
    senderCin: "",
    senderAddress: "",
    clientName: "",
    clientGstin: "",
    clientAddress: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: "",
    taxRate: 18,
  });

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...invoiceData.items];
    newItems[index][name] = name === "description" ? value : parseFloat(value) || 0;
    setInvoiceData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, price: 0 }]
    }));
  };

  const calculateSubtotal = () => invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const calculateTax = () => calculateSubtotal() * (invoiceData.taxRate / 100);

  const generatePDF = () => {
    const doc = new jsPDF();
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = subtotal + tax;
    const symbol = "₹";

    doc.setFontSize(20);
    doc.text("PROFORMA INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Proforma #: ${invoiceData.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${invoiceData.date}`, 20, 47);

    // Sender Details
    let senderY = 67;
    doc.text("Exporter:", 20, 60);
    doc.text(invoiceData.senderName || "Exporter Name", 20, senderY);
    senderY += 7;
    if (invoiceData.senderGstin) {
      doc.text(`GSTIN: ${invoiceData.senderGstin}`, 20, senderY);
      senderY += 7;
    }
    if (invoiceData.senderCin) {
      doc.text(`CIN: ${invoiceData.senderCin}`, 20, senderY);
      senderY += 7;
    }
    doc.text(invoiceData.senderAddress || "Address", 20, senderY);

    // Client Details
    let clientY = 67;
    doc.text("Importer / Bill To:", 120, 60);
    doc.text(invoiceData.clientName || "Importer Name", 120, clientY);
    clientY += 7;
    if (invoiceData.clientGstin) {
      doc.text(`GSTIN: ${invoiceData.clientGstin}`, 120, clientY);
      clientY += 7;
    }
    doc.text(invoiceData.clientAddress || "Address", 120, clientY);

    const tableData = invoiceData.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${symbol}${item.price.toFixed(2)}`,
      `${symbol}${(item.quantity * item.price).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: Math.max(senderY, clientY) + 10,
      head: [["Description", "Qty", "Unit Price", "Amount"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillGray: [240, 240, 240], textColor: [0, 0, 0] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${symbol}${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`GST (${invoiceData.taxRate}%): ${symbol}${tax.toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.text(`Total Estimate: ${symbol}${total.toFixed(2)}`, 140, finalY + 17);

    // Branding
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Created with Dabby", pageWidth - 45, pageHeight - 10);
    doc.addImage("/dabby-logo.svg", "SVG", pageWidth - 15, pageHeight - 15, 10, 10);

    doc.save(`Proforma_Invoice_${invoiceData.invoiceNumber}.pdf`);
  };

  const generateWord = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = subtotal + tax;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "PROFORMA INVOICE",
                bold: true,
                size: 40,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Proforma #: ${invoiceData.invoiceNumber}`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date: ${invoiceData.date}` }),
            ],
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Exporter:", bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: invoiceData.senderName || "Exporter Name" })] }),
                      new Paragraph({ children: [new TextRun({ text: invoiceData.senderGstin ? `GSTIN: ${invoiceData.senderGstin}` : "" })] }),
                      new Paragraph({ children: [new TextRun({ text: invoiceData.senderCin ? `CIN: ${invoiceData.senderCin}` : "" })] }),
                      new Paragraph({ children: [new TextRun({ text: invoiceData.senderAddress || "Address" })] }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Importer / Bill To:", bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: invoiceData.clientName || "Importer Name" })] }),
                      new Paragraph({ children: [new TextRun({ text: invoiceData.clientGstin ? `GSTIN: ${invoiceData.clientGstin}` : "" })] }),
                      new Paragraph({ children: [new TextRun({ text: invoiceData.clientAddress || "Address" })] }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { before: 400, after: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Qty", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Unit Price", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount", bold: true })] })] }),
                ],
              }),
              ...invoiceData.items.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: item.description })] }),
                  new TableCell({ children: [new Paragraph({ text: item.quantity.toString() })] }),
                  new TableCell({ children: [new Paragraph({ text: `₹${item.price.toFixed(2)}` })] }),
                  new TableCell({ children: [new Paragraph({ text: `₹${(item.quantity * item.price).toFixed(2)}` })] }),
                ],
              })),
            ],
          }),
          new Paragraph({ text: "", spacing: { before: 400 } }),
          new Paragraph({
            children: [new TextRun({ text: `Subtotal: ₹${subtotal.toFixed(2)}` })],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [new TextRun({ text: `GST (${invoiceData.taxRate}%): ₹${tax.toFixed(2)}` })],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Total Estimate: ₹${total.toFixed(2)}`, bold: true, size: 28 })],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Created with Dabby", color: "999999", size: 16 }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Proforma_Invoice_${invoiceData.invoiceNumber}.docx`);
    });
  };

  return (
    <div className={`min-h-screen py-24 px-6 md:px-12 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto">
        <Link to="/templates" className="flex items-center gap-2 text-[#81E6D9] mb-8 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to Templates</Link>
        <div className={`rounded-3xl border p-8 md:p-12 ${theme === "dark" ? "bg-[#111] border-white/10" : "bg-white border-gray-200 shadow-xl"}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-3xl font-bold">Proforma Invoice Generator</h1>
              <p className="text-sm opacity-60 mt-2">Generate GST-compliant proforma invoices for India</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 bg-[#81E6D9] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#71d6c9] transition-all transform hover:scale-105 shadow-lg"
              >
                <Download className="w-5 h-5" /> Download <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showExportMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border z-10 overflow-hidden ${
                  theme === "dark" ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
                }`}>
                  <button
                    onClick={() => {
                      generatePDF();
                      setShowExportMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      theme === "dark" ? "hover:bg-white/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <span className="text-red-500 font-bold text-xs">PDF</span>
                    </div>
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      generateWord();
                      setShowExportMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-t ${
                      theme === "dark" ? "hover:bg-white/5 border-white/10" : "hover:bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-500 font-bold text-xs">DOC</span>
                    </div>
                    <span>Download Word</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Invoice Details</h2>
              <input type="text" name="invoiceNumber" placeholder="Proforma Number" value={invoiceData.invoiceNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="date" name="date" value={invoiceData.date} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">GST (%)</h2>
              <input type="number" name="taxRate" value={invoiceData.taxRate} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Exporter</h2>
              <input type="text" name="senderName" placeholder="Business Name" value={invoiceData.senderName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="text" name="senderGstin" placeholder="Your GSTIN" value={invoiceData.senderGstin} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="text" name="senderCin" placeholder="Your CIN (Optional)" value={invoiceData.senderCin} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <textarea name="senderAddress" placeholder="Address" value={invoiceData.senderAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Importer</h2>
              <input type="text" name="clientName" placeholder="Client Name" value={invoiceData.clientName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="text" name="clientGstin" placeholder="Client GSTIN" value={invoiceData.clientGstin} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <textarea name="clientAddress" placeholder="Address" value={invoiceData.clientAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
          </div>
          <div className="mb-12">
            <h2 className="text-lg font-semibold border-b pb-4 mb-6">Items (INR)</h2>
            <div className="space-y-4">
              {invoiceData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="col-span-full md:col-span-6"><input type="text" name="description" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} /></div>
                  <div className="col-span-full md:col-span-2"><input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} /></div>
                  <div className="col-span-full md:col-span-3"><input type="number" name="price" placeholder="Price (₹)" value={item.price} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} /></div>
                  <div className="col-span-full md:col-span-1 pb-3 text-center"><button onClick={() => setInvoiceData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))} className="text-red-500 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button></div>
                </div>
              ))}
              <button onClick={addItem} className="text-[#81E6D9] font-semibold flex items-center gap-2 hover:underline transition-all"><Plus className="w-4 h-4" /> Add Item</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
