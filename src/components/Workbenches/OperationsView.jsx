import React, { useState } from "react";
import { 
  BsShieldCheck, 
  BsPieChart, 
  BsLightningCharge,
  BsFileEarmarkPdf,
  BsClockHistory,
  BsCheckCircle,
  BsXCircle,
  BsExclamationTriangle,
  BsUpload,
  BsPlusLg,
  BsPeople
} from "react-icons/bs";
import Card from "../shared/Card";
import CreateRecordModal from "./CreateRecordModal";

// Sub-components for Operations
import OpsOverview from "./detail/OpsOverview";
import BudgetingView from "./detail/BudgetingView";
import ComplianceView from "./detail/ComplianceView";
import PartiesView from "./detail/PartiesView";

export default function OperationsView({ workbenchId }) {
  const [activeSubTab, setActiveSubTab] = useState("Ops");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const subTabs = [
    { id: "Compliance", icon: BsShieldCheck, label: "Compliance" },
    { id: "Budgeting", icon: BsPieChart, label: "Budgeting" },
    { id: "Parties", icon: BsPeople, label: "Parties" },
    { id: "Ops", icon: BsLightningCharge, label: "Ops" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Title and Description */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Operations</h2>
          <p className="text-gray-500 text-sm">Compliance, budgeting, and day-to-day finance operations</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-black rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-lg shadow-primary/20"
        >
          <BsPlusLg className="text-base" />
          <span>Create Record</span>
        </button>
      </div>

      <CreateRecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workbenchId={workbenchId}
        onSuccess={() => {
          // Trigger refresh of child components if needed
          window.dispatchEvent(new Event('refresh-workbench-data'));
        }}
      />

      {/* Sub-tabs Navigation */}
      <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all text-sm font-semibold ${
              activeSubTab === tab.id
                ? "bg-white/10 text-primary-300 shadow-lg border border-white/10"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <tab.icon className="text-base" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Content based on Sub-tab */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubTab === "Ops" && <OpsOverview workbenchId={workbenchId} />}
        {activeSubTab === "Budgeting" && <BudgetingView workbenchId={workbenchId} />}
        {activeSubTab === "Compliance" && <ComplianceView workbenchId={workbenchId} />}
        {activeSubTab === "Parties" && <PartiesView workbenchId={workbenchId} />}
      </div>
    </div>
  );
}
