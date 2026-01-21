import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const TENURE_OPTIONS = [
  { value: '1', label: '1 Month' },
  { value: '3', label: '3 Months' },
  { value: '6', label: '6 Months' },
  { value: '12', label: '1 Year' },
];

const getPricingPlans = (selectedTenure) => {
  const isBundled = selectedTenure !== '1';
  
  return [
    {
      id: 1,
      name: "Basic",
      price: selectedTenure === '1' ? "₹999" : 
             selectedTenure === '3' ? "₹2,799" :
             selectedTenure === '6' ? "₹5,299" : "₹9,999",
      period: selectedTenure === '12' ? "/year" : `for ${selectedTenure} month${selectedTenure === '1' ? '' : 's'}`,
      description: "Perfect for small businesses and startups.",
      features: [
        { text: "100 credits/month", included: true },
        { text: "Single User", included: true },
        { text: "Email Support", included: true },
        { text: "CSV Upload", included: true },
        { text: "Basic KPIs (5 metrics)", included: true },
        ...(isBundled ? [{ text: "100 bonus credits (one-time)", included: true }] : []),
        { text: "Advanced Features", included: false },
      ],
      cta: "Get Started",
      ctaLink: "/payment-coming-soon",
      popular: false,
    },
    {
      id: 2,
      name: "Go",
      price: selectedTenure === '1' ? "₹2,999" : 
             selectedTenure === '3' ? "₹7,999" :
             selectedTenure === '6' ? "₹14,999" : "₹29,999",
      period: selectedTenure === '12' ? "/year" : `for ${selectedTenure} month${selectedTenure === '1' ? '' : 's'}`,
      description: "For growing businesses with advanced needs.",
      features: [
        { text: "200 credits/month", included: true },
        { text: "Dabby AI Access", included: true },
        { text: "Advanced Analytics", included: true },
        { text: "Priority Support", included: true },
        { text: "20+ KPI Metrics", included: true },
        ...(isBundled ? [{ text: "500 bonus credits (one-time)", included: true }] : []),
        { text: "PDF Report Generation", included: true },
      ],
      cta: "Get Started",
      ctaLink: "/payment-coming-soon",
      popular: true,
    },
    {
      id: 3,
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Tailored solutions for enterprise needs.",
      features: [
        { text: "Everything in Go", included: true },
        { text: "Unlimited Users", included: true },
        { text: "Dedicated Account Manager", included: true },
        { text: "Custom AI Training", included: true },
        { text: "White-labeling Options", included: true },
        { text: "SLA Guarantees", included: true },
        { text: "API Access", included: true },
      ],
      cta: "Schedule a Call",
      ctaLink: "https://calendly.com/medhansh_k/mk-101",
      popular: false,
    },
  ];
};

const faqItems = [
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, and UPI payments. For B2B custom plans, we also offer invoice-based payments.",
    },
    {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
    },
    {
        question: "Is there a free trial available?",
        answer: "Yes, you start with 30 free credits on our Basic and Go plans. No credit card required to start.",
    },
    {
        question: "What kind of support is included?",
        answer: "All plans include email support. Go plans include priority support with guaranteed 24hr response times. Enterprise plans include dedicated account manager.",
    },
];

