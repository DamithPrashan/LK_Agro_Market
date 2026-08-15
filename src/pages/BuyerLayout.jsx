import React from "react";
import { Outlet } from "react-router-dom";
import BuyerSidebar from "../../frontend/components/BuyerSidebar/BuyerSidebar";
import "../../frontend/components/BuyerSidebar/BuyerPageLayout.css";

export default function BuyerLayout({ children }) {
  return (
    <div className="buyer-page-layout">
      <BuyerSidebar />
      <div className="buyer-page-content">
        {children || <Outlet />}
      </div>
    </div>
  );
}


