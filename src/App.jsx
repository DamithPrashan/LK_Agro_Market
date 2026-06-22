import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";


import Home from "./pages/Home";
import Farmer from "./pages/Farmer";
import Browse from "./pages/Browse";
import PreOrder from "./pages/PreOrder";
import Payment from "./pages/Payment";
import Buyer from "./pages/Buyer.jsx";
import Complaints from "./pages/Complaints";
import Admin from "./pages/Admin";
import Register from "./pages/Register";
import Footer from "../frontend/components/footer.jsx";
import Login from "./pages/Login";
import ProfilePage from "./pages/Profile.jsx";
import Ratings from "./pages/Ratings.jsx";
import AddListing from "../frontend/farmer/react/addList.jsx";
import EditList from "./pages/EditList.jsx";
import OrderManagement from "../frontend/farmer/react/OrderManagement.jsx";
import BuyerOrderHistory from "../frontend/buyer/react/BuyerOrderHistory.jsx";




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
        <Route path="/buyer" element={<Buyer />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/farmer/add-listing" element={<AddListing />} />
        <Route path="/farmer/edit-listing" element={<EditList />} />
        <Route path="/farmer/orders" element={<OrderManagement />}
        />
      <Route path="/buyer/BuyerOrderHistory" element={<BuyerOrderHistory />}
/>
      </Routes>

      <Footer />

    </>
  );
}

export default App;
