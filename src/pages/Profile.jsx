import Profile from "../../frontend/commonPages/profilePage.jsx";
import { useAuth } from "../context/AuthContext";
import FarmerSidebar from "../../frontend/components/FarmerSidebar/FarmerSidebar";
import BuyerSidebar from "../../frontend/components/BuyerSidebar/BuyerSidebar";
import "../../frontend/components/FarmerSidebar/FarmerPageLayout.css";
import "../../frontend/components/BuyerSidebar/BuyerPageLayout.css";

export default function ProfilePage() {
    const { user } = useAuth();

    if (user?.role === "farmer") {
        return (
            <div className="farmer-page-layout">
                <FarmerSidebar />
                <div className="farmer-page-content" style={{ flexGrow: 1 }}>
                    <Profile />
                </div>
            </div>
        );
    }

    if (user?.role === "buyer") {
        return (
            <div className="buyer-page-layout">
                <BuyerSidebar />
                <div className="buyer-page-content" style={{ flexGrow: 1 }}>
                    <Profile />
                </div>
            </div>
        );
    }

    return (
        <div>
            <Profile />
        </div>
    );
}