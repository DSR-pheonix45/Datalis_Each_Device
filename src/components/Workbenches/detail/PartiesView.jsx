import React, { useState, useEffect, useCallback } from "react";
import { 
  BsBuilding, 
  BsPersonBadge, 
  BsCheckCircleFill, 
  BsXCircleFill,
  BsSearch,
  BsFilter,
  BsArrowRight
} from "react-icons/bs";
import Card from "../../shared/Card";
import { supabase } from "../../../lib/supabase";

export default function PartiesView({ workbenchId }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, customer, vendor, both
  const [searchQuery, setSearchQuery] = useState("");

  const fetchParties = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("workbench_parties")
        .select("*")
        .eq("workbench_id", workbenchId)
        .order("name");

      if (error) throw error;
      setParties(data || []);
    } catch (err) {
      console.error("Error fetching parties:", err);
    } finally {
      setLoading(false);
    }
  }, [workbenchId]);

  useEffect(() => {
    fetchParties();
    
    window.addEventListener('refresh-workbench-data', fetchParties);
    return () => window.removeEventListener('refresh-workbench-data', fetchParties);
  }, [workbenchId, fetchParties]);

  const filteredParties = parties.filter(party => {
    const matchesSearch = party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (party.gstin && party.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filter === "all") return matchesSearch;
    return matchesSearch && (party.party_type === filter || party.party_type === "both");
  });

  const getPartyTypeLabel = (type) => {
    switch (type) {
      case 'customer': return { label: 'Customer', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
      case 'vendor': return { label: 'Vendor', color: 'text-amber-400', bg: 'bg-amber-400/10' };
      case 'both': return { label: 'Both', color: 'text-purple-400', bg: 'bg-purple-400/10' };
      default: return { label: type, color: 'text-gray-400', bg: 'bg-gray-400/10' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Parties & Entities</h3>
          <p className="text-gray-500 text-xs">Manage your customers, vendors, and business relationships</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input 
              type="text"
              placeholder="Search by name or GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/30 w-64"
            />
          </div>
          
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
            {["all", "customer", "vendor"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  filter === f 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card variant="dark" className="border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Entity Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tax Identifiers</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Loading parties...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
                    {searchQuery ? "No parties match your search" : "No parties found. Create one to get started."}
                  </td>
                </tr>
              ) : (
                filteredParties.map((party) => {
                  const typeInfo = getPartyTypeLabel(party.party_type);
                  return (
                    <tr key={party.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${typeInfo.bg} ${typeInfo.color}`}>
                            <BsBuilding className="text-base" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">
                              {party.name}
                            </div>
                            <div className="text-[10px] text-gray-500 font-medium">
                              Created {new Date(party.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeInfo.bg} ${typeInfo.color} border border-white/5`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {party.gstin && (
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[9px] font-bold text-gray-600 uppercase">GST</span>
                              <span className="text-[11px] font-mono text-gray-400">{party.gstin}</span>
                            </div>
                          )}
                          {party.pan && (
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[9px] font-bold text-gray-600 uppercase">PAN</span>
                              <span className="text-[11px] font-mono text-gray-400">{party.pan}</span>
                            </div>
                          )}
                          {!party.gstin && !party.pan && <span className="text-xs text-gray-600 italic">Not provided</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {party.is_active ? (
                            <>
                              <BsCheckCircleFill className="text-emerald-500 text-xs" />
                              <span className="text-xs text-emerald-500/80 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <BsXCircleFill className="text-gray-600 text-xs" />
                              <span className="text-xs text-gray-600 font-medium">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                          <BsArrowRight className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
