import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2, Globe } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const REGIONS = {
  INDIA: {
    label: "India",
    taxLabel: "GST",
    currency: "INR",
    symbol: "₹",
    fields: ["gstin", "cin"],
    defaultTax: 18
  },
  US: {
    label: "United States",
    taxLabel: "Sales Tax",
    currency: "USD",
    symbol: "$",
    fields: ["ein"],
    defaultTax: 0
  },
  EU: {
    label: "European Union",
    taxLabel: "VAT",
    currency: "EUR",
    symbol: "€",
    fields: ["vatNumber"],
    defaultTax: 20
  },
  MIDDLE_EAST: {
    label: "Middle East",
    taxLabel: "VAT",
    currency: "AED",
    symbol: "د.إ",
    fields: ["trn"],
    defaultTax: 5
  }
};

export default function PurchaseOrderGenerator() {
  const { theme } = useTheme();
  const [region, setRegion] = useState("INDIA");
  const [poData, setPoData] = useState({
    poNumber: "PO-001",
    date: new Date().toISOString().split('T')[0],
    deliveryDate: "",
    senderName: "",
    senderEmail: "",
    senderAddress: "",
    senderGstin: "",
    senderCin: "",
    senderEin: "",
    senderVat: "",
    senderTrn: "",
    vendorName: "",
    vendorEmail: "",
    vendorAddress: "",
    vendorGstin: "",
    vendorVat: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: "",
    taxRate: REGIONS.INDIA.defaultTax,
  });

  // Update tax rate when region changes
  useEffect(() => {
    setPoData(prev => ({
      ...prev,
      taxRate: REGIONS[region].defaultTax
    }));
  }, [region]);

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
    const currentRegion = REGIONS[region];

    doc.setFontSize(20);
    doc.text("PURCHASE ORDER", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`PO #: ${poData.poNumber}`, 20, 40);
    doc.text(`Date: ${poData.date}`, 20, 47);
    if (poData.deliveryDate) doc.text(`Delivery Date: ${poData.deliveryDate}`, 20, 54);
    doc.text(`Region: ${currentRegion.label}`, 20, 61);

    // Ship To Details
    doc.setFontSize(11);
    doc.text("Ship To:", 20, 75);
    doc.setFontSize(10);
    let currentY = 82;
    doc.text(poData.senderName || "Your Company", 20, currentY);
    currentY += 7;
    doc.text(poData.senderEmail || "your@email.com", 20, currentY);
    currentY += 7;
    
    // Add regional IDs for Ship To
    if (region === "INDIA") {
      if (poData.senderGstin) { doc.text(`GSTIN: ${poData.senderGstin}`, 20, currentY); currentY += 7; }
      if (poData.senderCin) { doc.text(`CIN: ${poData.senderCin}`, 20, currentY); currentY += 7; }
    } else if (region === "US" && poData.senderEin) {
      doc.text(`EIN: ${poData.senderEin}`, 20, currentY); currentY += 7;
    } else if (region === "EU" && poData.senderVat) {
      doc.text(`VAT: ${poData.senderVat}`, 20, currentY); currentY += 7;
    } else if (region === "MIDDLE_EAST" && poData.senderTrn) {
      doc.text(`TRN: ${poData.senderTrn}`, 20, currentY); currentY += 7;
    }
    
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
    
    if (region === "INDIA" && poData.vendorGstin) {
      doc.text(`GSTIN: ${poData.vendorGstin}`, 120, currentY); currentY += 7;
    } else if (region === "EU" && poData.vendorVat) {
      doc.text(`VAT: ${poData.vendorVat}`, 120, currentY); currentY += 7;
    }
    
    doc.text(poData.vendorAddress || "Vendor Address", 120, currentY);

    const tableData = poData.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${currentRegion.symbol}${item.price.toFixed(2)}`,
      `${currentRegion.symbol}${(item.quantity * item.price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: currentY + 15,
      head: [["Description", "Quantity", "Price", "Total"]],
      body: tableData,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${currentRegion.symbol}${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`${currentRegion.taxLabel} (${poData.taxRate}%): ${currentRegion.symbol}${tax.toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.text(`Total: ${currentRegion.symbol}${total.toFixed(2)}`, 140, finalY + 16);

    if (poData.notes) {
      doc.setFontSize(10);
      doc.text("Terms & Instructions:", 20, finalY + 30);
      doc.text(poData.notes, 20, finalY + 37);
    }

    doc.save(`PO_${poData.poNumber}.pdf`);
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
              <div className="flex items-center gap-2 text-sm opacity-70">
                <Globe className="w-4 h-4" />
                <span>Selected Region: {REGIONS[region].label}</span>
              </div>
            </div>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 bg-[#81E6D9] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#71d6c9] transition-all"
            >
              <Download className="w-5 h-5" /> Download PDF
            </button>
          </div>

          {/* Region Selection */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Select Region</h2>
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
                <label className="block text-sm font-medium mb-1 opacity-70">{REGIONS[region].taxLabel} Rate (%)</label>
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
                <p className="text-xs opacity-70">Currency for this region: <span className="font-bold text-[#81E6D9]">{REGIONS[region].currency} ({REGIONS[region].symbol})</span></p>
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
              
              {/* Regional Fields for Ship To */}
              {region === "INDIA" && (
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
              )}
              {region === "US" && (
                <input
                  type="text"
                  name="senderEin"
                  placeholder="EIN Number"
                  value={poData.senderEin}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              )}
              {region === "EU" && (
                <input
                  type="text"
                  name="senderVat"
                  placeholder="VAT Number"
                  value={poData.senderVat}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              )}
              {region === "MIDDLE_EAST" && (
                <input
                  type="text"
                  name="senderTrn"
                  placeholder="TRN Number"
                  value={poData.senderTrn}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              )}

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

              {/* Regional Fields for Vendor */}
              {region === "INDIA" && (
                <input
                  type="text"
                  name="vendorGstin"
                  placeholder="Vendor GST Number"
                  value={poData.vendorGstin}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              )}
              {region === "EU" && (
                <input
                  type="text"
                  name="vendorVat"
                  placeholder="Vendor VAT Number"
                  value={poData.vendorVat}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              )}

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
                    <label className="block text-xs font-medium mb-1 opacity-70">Price ({REGIONS[region].symbol})</label>
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
                <span>{REGIONS[region].symbol}{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">{REGIONS[region].taxLabel} ({poData.taxRate}%)</span>
                <span>{REGIONS[region].symbol}{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-[#81E6D9]">{REGIONS[region].symbol}{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
