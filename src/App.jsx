import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage        from "../frontend/commonPages/loginPage";
import RegisterPage     from "../frontend/commonPages/registrationPage";
import PaymentPage      from "../frontend/commonPages/payment";
import ProfilePage      from "../frontend/commonPages/profilePage";
import LandingPage      from "../frontend/commonPages/landingPage";
import RatingsPage      from "../frontend/ratings/ratingPage";

// Other team members will add their routes here
// import FarmerDashboard from "../frontend/farmer/react/dashBoard";
// import BuyerDashboard  from "../frontend/buyer/react/dashBoard";
// import AdminDashboard  from "../frontend/admin/react/dashBoard";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/register"  element={<RegisterPage />} />

      {/* Supun's protected routes */}
      <Route path="/payment"   element={<PaymentPage />} />
      <Route path="/ratings"   element={<RatingsPage />} />
      <Route path="/profile"   element={<ProfilePage />} />

      {/* Fallback */}
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}