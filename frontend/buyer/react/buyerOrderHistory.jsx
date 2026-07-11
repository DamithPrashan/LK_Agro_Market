import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../csss/BuyerOrderHistory.css";

export default function BuyerOrderHistory() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  return (
    <div className="container">
      <h1>Order History</h1>

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

              <div className="order-footer">
                <span className={`payment ${order.paymentStatus}`}>
                  Payment: {order.paymentStatus.toUpperCase()}
                </span>

                {/* Pay Now or Complete Payment button if order is accepted and unpaid/partial */}
                {(order.orderStatus.toLowerCase() === "accepted") && 
                (order.paymentStatus.toLowerCase() === "unpaid" || order.paymentStatus.toLowerCase() === "partial") ? (
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
          ))
        )}
      </div>
    </div>
  );
}