export default function Pricing() {
    const { theme } = useTheme();
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
    const isDark = theme === "dark";
    const [selectedTenure, setSelectedTenure] = useState('1');
    const pricingPlans = getPricingPlans(selectedTenure);

    return (
        <div className={`min-h-screen ${isDark ? "bg-[#0a0a0a]" : "bg-[#f0f0f0]"}`}>
            {/* Hero Section */}
            <section className="pt-32 pb-16 px-6 md:px-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-6 bg-[#81E6D9]/10 text-[#81E6D9] border border-[#81E6D9]/20"
                    >
                        Simple, Transparent Pricing
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${isDark ? "text-white" : "text-[#1a1a1a]"
                            }`}
                    >
                        Choose Your Plan
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`text-lg md:text-xl max-w-2xl mx-auto ${isDark ? "text-[#787878]" : "text-gray-600"
                            }`}
                    >
                        Select the perfect plan for your business needs. All plans include core features with different usage limits.
                    </motion.p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section ref={sectionRef} className="py-16 px-6 md:px-10">
                <div className="max-w-7xl mx-auto">
                    {/* Tenure Selector */}
                    <div className="flex justify-center mb-12">
                        <div className={`p-1 rounded-full ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}>
                            {TENURE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedTenure(option.value)}
                                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${selectedTenure === option.value
                                        ? `${isDark ? 'bg-[#81E6D9] text-black' : 'bg-white text-[#1a1a1a] shadow'}`
                                        : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-[#1a1a1a]'}`
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {pricingPlans.map((plan, index) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className={`relative p-8 rounded-2xl border transition-all duration-300 ${plan.popular
                                    ? isDark
                                        ? "bg-[#111111] border-[#81E6D9]/30 shadow-lg shadow-[#81E6D9]/10"
                                        : "bg-white border-[#81E6D9]/50 shadow-xl"
                                    : isDark
                                        ? "bg-[#111111] border-white/5 hover:border-[#81E6D9]/20"
                                        : "bg-white border-[#1a1a1a]/10 hover:border-[#81E6D9]/30"
                                    }`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-[#81E6D9] text-black">
                                            Popular
                                        </span>
                                    </div>
                                )}

                                {/* Plan Name */}
                                <h3 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-[#1a1a1a]"
                                    }`}>
                                    {plan.name}
                                </h3>

                                {/* Price */}
                                <div className="mb-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl md:text-5xl font-bold ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
                                            {plan.price}
                                        </span>
                                        {plan.period && (
                                            <span className={`text-lg ${isDark ? "text-[#787878]" : "text-gray-500"}`}>
                                                {plan.period}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className={`text-sm mb-6 ${isDark ? "text-[#787878]" : "text-gray-600"}`}>
                                    {plan.description}
                                </p>

                                {/* CTA Button */}
                                {plan.ctaLink.startsWith('http') ? (
                                    <motion.a
                                        href={plan.ctaLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`block w-full py-3 rounded-full font-semibold mb-8 transition-colors text-center ${isDark
                                            ? "bg-white/5 text-white border border-white/10 hover:border-[#81E6D9]/50"
                                            : "bg-gray-100 text-[#1a1a1a] border border-[#1a1a1a]/10 hover:border-[#81E6D9]/50"
                                            }`}
                                    >
                                        {plan.cta}
                                    </motion.a>
                                ) : (
                                    <Link to={plan.ctaLink}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`w-full py-3 rounded-full font-semibold mb-8 transition-colors ${plan.popular
                                                ? `bg-[#81E6D9] text-black border border-[#81E6D9] hover:bg-transparent ${isDark ? "hover:text-white hover:border-white" : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"}`
                                                : isDark
                                                    ? "bg-white/5 text-white border border-white/10 hover:border-[#81E6D9]/50"
                                                    : "bg-gray-100 text-[#1a1a1a] border border-[#1a1a1a]/10 hover:border-[#81E6D9]/50"
                                                }`}
                                        >
                                            {plan.cta}
                                        </motion.button>
                                    </Link>
                                )}

                                {/* Features List */}
                                <ul className="space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            {feature.included ? (
                                                <svg className="w-5 h-5 text-[#81E6D9] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            <span className={`text-sm ${feature.included
                                                ? isDark ? "text-gray-300" : "text-gray-700"
                                                : isDark ? "text-gray-600" : "text-gray-400"
                                                }`}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Need Help Section */}
            <section className="py-16 px-6 md:px-10">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-[#1a1a1a]"
                        }`}>
                        Need Help Choosing?
                    </h2>
                    <p className={`text-lg mb-8 ${isDark ? "text-[#787878]" : "text-gray-600"}`}>
                        Our team is ready to help you find the perfect plan for your business needs. Schedule a consultation or call with our experts.
                    </p>
                    <motion.a
                        href="https://calendly.com/medhansh_k/mk-101"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-8 py-3 rounded-full font-semibold bg-[#81E6D9] text-black border border-[#81E6D9] hover:bg-transparent transition-colors ${isDark
                                ? "hover:text-white hover:border-white"
                                : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
                            }`}
                    >
                        Talk to Founder
                    </motion.a>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-6 md:px-10">
                <div className="max-w-4xl mx-auto">
                    <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isDark ? "text-white" : "text-[#1a1a1a]"
                        }`}>
                        Frequently Asked Questions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {faqItems.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className={`p-6 rounded-xl border ${isDark ? "bg-[#111111] border-white/5" : "bg-white border-[#1a1a1a]/10"
                                    }`}
                            >
                                <h3 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
                                    {item.question}
                                </h3>
                                <p className={`text-sm leading-relaxed ${isDark ? "text-[#787878]" : "text-gray-600"}`}>
                                    {item.answer}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
