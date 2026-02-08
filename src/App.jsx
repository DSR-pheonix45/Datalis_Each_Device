import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Maintenance from "./pages/Maintenance";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./Auth/ProtectedRoute";

import ErrorBoundary from "./components/common/ErrorBoundary";

// Lazy Load Landing Page Components
const Home = lazy(() => import("./pages/Home"));
const Product = lazy(() => import("./pages/Product"));
const Templates = lazy(() => import("./pages/Templates"));
const InvoiceGenerator = lazy(() => import("./pages/templates/InvoiceGenerator"));
const PurchaseOrderGenerator = lazy(() => import("./pages/templates/PurchaseOrderGenerator"));
const QuotationGenerator = lazy(() => import("./pages/templates/QuotationGenerator"));
const GSTInvoiceGenerator = lazy(() => import("./pages/templates/GSTInvoiceGenerator"));
const DeliveryChallanGenerator = lazy(() => import("./pages/templates/DeliveryChallanGenerator"));
const ProformaInvoiceGenerator = lazy(() => import("./pages/templates/ProformaInvoiceGenerator"));
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
const OAuthCallback = lazy(() => import("./Auth/OAuthCallback"));

// Protected Components
const MainApp = lazy(() => import("./components/MainApp"));
const Settings = lazy(() => import("./components/Settings/Settings"));

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

const isLocalhost = true; // Forced to true temporarily
// const isLocalhost = 
//   window.location.hostname === 'localhost' || 
//   window.location.hostname === '127.0.0.1' || 
//   window.location.hostname === '';

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
                <Route path="/login" element={isLocalhost ? <Login /> : <Maintenance />} />
                <Route path="/signup" element={isLocalhost ? <Signup /> : <Maintenance />} />
                <Route path="/maintenance" element={isLocalhost ? <Navigate to="/" replace /> : <Maintenance />} />
                <Route path="/product" element={<Product />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/templates/invoice" element={<InvoiceGenerator />} />
                <Route path="/templates/purchase-order" element={<PurchaseOrderGenerator />} />
                <Route path="/templates/quotation" element={<QuotationGenerator />} />
                <Route path="/templates/gst-invoice" element={<GSTInvoiceGenerator />} />
                <Route path="/templates/delivery-challan" element={<DeliveryChallanGenerator />} />
                <Route path="/templates/proforma-invoice" element={<ProformaInvoiceGenerator />} />
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
              <Route path="/oauth/callback" element={isLocalhost ? <OAuthCallback /> : <Maintenance />} />
              <Route path="/auth/callback" element={isLocalhost ? <OAuthCallback /> : <Maintenance />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard/*"
                element={
                  isLocalhost ? (
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <ErrorBoundary>
                          <MainApp />
                        </ErrorBoundary>
                      </Suspense>
                    </ProtectedRoute>
                  ) : (
                    <Maintenance />
                  )
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
