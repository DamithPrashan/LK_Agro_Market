import React, { useState } from "react";
import "../csss/BuyerOrderHistory.css";

export default function BuyerOrderHistory() {
  const [activeTab, setActiveTab] = useState("all");

  const orders = [
    {
      id: "ORD1001",
      product: "Fresh Tomatoes",
      qty: "5kg",
      price: 2500,
      status: "pending",
      payment: "unpaid",
      date: "2026-06-15",
    },
    {
      id: "ORD1002",
      product: "Carrots",
      qty: "3kg",
      price: 1800,
      status: "accepted",
      payment: "partial",
      date: "2026-06-14",
    },
    {
      id: "ORD1003",
      product: "Rice",
      qty: "10kg",
      price: 8500,
      status: "completed",
      payment: "paid",
      date: "2026-06-10",
    },
    {
      id: "ORD1004",
      product: "Onions",
      qty: "2kg",
      price: 900,
      status: "pending",
      payment: "unpaid",
      date: "2026-06-16",
    },
  ];

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  return (
    <div className="container">
      <h1>Order History</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "all" ? "tab active" : "tab"}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>

        <button
          className={activeTab === "pending" ? "tab active" : "tab"}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>

        <button
          className={activeTab === "accepted" ? "tab active" : "tab"}
          onClick={() => setActiveTab("accepted")}
        >
          Accepted
        </button>

        <button
          className={activeTab === "completed" ? "tab active" : "tab"}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
      </div>

      {/* Orders */}
      <div className="orders">
        {filteredOrders.map((order) => (
          <div key={order.id} className={`order-card ${order.status}`}>
            
            <div className="order-header">
              <h3>{order.product}</h3>
              <span className={`status ${order.status}`}>
                {order.status.toUpperCase()}
              </span>
            </div>

            <div className="order-body">
              <p><b>Order ID:</b> {order.id}</p>
              <p><b>Quantity:</b> {order.qty}</p>
              <p><b>Date:</b> {order.date}</p>
              <p><b>Total:</b> Rs. {order.price}</p>
            </div>

            <div className="order-footer">
              <span className={`payment ${order.payment}`}>
                Payment: {order.payment.toUpperCase()}
              </span>

              <button className="view-btn">View</button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}