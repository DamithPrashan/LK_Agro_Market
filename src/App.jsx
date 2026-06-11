import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";

import Home from "./pages/Home";
import Farmer from "./pages/Farmer";
import Browse from "./pages/Browse";
import PreOrder from "./pages/PreOrder";
import Payment from "./pages/Payment";
import MapSearch from "./pages/MapSearch";
import Complaints from "./pages/Complaints";
import Admin from "./pages/Admin";
import Register from "./pages/Register";
import Footer from "../frontend/components/footer.jsx";
import Login from "./pages/Login";
import ProfilePage from "./pages/Profile.jsx";
import Ratings from "./pages/Ratings.jsx";


// Other team members will add their routes here
// import FarmerDashboard from "../frontend/farmer/react/dashBoard";
// import BuyerDashboard  from "../frontend/buyer/react/dashBoard";
// import AdminDashboard  from "../frontend/admin/react/dashBoard";

function App() {
  return (
    <>

      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/farmer" element={<Farmer />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/preorder" element={<PreOrder />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/mapsearch" element={<MapSearch />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/ratings" element={<Ratings />} />

      </Routes>

      <Footer />

    </>
  );
}

export default App;
