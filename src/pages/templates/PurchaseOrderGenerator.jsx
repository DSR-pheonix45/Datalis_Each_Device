import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2, Globe, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export default function PurchaseOrderGenerator() {
  const { theme } = useTheme();
  const [poData, setPoData] = useState({
    poNumber: "PO-001",
    date: new Date().toISOString().split('T')[0],
    deliveryDate: "",
    senderName: "",
    senderEmail: "",
    senderAddress: "",
    senderGstin: "",
    senderCin: "",
    vendorName: "",
    vendorEmail: "",
    vendorAddress: "",
    vendorGstin: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: "",
    taxRate: 18,
  });

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPoData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...poData.items];
    newItems[index][name] = name === "description" ? value : parseFloat(value) || 0;
    setPoData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setPoData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    const newItems = poData.items.filter((_, i) => i !== index);
    setPoData(prev => ({ ...prev, items: newItems }));
  };

  const calculateSubtotal = () => {
    return poData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (poData.taxRate / 100);
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

    doc.setFontSize(20);
    doc.text("PURCHASE ORDER", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`PO #: ${poData.poNumber}`, 20, 40);
    doc.text(`Date: ${poData.date}`, 20, 47);
    if (poData.deliveryDate) doc.text(`Delivery Date: ${poData.deliveryDate}`, 20, 54);

    // Ship To Details
    doc.setFontSize(11);
    doc.text("Ship To:", 20, 75);
    doc.setFontSize(10);
    let currentY = 82;
    doc.text(poData.senderName || "Your Company", 20, currentY);
    currentY += 7;
    doc.text(poData.senderEmail || "your@email.com", 20, currentY);
    currentY += 7;
    
    if (poData.senderGstin) { doc.text(`GSTIN: ${poData.senderGstin}`, 20, currentY); currentY += 7; }
    if (poData.senderCin) { doc.text(`CIN: ${poData.senderCin}`, 20, currentY); currentY += 7; }
    
    doc.text(poData.senderAddress || "Your Address", 20, currentY);

    // Vendor Details
    doc.setFontSize(11);
    doc.text("Vendor:", 120, 75);
    doc.setFontSize(10);
    currentY = 82;
    doc.text(poData.vendorName || "Vendor Name", 120, currentY);
    currentY += 7;
    doc.text(poData.vendorEmail || "vendor@email.com", 120, currentY);
    currentY += 7;
    
    if (poData.vendorGstin) {
      doc.text(`GSTIN: ${poData.vendorGstin}`, 120, currentY); currentY += 7;
    }
    
    doc.text(poData.vendorAddress || "Vendor Address", 120, currentY);

    const tableData = poData.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${symbol}${item.price.toFixed(2)}`,
      `${symbol}${(item.quantity * item.price).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: currentY + 15,
      head: [["Description", "Quantity", "Price", "Total"]],
      body: tableData,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${symbol}${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`GST (${poData.taxRate}%): ${symbol}${tax.toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.text(`Total: ${symbol}${total.toFixed(2)}`, 140, finalY + 16);

    if (poData.notes) {
      doc.setFontSize(10);
      doc.text("Terms & Instructions:", 20, finalY + 30);
      doc.text(poData.notes, 20, finalY + 37);
    }

    // Add Branding
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text("Created with Dabby", pageWidth - 50, pageHeight - 10);

    doc.save(`PO_${poData.poNumber}.pdf`);
  };

  const generateWord = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = calculateTotal();

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "PURCHASE ORDER",
                bold: true,
                size: 40,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `PO #: ${poData.poNumber}`, bold: true }),
              new TextRun({ text: `\tDate: ${poData.date}`, bold: true }),
            ],
            spacing: { after: 200 },
          }),
          ...(poData.deliveryDate ? [
            new Paragraph({
              children: [new TextRun({ text: `Expected Delivery: ${poData.deliveryDate}`, bold: true })],
              spacing: { after: 200 },
            })
          ] : []),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Ship To:", bold: true })] }),
                      new Paragraph({ text: poData.senderName || "Your Company" }),
                      new Paragraph({ text: poData.senderEmail || "your@email.com" }),
                      ...(poData.senderGstin ? [new Paragraph({ text: `GSTIN: ${poData.senderGstin}` })] : []),
                      ...(poData.senderCin ? [new Paragraph({ text: `CIN: ${poData.senderCin}` })] : []),
                      new Paragraph({ text: poData.senderAddress || "Your Address" }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Vendor:", bold: true })] }),
                      new Paragraph({ text: poData.vendorName || "Vendor Name" }),
                      new Paragraph({ text: poData.vendorEmail || "vendor@email.com" }),
                      ...(poData.vendorGstin ? [new Paragraph({ text: `GSTIN: ${poData.vendorGstin}` })] : []),
                      new Paragraph({ text: poData.vendorAddress || "Vendor Address" }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Description", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Quantity", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Price (₹)", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Total (₹)", bold: true })] }),
                ],
              }),
              ...poData.items.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: item.description })] }),
                  new TableCell({ children: [new Paragraph({ text: item.quantity.toString() })] }),
                  new TableCell({ children: [new Paragraph({ text: item.price.toFixed(2) })] }),
                  new TableCell({ children: [new Paragraph({ text: (item.quantity * item.price).toFixed(2) })] }),
                ],
              })),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400 } }),

          new Paragraph({
            children: [
              new TextRun({ text: `Subtotal: ₹${subtotal.toFixed(2)}` }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `GST (${poData.taxRate}%): ₹${tax.toFixed(2)}` }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total Amount: ₹${total.toFixed(2)}`, bold: true, size: 28 }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200 },
          }),

          ...(poData.notes ? [
            new Paragraph({ text: "", spacing: { before: 400 } }),
            new Paragraph({ children: [new TextRun({ text: "Terms & Instructions:", bold: true })] }),
            new Paragraph({ text: poData.notes }),
          ] : []),

          new Paragraph({ text: "", spacing: { before: 400 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "Created with Dabby", color: "808080", size: 20 }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `PO_${poData.poNumber}.docx`);
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
              <h1 className="text-3xl font-bold mb-2">Purchase Order Generator</h1>
              <p className="text-sm opacity-70">Create professional purchase orders for your business</p>
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
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Order Details</h2>
              <div>
                <label className="block text-sm font-medium mb-1 opacity-70">PO Number</label>
                <input
                  type="text"
                  name="poNumber"
                  value={poData.poNumber}
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
                    value={poData.date}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-xl border ${
                      theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-70">Expected Delivery</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={poData.deliveryDate}
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
                  value={poData.taxRate}
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
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Ship To</h2>
              <input
                type="text"
                name="senderName"
                placeholder="Your Company Name"
                value={poData.senderName}
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
                  value={poData.senderGstin}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
                <input
                  type="text"
                  name="senderCin"
                  placeholder="CIN"
                  value={poData.senderCin}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              </div>

              <input
                type="email"
                name="senderEmail"
                placeholder="Contact Email"
                value={poData.senderEmail}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
              <textarea
                name="senderAddress"
                placeholder="Shipping Address"
                value={poData.senderAddress}
                onChange={handleInputChange}
                rows="3"
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Vendor</h2>
              <input
                type="text"
                name="vendorName"
                placeholder="Vendor Name"
                value={poData.vendorName}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />

              <input
                type="text"
                name="vendorGstin"
                placeholder="Vendor GST Number"
                value={poData.vendorGstin}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
              />

              <input
                type="email"
                name="vendorEmail"
                placeholder="Vendor Email"
                value={poData.vendorEmail}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
              <textarea
                name="vendorAddress"
                placeholder="Vendor Address"
                value={poData.vendorAddress}
                onChange={handleInputChange}
                rows="3"
                className={`w-full p-3 rounded-xl border ${
                  theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"
                }`}
              />
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-lg font-semibold border-b pb-4 mb-6">Items to Purchase</h2>
            <div className="space-y-4">
              {poData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-6">
                    <label className="block text-xs font-medium mb-1 opacity-70">Description</label>
                    <input
                      type="text"
                      name="description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, e)}
                      placeholder="Item description"
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
              <label className="block text-sm font-medium mb-2 opacity-70">Terms & Conditions</label>
              <textarea
                name="notes"
                placeholder="Payment terms, delivery instructions..."
                value={poData.notes}
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
                <span className="opacity-70">GST ({poData.taxRate}%)</span>
                <span>₹{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-[#81E6D9]">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
