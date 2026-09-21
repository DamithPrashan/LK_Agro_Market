import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Navbar/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import { CropProvider } from "./context/CropContext";
import { useAuth } from "./context/AuthContext";

// ── Pages with real src/ logic (use RequireRole / AuthContext) ────────────────
import BuyerLayout from "./pages/BuyerLayout.jsx";
import FarmerLayout from "./pages/FarmerLayout.jsx";
import ProfilePage from "./pages/Profile.jsx";

// ── Public / common pages ─────────────────────────────────────────────────────
import Home from "../frontend/commonPages/react/Home.jsx";
import Login from "../frontend/commonPages/loginPage";
import Register from "../frontend/commonPages/registrationPage";
import ForgotPassword from "../frontend/commonPages/forgotPassword.jsx";
import ResetPassword from "../frontend/commonPages/resetPassword.jsx";
import Payment from "../frontend/commonPages/payment";

// ── Buyer pages ───────────────────────────────────────────────────────────────
import Browse from "../frontend/buyer/react/Browse.jsx";
import PreOrder from "../frontend/buyer/react/PreOrder.jsx";
import Complaints from "../frontend/buyer/react/Complaints.jsx";
import FarmerResponse from "../frontend/buyer/react/farmerResponse.jsx";
import BuyerDashboard from "../frontend/buyer/react/buyerDashboard.jsx";
import BuyerOrderHistory from "../frontend/buyer/react/buyerOrderHistory.jsx";
import MapSearch from "../frontend/buyer/react/mapSearch.jsx";
import CultivationOpportunityDetails from "../frontend/buyer/react/CultivationOpportunityDetails.jsx";
import CultivationRequests from "../frontend/buyer/react/CultivationRequests.jsx";

// ── Farmer pages ──────────────────────────────────────────────────────────────
import FarmerDashboard from "../frontend/farmer/react/dashBoard.jsx";
import AddListing from "../frontend/farmer/react/addList.jsx";
import EditList from "../frontend/farmer/react/EditList.jsx";
import OrderManagement from "../frontend/farmer/react/OrderManagement.jsx";
import MyListings from "../frontend/farmer/react/MyListings.jsx";
import FarmerComplaints from "../frontend/farmer/react/FarmerComplaints.jsx";
import AddCultivationAd from "../frontend/farmer/react/AddCultivationAd.jsx";
import CultivationOpportunities from "../frontend/farmer/react/CultivationOpportunities.jsx";
import EditCultivationAd from "../frontend/farmer/react/EditCultivationAd.jsx";

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminLayout from "../frontend/admin/react/AdminDashboard/AdminLayout.jsx";
import AdminDashboard from "../frontend/admin/react/AdminDashboard/AdminDashboard.jsx";
import FarmerVerification from "../frontend/admin/react/AdminDashboard/FarmerVerification.jsx";
import ComplaintManagement from "../frontend/admin/react/ComplaintManagement.jsx";
import ResolveComplaint from "../frontend/admin/react/ResolveComplaint.jsx";
import UserManagement from "../frontend/admin/react/AdminDashboard/UserManagement.jsx";

// ── Shared ────────────────────────────────────────────────────────────────────
import Ratings from "../frontend/ratings/ratingPage";
import Footer from "../frontend/components/HomepageFooter.jsx";


