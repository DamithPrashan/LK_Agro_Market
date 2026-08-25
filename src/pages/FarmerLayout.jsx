import { Outlet } from "react-router-dom";
import FarmerSidebar from "../../frontend/components/FarmerSidebar/FarmerSidebar";
import RequireRole from "../components/RequireRole";
import "../../frontend/components/FarmerSidebar/FarmerPageLayout.css";

export default function FarmerLayout() {
  return (
    <RequireRole role="farmer">
      <div className="farmer-page-layout">
        <FarmerSidebar />
        <div className="farmer-page-content">
          <Outlet />
        </div>
      </div>
    </RequireRole>
  );
}
