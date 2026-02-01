import React, { useState } from "react";
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

export default function DeliveryChallanGenerator() {
  const { theme } = useTheme();
  const [region, setRegion] = useState("INDIA");
  const [challanData, setChallanData] = useState({
    challanNumber: "DC-001",
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: "",
    senderName: "",
    senderGstin: "",
    senderCin: "",
    senderEin: "",
    senderVatNumber: "",
    senderTrn: "",
    senderAddress: "",
    receiverName: "",
    receiverGstin: "",
    receiverCin: "",
    receiverEin: "",
    receiverVatNumber: "",
    receiverTrn: "",
    receiverAddress: "",
    items: [{ description: "", quantity: 1, unit: "pcs" }],
    notes: "",
  });

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
    const currentRegion = REGIONS[region];

    doc.setFontSize(20);
    doc.text("DELIVERY CHALLAN", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Challan #: ${challanData.challanNumber}`, 20, 40);
    doc.text(`Date: ${challanData.date}`, 20, 47);
    doc.text(`Vehicle #: ${challanData.vehicleNumber || "N/A"}`, 20, 54);
    doc.text(`Region: ${currentRegion.label}`, 20, 61);

    // Sender Details
    let senderY = 77;
    doc.text("From (Consignor):", 20, 70);
    doc.text(challanData.senderName || "Sender Name", 20, senderY);
    senderY += 7;
    currentRegion.fields.forEach(field => {
      const val = challanData[`sender${field.charAt(0).toUpperCase() + field.slice(1)}`];
      doc.text(`${field.toUpperCase()}: ${val || "N/A"}`, 20, senderY);
      senderY += 7;
    });
    doc.text(challanData.senderAddress || "Address", 20, senderY);

    // Receiver Details
    let receiverY = 77;
    doc.text("To (Consignee):", 120, 70);
    doc.text(challanData.receiverName || "Receiver Name", 120, receiverY);
    receiverY += 7;
    currentRegion.fields.forEach(field => {
      const val = challanData[`receiver${field.charAt(0).toUpperCase() + field.slice(1)}`];
      doc.text(`${field.toUpperCase()}: ${val || "N/A"}`, 120, receiverY);
      receiverY += 7;
    });
    doc.text(challanData.receiverAddress || "Address", 120, receiverY);

    const tableData = challanData.items.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit
    ]);

    doc.autoTable({
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
              <p className="text-sm opacity-60 mt-2">Generate transport documents for goods</p>
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
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Challan Details</h2>
              <input type="text" name="challanNumber" placeholder="Challan Number" value={challanData.challanNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="date" name="date" value={challanData.date} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              <input type="text" name="vehicleNumber" placeholder="Vehicle Number" value={challanData.vehicleNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Addresses</h2>
              <div className="space-y-4">
                <input type="text" name="senderName" placeholder="Consignor Name" value={challanData.senderName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
                {REGIONS[region].fields.map(field => (
                  <input
                    key={field}
                    type="text"
                    name={`sender${field.charAt(0).toUpperCase() + field.slice(1)}`}
                    placeholder={`Consignor ${field.toUpperCase()}`}
                    value={challanData[`sender${field.charAt(0).toUpperCase() + field.slice(1)}`]}
                    onChange={handleInputChange}
                    className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                  />
                ))}
                <textarea name="senderAddress" placeholder="Consignor Address" value={challanData.senderAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Receiver</h2>
              <input type="text" name="receiverName" placeholder="Consignee Name" value={challanData.receiverName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`} />
              {REGIONS[region].fields.map(field => (
                <input
                  key={field}
                  type="text"
                  name={`receiver${field.charAt(0).toUpperCase() + field.slice(1)}`}
                  placeholder={`Consignee ${field.toUpperCase()}`}
                  value={challanData[`receiver${field.charAt(0).toUpperCase() + field.slice(1)}`]}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200"}`}
                />
              ))}
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