function App() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();


  /* =========================================
     HIDE FOOTER FOR LOGGED-IN USERS
  ========================================= */

  const hideAppFooter =
    pathname === "/" ||
    (user && ["farmer", "buyer", "admin"].includes(user.role?.toLowerCase()));


  /* =========================================
     LANGUAGE
  ========================================= */

  useEffect(() => {
    if (user && user.language) {
      let mappedLang = "en";

      const userLang =
        user.language.toLowerCase();

      if (
        userLang === "sinhala" ||
        userLang === "si"
      ) {
        mappedLang = "si";

      } else if (
        userLang === "tamil" ||
        userLang === "ta"
      ) {
        mappedLang = "ta";

      } else if (
        userLang === "english" ||
        userLang === "en"
      ) {
        mappedLang = "en";
      }


      if (i18n.language !== mappedLang) {
        i18n.changeLanguage(mappedLang);

        localStorage.setItem(
          "preferredLanguage",
          mappedLang
        );
      }
    }

  }, [user, i18n]);

  if (user?.account_status === "inactive") {
    return <div className="app-shell"><Navbar /><main className="main-content"><p>{t("errors.accountInactive")}</p></main></div>;
  }


  return (
    <CropProvider>

      <div className="app-shell">


        {/* ================================
            NAVBAR
        ================================= */}

        <ScrollToTop />
        <Navbar />


        {/* ================================
            MAIN CONTENT
        ================================= */}

        <main className="main-content">

          <Routes>


            {/* ============================
                PUBLIC ROUTES
            ============================ */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/browse"
              element={
                user?.role?.toLowerCase() === "buyer" ? (
                  <BuyerLayout>
                    <Browse />
                  </BuyerLayout>
                ) : (
                  <Browse />
                )
              }
            />

            <Route
              path="/preorder"
              element={
                user?.role?.toLowerCase() === "buyer" ? (
                  <BuyerLayout>
                    <PreOrder />
                  </BuyerLayout>
                ) : (
                  <PreOrder />
                )
              }
            />

            <Route
              path="/pre-order"
              element={
                user?.role?.toLowerCase() === "buyer" ? (
                  <BuyerLayout>
                    <PreOrder />
                  </BuyerLayout>
                ) : (
                  <PreOrder />
                )
              }
            />

            <Route
              path="/crop/:id"
              element={
                user?.role?.toLowerCase() === "buyer" ? (
                  <BuyerLayout>
                    <PreOrder />
                  </BuyerLayout>
                ) : (
                  <PreOrder />
                )
              }
            />

            <Route
              path="/cultivation-opportunity/:id"
              element={<CultivationOpportunityDetails />}
            />

            <Route
              path="/payment"
              element={<Payment />}
            />

            <Route
              path="/payment/:orderId"
              element={<Payment />}
            />

            <Route
              path="/complaints"
              element={<Complaints />}
            />

            <Route
              path="/ratings"
              element={<Ratings />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/reset-password"
              element={<ResetPassword />}
            />

            <Route
              path="/profile"
              element={user?.role?.toLowerCase() === "admin" ? <AdminLayout /> : <ProfilePage />}
            >
              {user?.role?.toLowerCase() === "admin" && <Route index element={<ProfilePage />} />}
            </Route>


            {/* ============================
                FARMER ROUTES
            ============================ */}

            <Route
              path="/farmer"
              element={<FarmerLayout />}
            >

              <Route
                index
                element={<FarmerDashboard />}
              />

              <Route
                path="dashboard"
                element={<FarmerDashboard />}
              />

              <Route
                path="add-listing"
                element={<AddListing />}
              />

              <Route
                path="edit-listing"
                element={<EditList />}
              />

              <Route
                path="orders"
                element={<OrderManagement />}
              />

              <Route
                path="listings"
                element={<MyListings />}
              />

              <Route
                path="add-cultivation-ad"
                element={<AddCultivationAd />}
              />

              <Route
                path="cultivation-opportunities"
                element={<CultivationOpportunities />}
              />

              <Route
                path="edit-cultivation-ad/:id"
                element={<EditCultivationAd />}
              />

              <Route
                path="complaints"
                element={<FarmerComplaints />}
              />

              <Route
                path="ratings"
                element={<Ratings />}
              />

            </Route>


            {/* ============================
                BUYER ROUTES
            ============================ */}

            <Route
              path="/buyer"
              element={<BuyerLayout />}
            >

              <Route
                index
                element={<BuyerDashboard />}
              />

              <Route
                path="dashboard"
                element={<BuyerDashboard />}
              />

              <Route
                path="browse"
                element={<Browse />}
              />

              <Route
                path="complaints"
                element={<Complaints />}
              />

              <Route
                path="ratings"
                element={<Ratings />}
              />

              <Route
                path="buyerorderhistory"
                element={<BuyerOrderHistory />}
              />

              <Route
                path="cultivation-requests"
                element={<CultivationRequests />}
              />

              <Route
                path="mapsearch"
                element={<MapSearch />}
              />

            </Route>


            {/* ============================
                ADMIN ROUTES
            ============================ */}

            <Route
              path="/admin"
              element={<AdminLayout />}
            >

              <Route
                index
                element={<AdminDashboard />}
              />

              <Route
                path="farmer-verification"
                element={<FarmerVerification />}
              />

              <Route
                path="complaints"
                element={<ComplaintManagement />}
              />

              <Route
                path="complaint/:id"
                element={<ResolveComplaint />}
              />

              <Route
                path="users"
                element={<UserManagement />}
              />

            </Route>


            {/* ============================
                OTHER ROUTES
            ============================ */}

            <Route
              path="/farmer-response"
              element={<FarmerResponse />}
            />


          </Routes>

        </main>


        {/* ================================
            FOOTER

            Homepage owns its unconditional Footer.
            Other public routes keep the existing guest Footer.
        ================================= */}

        {!hideAppFooter && <Footer />}


      </div>

    </CropProvider>
  );
}


export default App;
