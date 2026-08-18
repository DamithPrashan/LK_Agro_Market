import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../csss/BuyerOrderHistory.css";
import { useAuth } from "../../../src/context/AuthContext";
import MessageModal from "../../components/MessageModal";

const statusKeyMap = {
  "ready": "orders.status.ready",
  "pending": "orders.status.pending",
  "accepted": "orders.status.accepted",
  "declined": "orders.status.declined",
  "cancelled": "orders.status.declined",
  "completed": "orders.status.completed"
};

const lifecycleKeyMap = {
  pending: "orders.status.pending",
  awaiting_advance: "orderPresentation.awaitingAdvance",
  in_preparation: "orderPresentation.inPreparation",
  final_payment_required: "orderPresentation.finalPaymentRequired",
  awaiting_completion: "orderPresentation.awaitingCompletion",
  completed: "orders.status.completed",
  cancelled: "orderPresentation.cancelled"
};

export default function BuyerOrderHistory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [cancelErrorMsg, setCancelErrorMsg] = useState("");
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);

  const navigate = useNavigate();
  const { t } = useTranslation();

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
        setError(data.message || t("errors.failedFetchOrders"));
      }
    } catch (err) {
      console.error(err);
      setError(t("errors.failedFetchOrders"));
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOrders();
      // fetchOrders reads activeTab, which is the explicit refresh trigger here.
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleCancelClick = async (order) => {
    const status = order.orderStatus.toLowerCase();
    
    if (status === "pending") {
      const confirmCancel = window.confirm(t("confirmations.cancelPendingOrder"));
      if (!confirmCancel) return;
      
      await executeCancellation(order.orderId);
      
    } else if (status === "accepted" || status === "ready") {
      // Calculate hours remaining before collection date
      const collectionDate = order.date; // format YYYY-MM-DD
      const now = new Date();
      const collectionTime = new Date(collectionDate + "T00:00:00");
      
      const diffMs = collectionTime - now;
      const hoursRemaining = diffMs / (1000 * 60 * 60);
      
      if (hoursRemaining <= 48) {
        setCancelErrorMsg(t("orders.cancelErrorTime"));
        return;
      }
      
      const confirmCancel = window.confirm(t("confirmations.cancelAcceptedOrder"));
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
        setCancelSuccessMsg(data.message || t("orders.cancellationSuccessful"));
        fetchOrders(); // Refresh order listing
      } else {
        setCancelErrorMsg(data.message || t("orders.cancellationFailed"));
      }
    } catch (err) {
      console.error(err);
      setCancelErrorMsg(t("errors.networkXamppError"));
    }
  };

  return (
    <div className="container">
      <h1>{t("orders.historyTitle")}</h1>

          {/* Cancellation Success/Error Modals */}
          {cancelErrorMsg && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "8px", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <h3 style={{ color: "#c0392b", marginTop: 0, marginBottom: "12px" }}>{t("orders.cancelBlockedTitle")}</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", marginBottom: "20px" }}>{cancelErrorMsg}</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button 
                    onClick={() => {
                      setCancelErrorMsg("");
                      navigate("/complaints");
                    }}
                    style={{ padding: "8px 16px", background: "#1a5c2d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                  >
                    {t("buttons.submitComplaint")}
                  </button>
                  <button 
                    onClick={() => setCancelErrorMsg("")}
                    style={{ padding: "8px 16px", background: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
                  >
                    {t("buttons.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {cancelSuccessMsg && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
              <div style={{ background: "white", padding: "24px", borderRadius: "8px", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <h3 style={{ color: "#27ae60", marginTop: 0, marginBottom: "12px" }}>{t("profile.badgeComplete", "Success")}</h3>
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
              { id: "all", label: t("orders.tabAll") },
              { id: "pending", label: t("orders.tabPending") },
              { id: "accepted", label: t("orders.tabAccepted") },
              { id: "completed", label: t("orders.tabCompleted") }
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
                {t("orders.loadingOrders")}
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px", width: "100%", color: "#e74c3c" }}>
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", width: "100%", color: "#7f8c8d" }}>
                {t("orders.noOrders")}
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.orderId} className={`order-card ${order.orderStatus}`}>
                  
                  <div className="order-header">
                    <h3>
                      {order.cropName}
                      <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 600, color: "var(--g-600)" }}>
                        {order.reservationSource === "cultivation"
                          ? t("orderPresentation.cultivationOrder")
                          : t("orderPresentation.availableCrop")}
                      </span>
                    </h3>
                    <span className={`status ${order.orderStatus}`}>
                      {t(lifecycleKeyMap[order.lifecycleStatus] || statusKeyMap[order.orderStatus.toLowerCase()] || order.orderStatus).toUpperCase()}
                    </span>
                  </div>

                  <div className="order-body">
                    <p>{t("orders.orderId", { id: order.orderId })}</p>
                    <p>{t("orders.quantity", { qty: order.quantity, unit: order.unit })}</p>
                    <p>{t("orders.date", { date: order.date })}</p>
                    <p>{t("orders.total", { total: order.total.toLocaleString() })}</p>
                  </div>

                  {/* Conditional Footer Layout */}
                  {order.orderStatus.toLowerCase() === "pending" ? (
                    <div className="order-footer" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", marginTop: "15px" }}>
                      <span className={`payment ${order.paymentStatus}`}>
                        {t("orders.payment", { status: order.paymentStatus.toUpperCase() })}
                      </span>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="view-btn"
                          onClick={() => {
                            setActiveChatOrder(order);
                            setIsChatOpen(true);
                          }}
                          style={{ background: "#1a5c2d", color: "white", cursor: "pointer", position: "relative" }}
                        >
                          💬 {t("btn_message_farmer")}
                          {order.unreadMessages > 0 && (
                            <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "#e74c3c", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: "bold", zIndex: 5 }}>
                              {order.unreadMessages}
                            </span>
                          )}
                        </button>
                        <button 
                          className="view-btn" 
                          onClick={() => handleCancelClick(order)}
                          style={{ background: "#e74c3c", color: "white", cursor: "pointer" }}
                        >
                          {t("buttons.cancelOrder", "Cancel Order")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="order-footer" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", marginTop: "15px", flexWrap: "wrap" }}>
                      <span className={`payment ${order.paymentStatus}`}>
                        {t("orders.payment", { status: order.paymentStatus.toUpperCase() })}
                      </span>
                      
                      {/* Action buttons grouped on the right */}
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          className="view-btn"
                          onClick={() => {
                            setActiveChatOrder(order);
                            setIsChatOpen(true);
                          }}
                          style={{ background: "#1a5c2d", color: "white", cursor: "pointer", position: "relative" }}
                        >
                          💬 {t("btn_message_farmer")}
                          {order.unreadMessages > 0 && (
                            <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "#e74c3c", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: "bold", zIndex: 5 }}>
                              {order.unreadMessages}
                            </span>
                          )}
                        </button>

                        {order.reservationSource === "crop" && (order.orderStatus.toLowerCase() === "accepted" || order.orderStatus.toLowerCase() === "ready") &&
                         order.paymentStatus.toLowerCase() !== "paid" && (
                          <button 
                            className="cancel-order-action-btn"
                            onClick={() => handleCancelClick(order)}
                          >
                            {t("buttons.cancelOrder", "Cancel Order")}
                          </button>
                        )}

                        {((order.orderStatus.toLowerCase() === "accepted" && order.paymentStatus.toLowerCase() === "unpaid") ||
                         (order.orderStatus.toLowerCase() === "ready" && order.paymentStatus.toLowerCase() === "partial")) ? (
                          <button 
                            className="view-btn" 
                            onClick={() => navigate(`/payment/${order.orderId}`)}
                            style={{ background: "#27ae60", color: "white", cursor: "pointer" }}
                          >
                            {order.paymentStatus.toLowerCase() === "partial"
                              ? t("orderPresentation.payRemaining")
                              : t("orderPresentation.payAdvance")}
                          </button>
                        ) : (
                          <button className="view-btn">{t("buttons.view")}</button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
          {isChatOpen && activeChatOrder && (
            <MessageModal
              isOpen={isChatOpen}
              onClose={() => {
                setIsChatOpen(false);
                setActiveChatOrder(null);
                fetchOrders();
              }}
              reservationId={activeChatOrder.reservationId}
              currentUserId={user?.id}
              otherUserName={activeChatOrder.farmerName}
              otherUserRole="farmer"
              cropName={activeChatOrder.cropName}
            />
          )}
        </div>
  );
}
