import React from "react";
import { Outlet } from "react-router-dom";
import FarmerSidebar from "../../frontend/components/FarmerSidebar/FarmerSidebar";
import "../../frontend/components/FarmerSidebar/FarmerPageLayout.css";

export default function FarmerLayout() {
  return (
    <div className="farmer-page-layout">
      <FarmerSidebar />
      <div className="farmer-page-content">
        <Outlet />
      </div>
    </div>
  );
}
