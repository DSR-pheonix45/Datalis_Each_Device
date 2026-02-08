import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import { 
  FileText, 
  ShoppingCart, 
  FileCheck, 
  Receipt, 
  Truck, 
  FileSpreadsheet,
  ArrowRight
} from "lucide-react";

const templates = [
  {
    id: "invoice",
    title: "Invoice Generator",
    description: "Create professional invoices with customizable templates for your business needs.",
    icon: <FileText className="w-10 h-10" />,
    color: "bg-blue-500",
    link: "/templates/invoice"
  },
  {
    id: "purchase-order",
    title: "Purchase Order Generator",
    description: "Easily create and manage purchase orders for streamlined procurement.",
    icon: <ShoppingCart className="w-10 h-10" />,
    color: "bg-pink-500",
    link: "/templates/purchase-order"
  },
  {
    id: "quotation",
    title: "Quotation Generator",
    description: "Quickly generate accurate quotations with detailed pricing and product information.",
    icon: <FileCheck className="w-10 h-10" />,
    color: "bg-cyan-500",
    link: "/templates/quotation"
  },
  {
    id: "gst-invoice",
    title: "GST Invoice Generator",
    description: "Generate GST-ready invoices with accurate tax calculations and professional formatting.",
    icon: <Receipt className="w-10 h-10" />,
    color: "bg-orange-500",
    link: "/templates/gst-invoice"
  },
  {
    id: "delivery-challan",
    title: "Delivery Challan Generator",
    description: "Simplify delivery documentation with a user-friendly delivery challan creation tool.",
    icon: <Truck className="w-10 h-10" />,
    color: "bg-green-500",
    link: "/templates/delivery-challan"
  },
  {
    id: "proforma-invoice",
    title: "Proforma Invoice Generator",
    description: "Generate detailed proforma invoices for cost estimation & transaction clarity.",
    icon: <FileSpreadsheet className="w-10 h-10" />,
    color: "bg-purple-500",
    link: "/templates/proforma-invoice"
  }
];

export default function Templates() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen py-24 px-6 md:px-12 ${
      theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Free Business Document Templates
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg max-w-2xl mx-auto ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Professional, ready-to-use templates for your daily business needs. 
            Generate and download as PDF or Word instantly.
          </motion.p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border p-8 flex flex-col items-center text-center transition-all duration-300 ${
                theme === "dark" 
                  ? "bg-[#111] border-white/10 hover:border-[#81E6D9]/50" 
                  : "bg-white border-gray-200 hover:shadow-xl hover:border-[#0D9488]/30"
              }`}
            >
              {/* Icon Container */}
              <div className={`w-20 h-24 rounded-xl flex items-center justify-center mb-6 relative shadow-lg ${
                theme === "dark" ? "bg-white/5" : "bg-gray-50"
              }`}>
                <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-xl ${template.color}`} />
                <div className={`${theme === "dark" ? "text-white" : "text-gray-700"}`}>
                  {template.icon}
                </div>
                {/* Visual lines like in the screenshot */}
                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <div className={`h-1 w-full rounded-full opacity-20 ${template.color}`} />
                  <div className={`h-1 w-2/3 rounded-full opacity-20 ${template.color}`} />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3">{template.title}</h3>
              <p className={`text-sm mb-8 flex-grow ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {template.description}
              </p>

              <Link
                to={template.link}
                className={`w-full py-3 px-6 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-200 border ${
                  theme === "dark"
                    ? "text-white border-white/20 hover:bg-white hover:text-black"
                    : "text-gray-900 border-gray-200 hover:bg-gray-900 hover:text-white"
                }`}
              >
                Create {template.title.split(" ")[0]} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 text-center p-12 rounded-3xl bg-gradient-to-br from-[#81E6D9]/10 to-transparent border border-[#81E6D9]/20"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Need more advanced financial tools?</h2>
          <p className={`mb-8 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Join Datalis to unlock AI-powered insights, real-time KPI tracking, and automated reporting.
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 py-4 text-base font-semibold text-black bg-[#81E6D9] rounded-full hover:bg-[#71d6c9] transition-all"
          >
            Get Started for Free
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
