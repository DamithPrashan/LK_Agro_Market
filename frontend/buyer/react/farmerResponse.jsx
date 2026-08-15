import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function FarmerResponseRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const search = location.search;
    if (search) {
      if (search.includes("tab=")) {
        navigate(`/buyer/complaints${search}`, { replace: true });
      } else {
        navigate(`/buyer/complaints${search}&tab=farmer_response`, { replace: true });
      }
    } else {
      navigate("/buyer/complaints?tab=farmer_response", { replace: true });
    }
  }, [navigate, location]);

  return (
    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
      <p>Redirecting to Farmer Response...</p>
    </div>
  );
}

export default FarmerResponseRedirect;
