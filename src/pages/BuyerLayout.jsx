import React from "react";
import { Outlet } from "react-router-dom";
import BuyerSidebar from "../../frontend/components/BuyerSidebar/BuyerSidebar";
import "../../frontend/components/BuyerSidebar/BuyerPageLayout.css";

export default function BuyerLayout() {
  return (
    <div className="buyer-page-layout">
      <BuyerSidebar />
      <div className="buyer-page-content">
        <Outlet />
      </div>
    </div>
  );
}
