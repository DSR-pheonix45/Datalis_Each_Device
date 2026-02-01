import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2, Globe } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const REGIONS = {
  INDIA: { label: "India", taxLabel: "GST", currency: "INR", symbol: "₹", fields: ["gstin", "cin"], defaultTax: 18 },
  US: { label: "United States", taxLabel: "Sales Tax", currency: "USD", symbol: "$", fields: ["ein"], defaultTax: 0 },
  EU: { label: "European Union", taxLabel: "VAT", currency: "EUR", symbol: "€", fields: ["vatNumber"], defaultTax: 20 },
  MIDDLE_EAST: { label: "Middle East", taxLabel: "VAT", currency: "AED", symbol: "د.إ", fields: ["trn"], defaultTax: 5 }
};

export default function ProformaInvoiceGenerator() {
  const { theme } = useTheme();
  const [region, setRegion] = useState("INDIA");
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "PI-001",
    date: new Date().toISOString().split('T')[0],
    senderName: "",
    senderGstin: "",
    senderCin: "",
    senderEin: "",
    senderVatNumber: "",
    senderTrn: "",
    senderAddress: "",
    clientName: "",
    clientGstin: "",
    clientCin: "",
    clientEin: "",
    clientVatNumber: "",
    clientTrn: "",
    clientAddress: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: "",
    taxRate: 18,
  });

  useEffect(() => {
    setInvoiceData(prev => ({
      ...prev,
      taxRate: REGIONS[region].defaultTax
    }));
  }, [region]);

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
    const currentRegion = REGIONS[region];
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = subtotal + tax;

    doc.setFontSize(20);
    doc.text("PROFORMA INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Proforma #: ${invoiceData.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${invoiceData.date}`, 20, 47);
    doc.text(`Region: ${currentRegion.label}`, 20, 54);

    // Sender Details
    let senderY = 67;
    doc.text("Exporter:", 20, 60);
    doc.text(invoiceData.senderName || "Exporter Name", 20, senderY);
    senderY += 7;
    currentRegion.fields.forEach(field => {
      const val = invoiceData[`sender${field.charAt(0).toUpperCase() + field.slice(1)}`];
      doc.text(`${field.toUpperCase()}: ${val || "N/A"}`, 20, senderY);
      senderY += 7;
    });
    doc.text(invoiceData.senderAddress || "Address", 20, senderY);

    // Client Details
    let clientY = 67;
    doc.text("Importer / Bill To:", 120, 60);
    doc.text(invoiceData.clientName || "Importer Name", 120, clientY);
    clientY += 7;
    currentRegion.fields.forEach(field => {
      const val = invoiceData[`client${field.charAt(0).toUpperCase() + field.slice(1)}`];
      doc.text(`${field.toUpperCase()}: ${val || "N/A"}`, 120, clientY);
      clientY += 7;
    });
    doc.text(invoiceData.clientAddress || "Address", 120, clientY);

    const tableData = invoiceData.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${currentRegion.symbol}${item.price.toFixed(2)}`,
      `${currentRegion.symbol}${(item.quantity * item.price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: Math.max(senderY, clientY) + 10,
      head: [["Description", "Qty", "Unit Price", "Amount"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillGray: [240, 240, 240], textColor: [0, 0, 0] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${currentRegion.symbol}${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`${currentRegion.taxLabel} (${invoiceData.taxRate}%): ${currentRegion.symbol}${tax.toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.text(`Total Estimate: ${currentRegion.symbol}${total.toFixed(2)}`, 140, finalY + 17);

    doc.save(`Proforma_Invoice_${invoiceData.invoiceNumber}.pdf`);
  };

  return (
    <div className={`min-h-screen py-24 px-6 md:px-12 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto">
        <Link to="/templates" className="flex items-center gap-2 text-[#81E6D9] mb-8 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to Templates</Link>
        <div className={`rounded-3xl border p-8 md:p-12 ${theme === "dark" ? "bg-[#111] border-white/10" : "bg-white border-gray-200 shadow-xl"}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-3xl font-bold">Proforma Invoice Generator</h1>
              <p className="text-sm opacity-60 mt-2">Generate international proforma invoices</p>
            </div>
            <button onClick={generatePDF} className="flex items-center gap-2 bg-[#81E6D9] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#71d6c9] transition-all transform hover:scale-105 shadow-lg"><Download className="w-5 h-5" /> Download PDF</button>
          </div>

          {/* Region Selection */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-[#81E6D9]" /> Select Region
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(REGIONS).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setRegion(key)}
                  className={`p-4 rounded-2xl border transition-all text-sm font-medium ${
                    region === key
                      ? "border-[#81E6D9] bg-[#81E6D9]/10 text-[#81E6D9]"
                      : theme === "dark"
                      ? "border-white/10 bg-white/5 hover:border-white/30"
                      : "border-gray-200 bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  {value.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Invoice Details</h2>
              <input type="text" name="invoiceNumber" placeholder="Proforma Number" value={invoiceData.invoiceNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="date" name="date" value={invoiceData.date} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">{REGIONS[region].taxLabel} (%)</h2>
              <input type="number" name="taxRate" value={invoiceData.taxRate} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Exporter</h2>
              <input type="text" name="senderName" placeholder="Business Name" value={invoiceData.senderName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              
              {REGIONS[region].fields.map(field => (
                <input
                  key={field}
                  type="text"
                  name={`sender${field.charAt(0).toUpperCase() + field.slice(1)}`}
                  placeholder={`Your ${field.toUpperCase()}`}
                  value={invoiceData[`sender${field.charAt(0).toUpperCase() + field.slice(1)}`]}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              ))}

              <textarea name="senderAddress" placeholder="Address" value={invoiceData.senderAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Importer</h2>
              <input type="text" name="clientName" placeholder="Client Name" value={invoiceData.clientName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              
              {REGIONS[region].fields.map(field => (
                <input
                  key={field}
                  type="text"
                  name={`client${field.charAt(0).toUpperCase() + field.slice(1)}`}
                  placeholder={`Client ${field.toUpperCase()}`}
                  value={invoiceData[`client${field.charAt(0).toUpperCase() + field.slice(1)}`]}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              ))}

              <textarea name="clientAddress" placeholder="Address" value={invoiceData.clientAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
          </div>
          <div className="mb-12">
            <h2 className="text-lg font-semibold border-b pb-4 mb-6">Items ({REGIONS[region].currency})</h2>
            <div className="space-y-4">
              {invoiceData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="col-span-full md:col-span-6"><input type="text" name="description" placeholder="Description" value={item.description} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} /></div>
                  <div className="col-span-full md:col-span-2"><input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} /></div>
                  <div className="col-span-full md:col-span-3"><input type="number" name="price" placeholder={`Price (${REGIONS[region].symbol})`} value={item.price} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} /></div>
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
