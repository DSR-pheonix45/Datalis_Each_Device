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

    doc.setFontSize(20);
    doc.text("DELIVERY CHALLAN", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Challan #: ${challanData.challanNumber}`, 20, 40);
    doc.text(`Date: ${challanData.date}`, 20, 47);
    doc.text(`Vehicle #: ${challanData.vehicleNumber || "N/A"}`, 20, 54);

    // Sender Details
    let senderY = 77;
    doc.text("From (Consignor):", 20, 70);
    doc.text(challanData.senderName || "Sender Name", 20, senderY);
    senderY += 7;
    if (challanData.senderGstin) {
      doc.text(`GSTIN: ${challanData.senderGstin}`, 20, senderY);
      senderY += 7;
    }
    if (challanData.senderCin) {
      doc.text(`CIN: ${challanData.senderCin}`, 20, senderY);
      senderY += 7;
    }
    doc.text(challanData.senderAddress || "Address", 20, senderY);

    // Receiver Details
    let receiverY = 77;
    doc.text("To (Consignee):", 120, 70);
    doc.text(challanData.receiverName || "Receiver Name", 120, receiverY);
    receiverY += 7;
    if (challanData.receiverGstin) {
      doc.text(`GSTIN: ${challanData.receiverGstin}`, 120, receiverY);
      receiverY += 7;
    }
    doc.text(challanData.receiverAddress || "Address", 120, receiverY);

    const tableData = challanData.items.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit
    ]);

    autoTable(doc, {
      startY: Math.max(senderY, receiverY) + 10,
      head: [["Description of Goods", "Quantity", "Unit"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillGray: [240, 240, 240], textColor: [0, 0, 0] }
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.text("Receiver's Signature", 20, finalY);
    doc.text("Authorized Signatory", 140, finalY);

    doc.save(`Delivery_Challan_${challanData.challanNumber}.pdf`);
  };

  const generateWord = () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "DELIVERY CHALLAN",
                bold: true,
                size: 40,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Challan #: ${challanData.challanNumber}`, bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date: ${challanData.date}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Vehicle #: ${challanData.vehicleNumber || "N/A"}` }),
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
                      new Paragraph({ children: [new TextRun({ text: "From (Consignor):", bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: challanData.senderName || "Sender Name" })] }),
                      new Paragraph({ children: [new TextRun({ text: challanData.senderGstin ? `GSTIN: ${challanData.senderGstin}` : "" })] }),
                      new Paragraph({ children: [new TextRun({ text: challanData.senderCin ? `CIN: ${challanData.senderCin}` : "" })] }),
                      new Paragraph({ children: [new TextRun({ text: challanData.senderAddress || "Address" })] }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "To (Consignee):", bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: challanData.receiverName || "Receiver Name" })] }),
                      new Paragraph({ children: [new TextRun({ text: challanData.receiverGstin ? `GSTIN: ${challanData.receiverGstin}` : "" })] }),
                      new Paragraph({ children: [new TextRun({ text: challanData.receiverAddress || "Address" })] }),
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
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description of Goods", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Unit", bold: true })] })] }),
                ],
              }),
              ...challanData.items.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: item.description })] }),
                  new TableCell({ children: [new Paragraph({ text: item.quantity.toString() })] }),
                  new TableCell({ children: [new Paragraph({ text: item.unit })] }),
                ],
              })),
            ],
          }),
          new Paragraph({ text: "", spacing: { before: 800 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: "Receiver's Signature", alignment: AlignmentType.LEFT })],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Authorized Signatory", alignment: AlignmentType.RIGHT })],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              }),
            ],
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
