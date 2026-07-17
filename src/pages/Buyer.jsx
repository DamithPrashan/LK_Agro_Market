import BuyerDashboard from "../../frontend/buyer/react/buyerDashboard";
import BuyerSidebar from "../../frontend/components/BuyerSidebar/BuyerSidebar";
import "../../frontend/components/BuyerSidebar/BuyerPageLayout.css";

export default function Buyer() {
  return (
    <div className="buyer-page-layout">
      <BuyerSidebar />
      <div className="buyer-page-content">
        <BuyerDashboard />
      </div>
    </div>
  );
}

