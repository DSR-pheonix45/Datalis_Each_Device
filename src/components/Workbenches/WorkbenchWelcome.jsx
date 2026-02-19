import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    BsRocket, BsCashStack, BsGraphUp, BsBank,
    BsCheckAll, BsCheckCircleFill, BsShieldCheck,
    BsUpload, BsPlusLg, BsChatDots, BsArrowRight,
    BsExclamationTriangle, BsInfoCircle, BsClock
} from 'react-icons/bs';
import { intelligenceService } from "../../services/intelligenceService";

export default function WorkbenchWelcome({ onAction, workbenchId }) {
    const [snapshot, setSnapshot] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [loadingExceptions, setLoadingExceptions] = useState(true);

    // Fetch Financial Snapshot, Visualizations & Exceptions
    useEffect(() => {
        const fetchData = async () => {
            if (workbenchId) {
                setLoadingExceptions(true);
                try {
                    // Parallel fetch for snapshot, visualizations, and exceptions
                    const [snap, viz, exc] = await Promise.all([
                        intelligenceService.getFinancialSnapshotMetrics(workbenchId),
                        intelligenceService.getDashboardVisualizations(workbenchId),
                        intelligenceService.getWorkbenchExceptions(workbenchId)
                    ]);

                    if (snap) setSnapshot(snap);
                    if (viz) {
                        setTrendData(viz.revenueTrend);
                        setCategoryData(viz.expenseDistribution);
                    }
                    if (exc) setExceptions(exc);
                } catch (error) {
                    console.error("Error fetching workbench data:", error);
                } finally {
                    setLoadingExceptions(false);
                }
            }
        };
        fetchData();
    }, [workbenchId]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    // Default data for empty states
    const defaultTrend = Array(6).fill(0).map((_, i) => ({ name: `M-${5-i}`, value: 0 }));
    const defaultMiniCash = [
        { val: 20 }, { val: 40 }, { val: 35 }, { val: 50 }, { val: 45 }, { val: 60 }, { val: 55 }
    ];

    return (
        <motion.div
            className="w-full max-w-7xl mx-auto p-6 space-y-8 text-white min-h-screen"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* A. HERO SECTION */}
            <motion.div variants={itemVariants} className="text-center py-12 relative overflow-hidden rounded-3xl bg-gradient-to-b from-teal-500/5 to-transparent border border-teal-500/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent blur-3xl" />

                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-6 relative"
                >
                    <div className="absolute inset-0 bg-teal-500/30 blur-xl rounded-full" />
                    <BsRocket className="text-6xl text-teal-400 relative z-10" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                    Your Workbench is Ready
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Start by adding your first transaction or document to unlock real-time financial intelligence.
                </p>
            </motion.div>

            {/* B. FINANCIAL SNAPSHOT CARDS (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Cash Position */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-teal-400/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                            <BsCashStack className="text-2xl" />
                        </div>
                        <span className="px-2 py-1 bg-teal-500/10 text-teal-300 text-[10px] uppercase font-bold rounded-full">Live Monitor</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">
                        {snapshot ? `₹${snapshot.cashBalance.toLocaleString()}` : '₹0'}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">Current Cash Balance</div>
                    <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={defaultMiniCash} width={100} height={100}>
                                <defs>
                                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C6C2" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00C6C2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="val" stroke="#00C6C2" fillOpacity={1} fill="url(#colorCash)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Card 2: Balance Sheet Snapshot */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-teal-400/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                            <BsBank className="text-2xl" />
                        </div>
                        <span className="px-2 py-1 bg-teal-500/10 text-teal-300 text-[10px] uppercase font-bold rounded-full">Balance Sheet</span>
                    </div>
                    <div className="space-y-3">
                         <div className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                            <span className="text-gray-400">Assets</span>
                            <span className="text-emerald-400 font-bold">
                                {snapshot ? `₹${(snapshot.balanceSheet.assets / 100000).toFixed(1)}L` : '₹0L'}
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                            <span className="text-gray-400">Liabilities</span>
                            <span className="text-rose-400 font-bold">
                                {snapshot ? `₹${(snapshot.balanceSheet.liabilities / 100000).toFixed(1)}L` : '₹0L'}
                            </span>
                         </div>
                    </div>
                </motion.div>

                {/* Card 3: Cash Flow (Current Month) */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-teal-400/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                            <BsGraphUp className="text-2xl" />
                        </div>
                        <span className="px-2 py-1 bg-teal-500/10 text-teal-300 text-[10px] uppercase font-bold rounded-full">Cash Flow</span>
                    </div>
                    <div className="space-y-3">
                         <div className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                            <span className="text-gray-400">Operating</span>
                            <span className={snapshot?.cashFlow.operating >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {snapshot ? `₹${(snapshot.cashFlow.operating / 100000).toFixed(1)}L` : '₹0L'}
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                            <span className="text-gray-400">Investing</span>
                            <span className={snapshot?.cashFlow.investing >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {snapshot ? `₹${(snapshot.cashFlow.investing / 100000).toFixed(1)}L` : '₹0L'}
                            </span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Financing</span>
                            <span className={snapshot?.cashFlow.financing >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {snapshot ? `₹${(snapshot.cashFlow.financing / 100000).toFixed(1)}L` : '₹0L'}
                            </span>
                         </div>
                    </div>
                </motion.div>
            </div>

            {/* C. REAL-TIME EXCEPTIONS */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                    <BsExclamationTriangle className="text-amber-400 text-xl" />
                    <h2 className="text-xl font-bold">Workbench Exceptions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loadingExceptions ? (
                        <div className="col-span-full text-center text-gray-500 py-4">Scanning for exceptions...</div>
                    ) : exceptions.length > 0 ? (
                        exceptions.map((exc, idx) => {
                            const config = {
                                critical: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: BsExclamationTriangle },
                                high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: BsExclamationTriangle },
                                medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: BsInfoCircle },
                                low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: BsInfoCircle }
                            }[exc.severity] || { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: BsInfoCircle };
                            
                            const Icon = config.icon;
                            
                            return (
                                <div key={idx} className={`${config.bg} ${config.border} border rounded-xl p-4 flex items-start gap-3 hover:bg-opacity-80 transition-colors`}>
                                    <Icon className={`${config.color} text-lg shrink-0 mt-0.5`} />
                                    <div>
                                        <div className={`text-sm font-bold ${config.color} uppercase text-[10px] mb-1`}>{exc.type.replace(/_/g, ' ')}</div>
                                        <span className="text-sm text-gray-300 font-medium">{exc.message}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full bg-teal-500/5 border border-teal-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                            <BsCheckCircleFill className="text-teal-400 text-3xl mb-3" />
                            <h3 className="text-lg font-bold text-white">All Clear</h3>
                            <p className="text-sm text-gray-400">No critical exceptions detected at this time.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* D. FINANCIAL OVERVIEW DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                {/* Large Chart 1: Revenue Trend */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#0A0A0A] border border-teal-500/20 rounded-2xl p-6 flex flex-col h-full">
                    <h3 className="text-lg font-bold mb-4">Projected Revenue Trend</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={trendData.length > 0 ? trendData : defaultTrend} width={500} height={300}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C6C2" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00C6C2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#666" tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#00C6C2" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Large Chart 2: Category Distribution */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-teal-500/20 rounded-2xl p-6 flex flex-col h-full">
                    <h3 className="text-lg font-bold mb-4">Category Distribution</h3>
                    <div className="flex-1 w-full relative min-h-0">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <PieChart width={300} height={300}>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || ['#00FFD1', '#00C6C2', '#00B4AC'][index % 3]} />
                                        ))}
                                    </Pie>
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                No expense data available
                            </div>
                        )}
                        {/* Center Stats */}
                        {categoryData.length > 0 && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center -mt-4">
                                <div className="text-2xl font-bold text-white">100%</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Visibility</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* E. SYSTEM STATUS BAR */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 bg-teal-500/5 border border-teal-500/20 rounded-xl">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_10px_rgba(0,198,194,0.5)]" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BsShieldCheck className="text-teal-400 text-sm" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Secure Connection</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BsCheckAll className="text-teal-400 text-sm" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Insight Engine Ready</span>
                    </div>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                    V 2.4.0 • WORKBENCH ID: {workbenchId?.slice(0, 8) || '####'}
                </div>
            </motion.div>

            {/* F. CALL TO ACTION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction('upload_document')}
                    className="group relative p-6 bg-teal-500/10 border border-teal-500/20 rounded-2xl hover:bg-teal-500/20 transition-all text-left"
                >
                    <div className="absolute top-4 right-4 p-2 bg-teal-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <BsArrowRight className="text-teal-400" />
                    </div>
                    <div className="p-4 bg-teal-500/20 rounded-xl w-fit mb-4 text-teal-400 group-hover:text-teal-300">
                        <BsUpload className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Upload Document</h3>
                    <p className="text-sm text-gray-400">Import invoices, contracts, or bank statements.</p>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction('create_transaction')}
                    className="group relative p-6 bg-teal-500/10 border border-teal-500/20 rounded-2xl hover:bg-teal-500/20 transition-all text-left"
                >
                    <div className="absolute top-4 right-4 p-2 bg-teal-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <BsArrowRight className="text-teal-400" />
                    </div>
                    <div className="p-4 bg-teal-500/20 rounded-xl w-fit mb-4 text-teal-400 group-hover:text-teal-300">
                        <BsPlusLg className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Create Transaction</h3>
                    <p className="text-sm text-gray-400">Log income, expenses, or transfers manually.</p>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction('talk_to_ai')}
                    className="group relative p-6 bg-teal-500/10 border border-teal-500/20 rounded-2xl hover:bg-teal-500/20 transition-all text-left"
                >
                    <div className="absolute top-4 right-4 p-2 bg-teal-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <BsArrowRight className="text-teal-400" />
                    </div>
                    <div className="p-4 bg-teal-500/20 rounded-xl w-fit mb-4 text-teal-400 group-hover:text-teal-300">
                        <BsChatDots className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Talk to AI</h3>
                    <p className="text-sm text-gray-400">Ask questions about financial health or strategy.</p>
                </motion.button>
            </div>

        </motion.div>
    );
}
