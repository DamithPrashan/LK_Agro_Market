import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Navbar/Navbar";
import { CropProvider } from "./context/CropContext";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home";
import Farmer from "./pages/Farmer";
import Browse from "./pages/Browse";
import PreOrder from "./pages/PreOrder";
import Payment from "./pages/Payment";

import BuyerLayout from "./pages/BuyerLayout.jsx";
import BuyerDashboard from "../frontend/buyer/react/buyerDashboard.jsx";

import Complaints from "./pages/Complaints";
import FarmerResponse from "./pages/farmerResponse";

import AdminLayout from "../frontend/admin/react/AdminDashboard/AdminLayout.jsx";
import AdminDashboard from "../frontend/admin/react/AdminDashboard/AdminDashboard.jsx";
import FarmerVerification from "../frontend/admin/react/AdminDashboard/FarmerVerification.jsx";
import ComplaintManagement from "../frontend/admin/react/ComplaintManagement.jsx";
import ResolveComplaint from "./pages/ResolveComplaint";
import UserManagement from "../frontend/admin/react/AdminDashboard/UserManagement.jsx";

import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ProfilePage from "./pages/Profile.jsx";
import Ratings from "./pages/Ratings.jsx";

import Footer from "../frontend/components/footer.jsx";

import AddListing from "../frontend/farmer/react/addList.jsx";
import EditList from "../frontend/farmer/react/EditList.jsx";
import OrderManagement from "../frontend/farmer/react/OrderManagement.jsx";
import MyListings from "../frontend/farmer/react/MyListings.jsx";

import FarmerLayout from "./pages/FarmerLayout.jsx";

import BuyerOrderHistory from "../frontend/buyer/react/buyerOrderHistory.jsx";
import FarmerLayout from "./pages/FarmerLayout.jsx";
import MyListings from "../frontend/farmer/react/MyListings.jsx";
import MapSearch from "../frontend/buyer/react/mapSearch.jsx";

function App() {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // Get the current URL path
  const location = useLocation();

  // Hide footer on /admin and every admin sub-page
  const isAdminPage = location.pathname.startsWith("/admin");

  /* =========================================
     LANGUAGE
  ========================================= */

  useEffect(() => {
    if (user && user.language) {
      let mappedLang = "en";

      const userLang = user.language.toLowerCase();

      if (userLang === "sinhala" || userLang === "si") {
        mappedLang = "si";
      } else if (userLang === "tamil" || userLang === "ta") {
        mappedLang = "ta";
      } else if (userLang === "english" || userLang === "en") {
        mappedLang = "en";
      }

      if (i18n.language !== mappedLang) {
        i18n.changeLanguage(mappedLang);
        localStorage.setItem("preferredLanguage", mappedLang);
      }
    }
  }, [user, i18n]);

  return (
    <CropProvider>
      <div className="app-shell">
        {/* ================================
            NAVBAR
        ================================= */}
        <Navbar />

        {/* ================================
            MAIN CONTENT
        ================================= */}
        <main className="main-content">
          <Routes>
            {/* ============================
                PUBLIC ROUTES
            ============================ */}

            <Route path="/" element={<Home />} />

            <Route path="/browse" element={<Browse />} />

            <Route path="/preorder" element={<PreOrder />} />

            <Route path="/pre-order" element={<PreOrder />} />

            <Route path="/crop/:id" element={<PreOrder />} />

            <Route path="/payment" element={<Payment />} />

            <Route path="/payment/:orderId" element={<Payment />} />

            <Route path="/complaints" element={<Complaints />} />

            <Route path="/ratings" element={<Ratings />} />

            <Route path="/register" element={<Register />} />

            <Route path="/login" element={<Login />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/profile" element={<ProfilePage />} />

            {/* ============================
                FARMER ROUTES
            ============================ */}

            <Route path="/farmer" element={<FarmerLayout />}>
              <Route index element={<Farmer />} />

              <Route path="dashboard" element={<Farmer />} />

              <Route path="add-listing" element={<AddListing />} />

              <Route path="edit-listing" element={<EditList />} />

              <Route path="orders" element={<OrderManagement />} />

              <Route path="listings" element={<MyListings />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="ratings" element={<Ratings />} />
            </Route>
            <Route path="/browse" element={<Browse />} />
            <Route path="/preorder" element={<PreOrder />} />
            <Route path="/pre-order" element={<PreOrder />} />
            <Route path="/crop/:id" element={<PreOrder />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/buyer" element={<BuyerLayout />}>
              <Route index element={<BuyerDashboard />} />

              <Route path="dashboard" element={<BuyerDashboard />} />

              <Route path="preorder" element={<PreOrder />} />

              <Route path="complaints" element={<Complaints />} />

              <Route path="ratings" element={<Ratings />} />

              <Route path="buyerorderhistory" element={<BuyerOrderHistory />} />

              <Route path="mapsearch" element={<MapSearch />} />
            </Route>

            {/* ============================
                ADMIN ROUTES
            ============================ */}

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />

              <Route
                path="farmer-verification"
                element={<FarmerVerification />}
              />

              <Route path="complaints" element={<ComplaintManagement />} />

              <Route path="complaint/:id" element={<ResolveComplaint />} />

              <Route path="users" element={<UserManagement />} />
            </Route>

            {/* ============================
                OTHER ROUTES
            ============================ */}

            <Route path="/farmer-response" element={<FarmerResponse />} />
          </Routes>
        </main>

        {/* ================================
            FOOTER
            Hidden on all admin pages
        ================================= */}

        {!isAdminPage && <Footer />}
      </div>
    </CropProvider>
  );
}

export default App;
