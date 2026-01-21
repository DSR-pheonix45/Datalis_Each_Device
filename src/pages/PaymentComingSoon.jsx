import { motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { HiOutlineMail, HiOutlineCheckCircle } from "react-icons/hi";
import BrandLogo from "../components/common/BrandLogo";

export default function PaymentComingSoon() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-12 ${isDark ? "bg-[#0a0a0a]" : "bg-[#f0f0f0]"}`}>
      <div className="max-w-2xl w-full text-center">
        {/* Mascot / Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className={`absolute inset-0 blur-3xl opacity-20 bg-[#81E6D9] rounded-full`}></div>
            <BrandLogo
              iconSize={120}
              className="relative z-10"
              label=""
            />
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
            Coming Soon!
          </h1>
          
          <div className={`space-y-4 mb-10 text-lg md:text-xl leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            <p>
              We are currently in talks for <span className="text-[#81E6D9] font-medium">payment gateway connection</span> and <span className="text-[#81E6D9] font-medium">banking procedures</span>.
            </p>
            <p>
              Share your email and we'll notify you once payments are active.
            </p>
            <p className="text-2xl font-bold mt-8 tracking-tight bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
              BIG THANKS FOR SUPPORTING!
            </p>
          </div>
        </motion.div>

        {/* Email Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="relative group">
              <div className="relative">
                <HiOutlineMail className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-32 py-4 rounded-2xl border transition-all duration-300 outline-none ${
                    isDark
                      ? "bg-white/5 border-white/10 text-white focus:border-[#81E6D9]/50 focus:bg-white/10"
                      : "bg-white border-gray-200 text-gray-900 focus:border-[#81E6D9] shadow-sm"
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-[#81E6D9] text-black font-semibold hover:bg-[#70d4c7] transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : "Notify Me"}
                </button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-2xl border flex items-center justify-center gap-3 ${
                isDark ? "bg-[#81E6D9]/10 border-[#81E6D9]/20 text-[#81E6D9]" : "bg-teal-50 border-teal-100 text-teal-700"
              }`}
            >
              <HiOutlineCheckCircle className="text-2xl" />
              <span className="font-semibold">You're on the list! We'll be in touch.</span>
            </motion.div>
          )}
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <a
            href="/"
            className={`text-sm font-medium transition-colors ${
              isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-[#1a1a1a]"
            }`}
          >
            ← Back to Home
          </a>
        </motion.div>
      </div>
    </div>
  );
}
