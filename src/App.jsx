import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Maintenance from "./pages/Maintenance";

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#81E6D9] border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Redirect all traffic to Maintenance page */}
          <Route path="*" element={<Maintenance />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
