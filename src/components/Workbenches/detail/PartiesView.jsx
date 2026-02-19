import React, { useState, useEffect, useCallback } from "react";
import { 
  BsBuilding, 
  BsPersonBadge, 
  BsCheckCircleFill, 
  BsXCircleFill,
  BsSearch,
  BsFilter,
  BsArrowRight,
  BsGraphUp,
  BsGraphDown,
  BsShieldExclamation
} from "react-icons/bs";
import Card from "../../shared/Card";
import { supabase } from "../../../lib/supabase";
import { intelligenceService } from "../../../services/intelligenceService";

export default function PartiesView({ workbenchId }) {
  const [parties, setParties] = useState([]);
  const [metrics, setMetrics] = useState({
    vendorSpend: 0,
    customerRevenue: 0,
    dependencyRisk: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, customer, vendor, both
  const [searchQuery, setSearchQuery] = useState("");
  
  // Expandable row state
  const [expandedPartyId, setExpandedPartyId] = useState(null);
  const [partyAccounts, setPartyAccounts] = useState({});
  const [loadingAccounts, setLoadingAccounts] = useState({});

  const fetchPartyAccounts = async (partyId) => {
    if (partyAccounts[partyId]) return; // Already loaded

    try {
      setLoadingAccounts(prev => ({ ...prev, [partyId]: true }));
      const { data, error } = await supabase
        .from('party_accounts')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPartyAccounts(prev => ({ ...prev, [partyId]: data || [] }));
    } catch (err) {
      console.error("Error fetching party accounts:", err);
    } finally {
      setLoadingAccounts(prev => ({ ...prev, [partyId]: false }));
    }
  };

  const toggleExpand = (partyId) => {
    if (expandedPartyId === partyId) {
      setExpandedPartyId(null);
    } else {
      setExpandedPartyId(partyId);
      fetchPartyAccounts(partyId);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [partiesData, metricsData] = await Promise.all([
        supabase
          .from("workbench_parties")
          .select("*")
          .eq("workbench_id", workbenchId)
          .order("name"),
        intelligenceService.getPartyMetrics(workbenchId)
      ]);

      if (partiesData.error) throw partiesData.error;
      setParties(partiesData.data || []);

      if (metricsData) {
        const totalVendorSpend = Object.values(metricsData.vendorSpend || {}).reduce((a, b) => a + b, 0);
        const totalCustomerRevenue = Object.values(metricsData.customerRevenue || {}).reduce((a, b) => a + b, 0);
        
        setMetrics({
          vendorSpend: totalVendorSpend,
          customerRevenue: totalCustomerRevenue,
          dependencyRisk: metricsData.dependencyRisk
        });
      }
    } catch (err) {
      console.error("Error fetching parties data:", err);
    } finally {
      setLoading(false);
    }
  }, [workbenchId]);

  useEffect(() => {
    fetchData();
    
    window.addEventListener('refresh-workbench-data', fetchData);
    return () => window.removeEventListener('refresh-workbench-data', fetchData);
  }, [workbenchId, fetchData]);

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

  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="dark" className="border-white/5 p-6 flex items-center justify-between group hover:border-white/10 transition-all">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Vendor Spend</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.vendorSpend)}</div>
            <div className="text-xs text-red-400 mt-1 flex items-center">
              <BsGraphDown className="mr-1" /> Total Outflow
            </div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
            <BsBuilding className="text-xl" />
          </div>
        </Card>

        <Card variant="dark" className="border-white/5 p-6 flex items-center justify-between group hover:border-white/10 transition-all">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Customer Revenue</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.customerRevenue)}</div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center">
              <BsGraphUp className="mr-1" /> Total Inflow
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <BsPersonBadge className="text-xl" />
          </div>
        </Card>

        <Card variant="dark" className="border-white/5 p-6 flex items-center justify-between group hover:border-white/10 transition-all">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dependency Risk</div>
            <div className="text-2xl font-bold text-white">{metrics.dependencyRisk.toFixed(1)}%</div>
            <div className="text-xs text-amber-400 mt-1 flex items-center">
              <BsShieldExclamation className="mr-1" /> Top Customer Share
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <BsShieldExclamation className="text-xl" />
          </div>
        </Card>
      </div>

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
                  const isExpanded = expandedPartyId === party.id;
                  
                  return (
                    <React.Fragment key={party.id}>
                    <tr 
                      className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                      onClick={() => toggleExpand(party.id)}
                    >
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
                          <BsArrowRight className={`text-lg transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-white/[0.01]">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 ml-12 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Linked Accounts</h4>
                            
                            {loadingAccounts[party.id] ? (
                              <div className="flex items-center space-x-2 text-gray-500 text-xs">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span>Loading accounts...</span>
                              </div>
                            ) : !partyAccounts[party.id] || partyAccounts[party.id].length === 0 ? (
                              <div className="text-gray-600 text-xs italic">
                                No accounts linked. Add one when creating a transaction.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {partyAccounts[party.id].map(acc => (
                                  <div key={acc.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                        {acc.account_type}
                                      </span>
                                      {acc.is_primary && (
                                        <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                                          <BsCheckCircleFill className="mr-1 text-[8px]" /> Primary
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm font-bold text-white mb-0.5">{acc.account_name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{acc.account_identifier}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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
