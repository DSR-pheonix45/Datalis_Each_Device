import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { WorkbenchProvider } from "./context/WorkbenchContext.jsx";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./Auth/ProtectedRoute";

// Lazy Load Landing Page Components
const Home = lazy(() => import("./pages/Home"));
const Product = lazy(() => import("./pages/Product"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Documentation = lazy(() => import("./pages/Documentation"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Api = lazy(() => import("./pages/Api"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const PaymentComingSoon = lazy(() => import("./pages/PaymentComingSoon"));
const Navbar = lazy(() => import("./components/layout/Navbar"));
const Footer = lazy(() => import("./components/landing/Footer"));

// Authentication Components
const Login = lazy(() => import("./Auth/Login"));
const Signup = lazy(() => import("./Auth/Signup"));
const ForgotPassword = lazy(() => import("./Auth/ForgotPassword"));
const ResetPasswordConfirm = lazy(() => import("./Auth/ResetPasswordConfirm"));
const OAuthCallback = lazy(() => import("./Auth/OAuthCallback"));

// Protected Components
const MainApp = lazy(() => import("./components/MainApp"));
const Settings = lazy(() => import("./components/Settings/Settings"));
const WorkbenchesPage = lazy(() => import("./pages/workbenches/WorkbenchesPage"));
const CompanyPage = lazy(() => import("./pages/CompanyPage"));
const JoinCompany = lazy(() => import("./pages/JoinCompany"));

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#81E6D9] border-t-transparent rounded-full animate-spin" />
  </div>
);

// Wrapper for Landing Pages to apply specific Theme/Layout
function LandingLayout({ children }) {
  const { theme } = useTheme();
  // Ensure we are not in dashboard
  return (
    <div className={`min-h-screen font-dm-sans ${theme === "dark" ? "bg-black text-[#f8fafc]" : "bg-[#f0f0f0] text-[#1e293b]"}`}>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      {children}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Landing Pages with Persistent Layout */}
              <Route element={<LandingLayout><Outlet /></LandingLayout>}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/product" element={<Product />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/docs" element={<Documentation />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/api" element={<Api />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/payment-coming-soon" element={<PaymentComingSoon />} />
              </Route>
              <Route path="/join-company" element={<JoinCompany />} />

              {/* Other Auth Routes */}
              <Route path="/reset-password" element={<ForgotPassword />} />
              <Route
                path="/reset-password-confirm"
                element={<ResetPasswordConfirm />}
              />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <WorkbenchProvider>
                      <MainApp />
                    </WorkbenchProvider>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ThemeProvider>
      </AuthProvider>
      <SpeedInsights />
      <Analytics />
    </Router>
  );
}

export default App;
