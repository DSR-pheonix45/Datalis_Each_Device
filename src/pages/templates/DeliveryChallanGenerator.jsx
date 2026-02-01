import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function DeliveryChallanGenerator() {
  const { theme } = useTheme();
  const [challanData, setChallanData] = useState({
    challanNumber: "DC-001",
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: "",
    senderName: "",
    senderAddress: "",
    receiverName: "",
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

    doc.setFontSize(20);
    doc.text("DELIVERY CHALLAN", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Challan #: ${challanData.challanNumber}`, 20, 40);
    doc.text(`Date: ${challanData.date}`, 20, 47);
    doc.text(`Vehicle #: ${challanData.vehicleNumber || "N/A"}`, 20, 54);

    doc.text("From (Consignor):", 20, 70);
    doc.text(challanData.senderName || "Sender Name", 20, 77);
    doc.text(challanData.senderAddress || "Address", 20, 84);

    doc.text("To (Consignee):", 120, 70);
    doc.text(challanData.receiverName || "Receiver Name", 120, 77);
    doc.text(challanData.receiverAddress || "Address", 120, 84);

    const tableData = challanData.items.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit
    ]);

    doc.autoTable({
      startY: 100,
      head: [["Description of Goods", "Quantity", "Unit"]],
      body: tableData,
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
            <h1 className="text-3xl font-bold">Delivery Challan Generator</h1>
            <button onClick={generatePDF} className="flex items-center gap-2 bg-[#81E6D9] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#71d6c9]"><Download className="w-5 h-5" /> Download PDF</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Challan Details</h2>
              <input type="text" name="challanNumber" placeholder="Challan Number" value={challanData.challanNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
              <input type="date" name="date" value={challanData.date} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
              <input type="text" name="vehicleNumber" placeholder="Vehicle Number" value={challanData.vehicleNumber} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Addresses</h2>
              <input type="text" name="senderName" placeholder="Consignor Name" value={challanData.senderName} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
              <textarea name="senderAddress" placeholder="Consignor Address" value={challanData.senderAddress} onChange={handleInputChange} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
            </div>
          </div>
          <div className="mb-12">
            <h2 className="text-lg font-semibold border-b pb-4 mb-6">Goods Details</h2>
            <div className="space-y-4">
              {challanData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-7">
                    <input type="text" name="description" placeholder="Description of Goods" value={item.description} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
                  </div>
                  <div className="col-span-2">
                    <input type="text" name="unit" placeholder="Unit" value={item.unit} onChange={(e) => handleItemChange(index, e)} className={`w-full p-3 rounded-xl border ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`} />
                  </div>
                  <div className="col-span-1 pb-3">
                    <button onClick={() => setChallanData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))} className="text-red-500"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="text-[#81E6D9] font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Good</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
