import React, { useState, useEffect, useCallback } from "react";
import { 
  BsBox, 
  BsGraphUp, 
  BsGraphDown, 
  BsPlusLg, 
  BsSearch, 
  BsFilter, 
  BsTrash, 
  BsPencil, 
  BsCartPlus, 
  BsCartDash 
} from "react-icons/bs";
import Card from "../shared/Card";
import Button from "../shared/Button";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

export default function InventoryView({ workbenchId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, product, service
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    hsn_code: "",
    type: "product",
    classification: "asset",
    amount: "",
    quantity: "1",
    description: ""
  });

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("workbench_id", workbenchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      // toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [workbenchId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.amount) {
        toast.error("Please fill required fields");
        return;
      }

      const payload = {
        workbench_id: workbenchId,
        name: formData.name,
        hsn_code: formData.hsn_code,
        type: formData.type,
        classification: formData.classification,
        amount: parseFloat(formData.amount),
        quantity: parseFloat(formData.quantity) || 1,
        description: formData.description
      };

      let error;
      if (editingItem) {
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update(payload)
          .eq("id", editingItem.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("inventory_items")
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;

      toast.success(editingItem ? "Item updated" : "Item added");
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        name: "",
        hsn_code: "",
        type: "product",
        classification: "asset",
        amount: "",
        quantity: "1",
        description: ""
      });
      fetchInventory();
    } catch (err) {
      console.error("Error saving item:", err);
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Item deleted");
      fetchInventory();
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to delete item");
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      hsn_code: item.hsn_code || "",
      type: item.type,
      classification: item.classification,
      amount: item.amount,
      quantity: item.quantity,
      description: item.description || ""
    });
    setIsModalOpen(true);
  };

  // Metrics
  const totalAssets = items
    .filter(i => i.classification === 'asset')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalLiabilities = items
    .filter(i => i.classification === 'liability')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.hsn_code && item.hsn_code.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filter === "all") return matchesSearch;
    return matchesSearch && item.type === filter;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="dark" className="border-white/5 p-6 flex items-center justify-between group hover:border-white/10 transition-all">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Inventory Assets</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalAssets)}</div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center">
              <BsGraphUp className="mr-1" /> Owned Value
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <BsBox className="text-xl" />
          </div>
        </Card>

        <Card variant="dark" className="border-white/5 p-6 flex items-center justify-between group hover:border-white/10 transition-all">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Inventory Liabilities</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalLiabilities)}</div>
            <div className="text-xs text-rose-400 mt-1 flex items-center">
              <BsGraphDown className="mr-1" /> Rented/Leased Value
            </div>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <BsGraphDown className="text-xl" />
          </div>
        </Card>
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Inventory & Services</h3>
          <p className="text-gray-500 text-xs">Manage products, services, assets, and liabilities</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input 
              type="text"
              placeholder="Search by name or HSN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/30 w-64"
            />
          </div>
          
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
            {["all", "product", "service"].map((f) => (
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

          <Button variant="primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            <BsPlusLg className="mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Inventory List */}
      <Card variant="dark" className="border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">HSN Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Classification</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Value</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Loading inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm">
                    {searchQuery ? "No items match your search" : "No inventory items found. Add one to get started."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${item.type === 'product' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          <BsBox className="text-base" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-400">{item.hsn_code || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'product' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.classification === 'asset' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {item.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-white">{formatCurrency(item.amount)}</div>
                      <div className="text-[10px] text-gray-500">Qty: {item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEdit(item)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <BsPencil />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <BsTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-6">
              {editingItem ? "Edit Item" : "Add Inventory Item"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                  placeholder="Item Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none"
                  >
                    <option value="product" className="bg-[#1A1A1A]">Product</option>
                    <option value="service" className="bg-[#1A1A1A]">Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsn_code}
                    onChange={e => setFormData({...formData, hsn_code: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    placeholder="HSN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Classification</label>
                  <select
                    value={formData.classification}
                    onChange={e => setFormData({...formData, classification: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none"
                  >
                    <option value="asset" className="bg-[#1A1A1A]">Asset</option>
                    <option value="liability" className="bg-[#1A1A1A]">Liability</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Total Value</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 h-24 resize-none"
                  placeholder="Optional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1" type="submit">Save Item</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
