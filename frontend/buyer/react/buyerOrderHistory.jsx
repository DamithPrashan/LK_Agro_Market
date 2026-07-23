import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../csss/BuyerOrderHistory.css";

export default function BuyerOrderHistory() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [cancelErrorMsg, setCancelErrorMsg] = useState("");
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/backend/get_buyer_orders.php?status=${activeTab}`, {
        credentials: "include"
      });
      const data = await response.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      } else {
        setError(data.message || "Failed to load orders.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleCancelClick = async (order) => {
    const status = order.orderStatus.toLowerCase();
    
    if (status === "pending") {
      const confirmCancel = window.confirm("Are you sure you want to cancel this reservation request? This action cannot be undone.");
      if (!confirmCancel) return;
      
      await executeCancellation(order.orderId);
      
    } else if (status === "accepted") {
      // Calculate hours remaining before collection date
      const collectionDate = order.date; // format YYYY-MM-DD
      const now = new Date();
      const collectionTime = new Date(collectionDate + "T00:00:00");
      
      const diffMs = collectionTime - now;
      const hoursRemaining = diffMs / (1000 * 60 * 60);
      
      if (hoursRemaining <= 48) {
        setCancelErrorMsg("This order can only be cancelled more than 48 hours before the collection date. If there's a genuine issue, please raise a complaint instead.");
        return;
      }
      
      const confirmCancel = window.confirm("Cancelling this order forfeits your 1/3 pre-payment, as it confirms your commitment to the farmer. Are you sure you want to proceed?");
      if (!confirmCancel) return;
      
      await executeCancellation(order.orderId);
    }
  };

  const executeCancellation = async (orderId) => {
    try {
      const response = await fetch("/backend/cancel_order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ orderId })
      });
      const data = await response.json();
      if (data.success) {
        setCancelSuccessMsg(data.message || "Cancellation successful.");
        fetchOrders(); // Refresh order listing
      } else {
        setCancelErrorMsg(data.message || "Cancellation failed.");
      }
    } catch (err) {
      console.error(err);
      setCancelErrorMsg("Network error trying to cancel order.");
    }
  };

  return (
    <div className="container">
      <h1>Order History</h1>

          {/* Cancellation Success/Error Modals */}
          {cancelErrorMsg && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "8px", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <h3 style={{ color: "#c0392b", marginTop: 0, marginBottom: "12px" }}>Cancellation Blocked</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", marginBottom: "20px" }}>{cancelErrorMsg}</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button 
                    onClick={() => {
                      setCancelErrorMsg("");
                      navigate("/complaints");
                    }}
                    style={{ padding: "8px 16px", background: "#1a5c2d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Go to Complaints
                  </button>
                  <button 
                    onClick={() => setCancelErrorMsg("")}
                    style={{ padding: "8px 16px", background: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {cancelSuccessMsg && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "8px", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <h3 style={{ color: "#27ae60", marginTop: 0, marginBottom: "12px" }}>Success</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", marginBottom: "20px" }}>{cancelSuccessMsg}</p>
                <button 
                  onClick={() => setCancelSuccessMsg("")}
                  style={{ padding: "8px 16px", background: "#27ae60", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "accepted", label: "Accepted" },
              { id: "completed", label: "Completed" }
            ].map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "tab active" : "tab"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="orders">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", width: "100%", color: "#666" }}>
                Loading your orders...
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px", width: "100%", color: "#e74c3c" }}>
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", width: "100%", color: "#7f8c8d" }}>
                No orders found for this status.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.orderId} className={`order-card ${order.orderStatus}`}>
                  
                  <div className="order-header">
                    <h3>{order.cropName}</h3>
                    <span className={`status ${order.orderStatus}`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="order-body">
                    <p><b>Order ID:</b> {order.orderId}</p>
                    <p><b>Quantity:</b> {order.quantity} {order.unit}</p>
                    <p><b>Date:</b> {order.date}</p>
                    <p><b>Total:</b> Rs. {order.total.toLocaleString()}</p>
                  </div>

                  {/* Conditional Footer Layout */}
                  {order.orderStatus.toLowerCase() === "pending" ? (
                    <div className="order-footer" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", marginTop: "15px" }}>
                      <span className={`payment ${order.paymentStatus}`}>
                        Payment: {order.paymentStatus.toUpperCase()}
                      </span>
                      <button 
                        className="view-btn" 
                        onClick={() => handleCancelClick(order)}
                        style={{ background: "#e74c3c", color: "white", cursor: "pointer" }}
                      >
                        Cancel Order
                      </button>
                    </div>
                  ) : (
                    <div className="order-footer" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", marginTop: "15px", flexWrap: "wrap" }}>
                      <span className={`payment ${order.paymentStatus}`}>
                        Payment: {order.paymentStatus.toUpperCase()}
                      </span>
                      
                      {/* Action buttons grouped on the right */}
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {order.orderStatus.toLowerCase() === "accepted" && 
                         order.paymentStatus.toLowerCase() !== "paid" && (
                          <button 
                            className="cancel-order-action-btn"
                            onClick={() => handleCancelClick(order)}
                          >
                            Cancel Order
                          </button>
                        )}

                        {(order.orderStatus.toLowerCase() === "accepted" && 
                         (order.paymentStatus.toLowerCase() === "unpaid" || order.paymentStatus.toLowerCase() === "partial")) ? (
                          <button 
                            className="view-btn" 
                            onClick={() => navigate(`/payment/${order.orderId}`)}
                            style={{ background: "#27ae60", color: "white", cursor: "pointer" }}
                          >
                            {order.paymentStatus.toLowerCase() === "partial" ? "Complete Payment" : "Pay Now"}
                          </button>
                        ) : (
                          <button className="view-btn">View</button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
  );
}