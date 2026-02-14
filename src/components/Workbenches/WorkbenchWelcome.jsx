
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    BsStars, BsCashStack, BsReceipt, BsFileEarmarkText,
    BsLightningChargeFill, BsCheckCircleFill, BsShieldCheck,
    BsUpload, BsPlusLg, BsChatDots, BsArrowRight
} from 'react-icons/bs';
import Groq from "groq-sdk";

// --- MOCK DATA FOR VISUALIZATIONS ---
const TREND_DATA = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 7500 },
];

const MINI_CASH_DATA = [
    { val: 20 }, { val: 40 }, { val: 35 }, { val: 50 }, { val: 45 }, { val: 60 }, { val: 55 }
];

const MINI_TXN_DATA = [
    { val: 10 }, { val: 25 }, { val: 15 }, { val: 30 }, { val: 20 }, { val: 40 }, { val: 35 }
];

const DOCS_DATA = [
    { name: 'Invoices', value: 45 },
    { name: 'Contracts', value: 25 },
    { name: 'Reports', value: 30 },
];

const CATEGORY_DATA = [
    { name: 'Income', value: 65, color: '#10B981' }, // Emerald
    { name: 'Expenses', value: 25, color: '#EF4444' }, // Red
    { name: 'Savings', value: 10, color: '#3B82F6' }, // Blue
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

// --- COMPONENT ---
export default function WorkbenchWelcome({ onAction, workbenchId }) {
    const [aiCapabilities, setAiCapabilities] = useState([
        "Automated expense categorization via intelligent parsing",
        "Real-time anomaly detection in cash flow patterns",
        "Predictive budget forecasting based on historical data"
    ]);
    const [loadingAI, setLoadingAI] = useState(true);

    // Fetch AI Capabilities on Mount
    useEffect(() => {
        const fetchAICapabilities = async () => {
            try {
                const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: "Generate 3 brief, one-line capabilities for a new AI-powered financial workbench. Return ONLY the 3 lines, nothing else."
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                });

                const content = completion.choices[0]?.message?.content;
                if (content) {
                    const lines = content.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
                    // Clean up numbering or bullets if present
                    const cleanLines = lines.map(l => l.replace(/^[-*1-3\.]+\s*/, ''));
                    setAiCapabilities(cleanLines);
                }
            } catch (error) {
                console.error("Failed to fetch AI capabilities, using default:", error);
            } finally {
                setLoadingAI(false);
            }
        };

        fetchAICapabilities();
    }, []);

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

    return (
        <motion.div
            className="w-full max-w-7xl mx-auto p-6 space-y-8 text-white min-h-screen"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* A. HERO SECTION */}
            <motion.div variants={itemVariants} className="text-center py-12 relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary/5 to-transparent border border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent blur-3xl" />

                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-6 relative"
                >
                    <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                    <BsStars className="text-6xl text-primary relative z-10" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                    Your Workbench is Ready
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Start by adding your first transaction or document to unlock real-time financial intelligence.
                </p>
            </motion.div>

            {/* B. STATISTICS CARDS (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Cash Position */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                            <BsCashStack className="text-2xl" />
                        </div>
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold rounded-full">Live Monitor</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">Cash Position</div>
                    <div className="text-sm text-gray-500 mb-4">Real-time liquidity tracking</div>
                    <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MINI_CASH_DATA}>
                                <defs>
                                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="val" stroke="#F59E0B" fillOpacity={1} fill="url(#colorCash)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Card 2: Transactions */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <BsReceipt className="text-2xl" />
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-bold rounded-full">Auto-Sync</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">Transactions</div>
                    <div className="text-sm text-gray-500 mb-4">Automated entry logging</div>
                    <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MINI_TXN_DATA}>
                                <Line type="monotone" dataKey="val" stroke="#10B981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Card 3: Documents */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                            <BsFileEarmarkText className="text-2xl" />
                        </div>
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-[10px] uppercase font-bold rounded-full">OCR Ready</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">Documents</div>
                    <div className="text-sm text-gray-500 mb-4">Smart extraction & storage</div>
                    <div className="h-24 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={DOCS_DATA} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value">
                                    {DOCS_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#A855F7', '#EC4899', '#6366F1'][index % 3]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* C. AI CAPABILITIES */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                    <BsLightningChargeFill className="text-yellow-400 text-xl animate-pulse" />
                    <h2 className="text-xl font-bold">AI-Powered Capabilities</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiCapabilities.map((cap, idx) => (
                        <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3 hover:bg-white/[0.05] transition-colors">
                            <BsCheckCircleFill className="text-primary text-lg shrink-0" />
                            <span className="text-sm text-gray-300 font-medium">{cap}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* D. FINANCIAL OVERVIEW DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                {/* Large Chart 1: Revenue Trend */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Projected Revenue Trend</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TREND_DATA}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#81E6D9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#81E6D9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#666" tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#81E6D9" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Large Chart 2: Category Distribution */}
                <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Category Distribution</h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={CATEGORY_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {CATEGORY_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Stats */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center -mt-4">
                            <div className="text-2xl font-bold text-white">100%</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Visibility</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* E. SYSTEM STATUS BAR */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BsShieldCheck className="text-primary text-sm" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Secure Connection</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BsStars className="text-amber-400 text-sm animate-pulse" />
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
                    className="group relative p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl hover:bg-purple-500/20 transition-all text-left"
                >
                    <div className="absolute top-4 right-4 p-2 bg-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <BsArrowRight className="text-purple-400" />
                    </div>
                    <div className="p-4 bg-purple-500/20 rounded-xl w-fit mb-4 text-purple-400 group-hover:text-purple-300">
                        <BsUpload className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Upload Document</h3>
                    <p className="text-sm text-gray-400">Import invoices, contracts, or bank statements.</p>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction('create_transaction')}
                    className="group relative p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all text-left"
                >
                    <div className="absolute top-4 right-4 p-2 bg-emerald-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <BsArrowRight className="text-emerald-400" />
                    </div>
                    <div className="p-4 bg-emerald-500/20 rounded-xl w-fit mb-4 text-emerald-400 group-hover:text-emerald-300">
                        <BsPlusLg className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Create Transaction</h3>
                    <p className="text-sm text-gray-400">Log income, expenses, or transfers manually.</p>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction('talk_to_ai')}
                    className="group relative p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl hover:bg-amber-500/20 transition-all text-left"
                >
                    <div className="absolute top-4 right-4 p-2 bg-amber-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <BsArrowRight className="text-amber-400" />
                    </div>
                    <div className="p-4 bg-amber-500/20 rounded-xl w-fit mb-4 text-amber-400 group-hover:text-amber-300">
                        <BsChatDots className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Talk to AI</h3>
                    <p className="text-sm text-gray-400">Ask questions about financial health or strategy.</p>
                </motion.button>
            </div>

        </motion.div>
    );
}
