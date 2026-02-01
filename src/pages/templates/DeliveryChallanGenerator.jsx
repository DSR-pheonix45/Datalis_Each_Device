import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export default function DeliveryChallanGenerator() {
  const { theme } = useTheme();
  const [challanData, setChallanData] = useState({
    challanNumber: "DC-001",
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: "",
    senderName: "",
    senderGstin: "",
    senderCin: "",
    senderAddress: "",
    receiverName: "",
    receiverGstin: "",
    receiverAddress: "",
    items: [{ description: "", quantity: 1, unit: "pcs" }],
    notes: "",
  });

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallanData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...challanData.items];
    newItems[index][name] = name === "quantity" ? parseFloat(value) || 0 : value;
    setChallanData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setChallanData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit: "pcs" }]
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const primaryColor = [0, 71, 171]; // Royal Blue

    // Header Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY CHALLAN", 105, 25, { align: "center" });

    // Document Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Challan #:`, 20, 55);
    doc.setFont("helvetica", "normal");
    doc.text(challanData.challanNumber, 45, 55);

    doc.setFont("helvetica", "bold");
    doc.text(`Date:`, 20, 62);
    doc.setFont("helvetica", "normal");
    doc.text(challanData.date, 45, 62);

    doc.setFont("helvetica", "bold");
    doc.text(`Vehicle #:`, 20, 69);
    doc.setFont("helvetica", "normal");
    doc.text(challanData.vehicleNumber || "N/A", 45, 69);

    // Section Headers
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 80, 80, 8, 'F');
    doc.rect(110, 80, 80, 8, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text("FROM (CONSIGNOR)", 25, 86);
    doc.text("TO (CONSIGNEE)", 115, 86);

    // Details
    doc.setFont("helvetica", "normal");
    let senderY = 95;
    doc.text(challanData.senderName || "Sender Name", 20, senderY);
    senderY += 6;
    if (challanData.senderGstin) {
      doc.text(`GSTIN: ${challanData.senderGstin}`, 20, senderY);
      senderY += 6;
    }
    if (challanData.senderCin) {
      doc.text(`CIN: ${challanData.senderCin}`, 20, senderY);
      senderY += 6;
    }
    const senderAddrLines = doc.splitTextToSize(challanData.senderAddress || "Address", 80);
    doc.text(senderAddrLines, 20, senderY);
    senderY += (senderAddrLines.length * 6);

    let receiverY = 95;
    doc.text(challanData.receiverName || "Receiver Name", 110, receiverY);
    receiverY += 6;
    if (challanData.receiverGstin) {
      doc.text(`GSTIN: ${challanData.receiverGstin}`, 110, receiverY);
      receiverY += 6;
    }
    const receiverAddrLines = doc.splitTextToSize(challanData.receiverAddress || "Address", 80);
    doc.text(receiverAddrLines, 110, receiverY);
    receiverY += (receiverAddrLines.length * 6);

    const tableStartY = Math.max(senderY, receiverY) + 10;

    const tableData = challanData.items.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["Description of Goods", "Quantity", "Unit"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: 'F', fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    
    // Signatures
    doc.setDrawColor(200, 200, 200);
    doc.line(20, finalY, 70, finalY);
    doc.line(140, finalY, 190, finalY);
    
    doc.setFontSize(10);
    doc.text("Receiver's Signature", 45, finalY + 7, { align: "center" });
    doc.text("Authorized Signatory", 165, finalY + 7, { align: "center" });

    // Footer Branding
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Professional Document Generated via Dabby", pageWidth / 2, pageHeight - 10, { align: "center" });

    doc.save(`Delivery_Challan_${challanData.challanNumber}.pdf`);
  };

  const generateWord = () => {
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
                          new TextRun({ text: "DELIVERY CHALLAN", bold: true, size: 48, color: "FFFFFF" }),
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
                      new Paragraph({ children: [new TextRun({ text: "Challan #: ", bold: true }), new TextRun({ text: challanData.challanNumber })] }),
                      new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun({ text: challanData.date })] }),
                      new Paragraph({ children: [new TextRun({ text: "Vehicle #: ", bold: true }), new TextRun({ text: challanData.vehicleNumber || "N/A" })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 400 } }),

          // From/To
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F2F2F2" },
                    children: [new Paragraph({ children: [new TextRun({ text: "FROM (CONSIGNOR)", bold: true, size: 20 })] })],
                    margins: { left: 100, top: 100, bottom: 100 },
                  }),
                  new TableCell({
                    shading: { fill: "F2F2F2" },
                    children: [new Paragraph({ children: [new TextRun({ text: "TO (CONSIGNEE)", bold: true, size: 20 })] })],
                    margins: { left: 100, top: 100, bottom: 100 },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: challanData.senderName || "Sender Name", bold: true })] }),
                      ...(challanData.senderGstin ? [new Paragraph({ text: `GSTIN: ${challanData.senderGstin}` })] : []),
                      ...(challanData.senderCin ? [new Paragraph({ text: `CIN: ${challanData.senderCin}` })] : []),
                      new Paragraph({ text: challanData.senderAddress || "Address" }),
                    ],
                    borders: BorderStyle.NONE,
                    margins: { top: 200, bottom: 200, left: 100 },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: challanData.receiverName || "Receiver Name", bold: true })] }),
                      ...(challanData.receiverGstin ? [new Paragraph({ text: `GSTIN: ${challanData.receiverGstin}` })] : []),
                      new Paragraph({ text: challanData.receiverAddress || "Address" }),
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
                  new TableCell({ shading: { fill: "0047AB" }, children: [new Paragraph({ children: [new TextRun({ text: "Description of Goods", bold: true, color: "FFFFFF" })] })] }),
                  new TableCell({ shading: { fill: "0047AB" }, children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true, color: "FFFFFF" })] })], alignment: AlignmentType.CENTER }),
                  new TableCell({ shading: { fill: "0047AB" }, children: [new Paragraph({ children: [new TextRun({ text: "Unit", bold: true, color: "FFFFFF" })] })], alignment: AlignmentType.CENTER }),
                ],
              }),
              ...challanData.items.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: item.description })], margins: { left: 100, top: 100, bottom: 100 } }),
                  new TableCell({ children: [new Paragraph({ text: item.quantity.toString(), alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
                  new TableCell({ children: [new Paragraph({ text: item.unit, alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
                ],
              })),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 800 } }),

          // Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BorderStyle.NONE,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "Receiver's Signature", alignment: AlignmentType.CENTER }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ text: "__________________________", alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "Authorized Signatory", alignment: AlignmentType.CENTER }),
                    ],
                  }),
                ],
              }),
            ],
          }),

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
      saveAs(blob, `Delivery_Challan_${challanData.challanNumber}.docx`);
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
        <div className={`rounded-3xl border p-8 md:p-12 ${theme === "dark" ? "bg-[#111] border-white/10" : "bg-white border-gray-200 shadow-xl"}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-3xl font-bold">Delivery Challan Generator</h1>
              <p className="text-sm opacity-60 mt-2">Generate GST-compliant transport documents for India</p>
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
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Challan Details</h2>
              <input type="text" name="challanNumber" placeholder="Challan Number" value={challanData.challanNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="date" name="date" value={challanData.date} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="text" name="vehicleNumber" placeholder="Vehicle Number" value={challanData.vehicleNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Consignor (From)</h2>
              <div className="space-y-4">
                <input type="text" name="senderName" placeholder="Consignor Name" value={challanData.senderName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
                <input type="text" name="senderGstin" placeholder="Consignor GSTIN" value={challanData.senderGstin} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
                <input type="text" name="senderCin" placeholder="Consignor CIN (Optional)" value={challanData.senderCin} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
                <textarea name="senderAddress" placeholder="Consignor Address" value={challanData.senderAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Consignee (To)</h2>
              <input type="text" name="receiverName" placeholder="Consignee Name" value={challanData.receiverName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="text" name="receiverGstin" placeholder="Consignee GSTIN" value={challanData.receiverGstin} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <textarea name="receiverAddress" placeholder="Consignee Address" value={challanData.receiverAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-lg font-semibold border-b pb-4 mb-6">Goods Details</h2>
            <div className="space-y-4">
              {challanData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="col-span-full md:col-span-7">
                    <input type="text" name="description" placeholder="Description of Goods" value={item.description} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
                  </div>
                  <div className="col-span-full md:col-span-2">
                    <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
                  </div>
                  <div className="col-span-full md:col-span-2">
                    <input type="text" name="unit" placeholder="Unit" value={item.unit} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
                  </div>
                  <div className="col-span-full md:col-span-1 pb-3 text-center">
                    <button onClick={() => setChallanData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))} className="text-red-500 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="text-[#81E6D9] font-semibold flex items-center gap-2 hover:underline transition-all"><Plus className="w-4 h-4" /> Add Good</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
