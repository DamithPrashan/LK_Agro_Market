import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiHash,
  FiMessageCircle,
  FiPackage
} from "react-icons/fi";
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

const formatCropName = (cropName = "") =>
  cropName.charAt(0).toUpperCase() + cropName.slice(1);

const getOrderLabel = (translatedValue) => translatedValue.split(":")[0].trim();

const OrderDetailRow = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`order-detail-row ${className}`.trim()}>
    <span className="order-detail-label">
      <Icon className="order-detail-icon" aria-hidden="true" />
      {label}
    </span>
    {value !== undefined && <strong className="order-detail-value">{value}</strong>}
  </div>
);

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
      
    } else if (status === "accepted") {
      if (!order.date) {
        setCancelErrorMsg(t("growingPeriod.cancellationDeferred"));
        return;
      }
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
    <div className="buyer-order-history">
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
                    <div className="order-title">
                      <h3>{formatCropName(order.cropName)}</h3>
                      <span className="order-type">
                        {order.reservationSource === "cultivation"
                          ? t("orderPresentation.cultivationOrder")
                          : t("orderPresentation.availableCrop")}
                      </span>
                    </div>
                    <span className={`status ${order.orderStatus}`}>
                      {t(lifecycleKeyMap[order.lifecycleStatus] || statusKeyMap[order.orderStatus.toLowerCase()] || order.orderStatus).toUpperCase()}
                    </span>
                  </div>

                  <div className="order-body">
                    <OrderDetailRow icon={FiHash} label={getOrderLabel(t("orders.orderId", { id: "" }))} value={order.orderId} />
                    <OrderDetailRow icon={FiPackage} label={getOrderLabel(t("orders.quantity", { qty: "", unit: "" }))} value={`${order.quantity} ${order.unit}`} />
                    <OrderDetailRow icon={FiCalendar} label={getOrderLabel(t("orders.date", { date: "" }))} value={order.date || t("growingPeriod.toBeConfirmed")} />
                    {order.reservationSource === "cultivation" && order.timingModel === "growing_period" && <>
                      <OrderDetailRow icon={FiCalendar} label={t("growingPeriod.plannedCultivationStart")} value={order.plannedStartDate || "—"} />
                      <OrderDetailRow icon={FiClock} label={t("growingPeriod.label")} value={`~${order.agreedGrowingPeriodDays} ${t("growingPeriod.units.days")}`} />
                      <OrderDetailRow icon={FiCheckCircle} label={t("growingPeriod.actualStart")} value={order.cultivationStartedAt ? String(order.cultivationStartedAt).slice(0, 10) : t("growingPeriod.notStarted")} />
                      {order.plannedStartDate && !order.cultivationStartedAt && new Date().toISOString().slice(0,10) > order.plannedStartDate && <OrderDetailRow icon={FiAlertCircle} label={t("growingPeriod.startDelayed")} className="order-detail-notice" />}
                      {order.estimatedHarvestDate && <OrderDetailRow icon={FiCalendar} label={t("growingPeriod.estimatedHarvest")} value={order.estimatedHarvestDate} />}
                      {order.cultivationAdStatus === "harvested" && <OrderDetailRow icon={FiCheckCircle} label={t("growingPeriod.harvestCompleted")} className="order-detail-notice" />}
                    </>}
                    <OrderDetailRow icon={FiDollarSign} label={getOrderLabel(t("orders.total", { total: "" }))} value={`Rs. ${order.total.toLocaleString()}`} className="order-total-row" />
                    {order.bankPaymentStatus === "pending" && <OrderDetailRow icon={FiAlertCircle} label={t("payment.bankOrderPending")} className="bank-payment-state pending order-detail-notice" />}
                    {order.bankPaymentStatus === "failed" && <OrderDetailRow icon={FiAlertCircle} label={t("payment.bankOrderRejected")} className="bank-payment-state failed order-detail-notice" />}
                  </div>

                  {/* Conditional Footer Layout */}
                  {order.orderStatus.toLowerCase() === "pending" ? (
                    <div className="order-footer">
                      <span className={`payment ${order.paymentStatus}`}>
                        {t("orders.payment", { status: order.paymentStatus.toUpperCase() })}
                      </span>
                      <div className="order-actions">
                        <button
                          className="view-btn message-farmer-btn"
                          onClick={() => {
                            setActiveChatOrder(order);
                            setIsChatOpen(true);
                          }}
                        >
                          <FiMessageCircle aria-hidden="true" /> {t("btn_message_farmer")}
                          {order.unreadMessages > 0 && (
                            <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "#e74c3c", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: "bold", zIndex: 5 }}>
                              {order.unreadMessages}
                            </span>
                          )}
                        </button>
                        <button 
                          className="cancel-order-action-btn"
                          onClick={() => handleCancelClick(order)}
                        >
                          {t("buttons.cancelOrder", "Cancel Order")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="order-footer">
                      <span className={`payment ${order.paymentStatus}`}>
                        {t("orders.payment", { status: order.paymentStatus.toUpperCase() })}
                      </span>
                      
                      {/* Action buttons grouped on the right */}
                      <div className="order-actions">
                        <button
                          className="view-btn message-farmer-btn"
                          onClick={() => {
                            setActiveChatOrder(order);
                            setIsChatOpen(true);
                          }}
                        >
                          <FiMessageCircle aria-hidden="true" /> {t("btn_message_farmer")}
                          {order.unreadMessages > 0 && (
                            <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "#e74c3c", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: "bold", zIndex: 5 }}>
                              {order.unreadMessages}
                            </span>
                          )}
                        </button>

                        {order.reservationSource === "crop" && order.orderStatus.toLowerCase() === "accepted" &&
                         order.paymentStatus.toLowerCase() !== "paid" && (
                          <button 
                            className="cancel-order-action-btn"
                            onClick={() => handleCancelClick(order)}
                          >
                            {t("buttons.cancelOrder", "Cancel Order")}
                          </button>
                        )}

                        {order.bankPaymentStatus !== "pending" && ((order.orderStatus.toLowerCase() === "accepted" && order.paymentStatus.toLowerCase() === "unpaid" && (order.reservationSource !== "cultivation" || order.timingModel !== "growing_period" || order.plannedStartDate)) ||
                         (order.orderStatus.toLowerCase() === "ready" && order.paymentStatus.toLowerCase() === "partial")) && (
                          <button 
                            className="view-btn payment-action-btn"
                            onClick={() => navigate(`/payment/${order.orderId}`)}
                          >
                            {order.bankPaymentStatus === "failed" ? t("payment.retryBankPayment") : order.paymentStatus.toLowerCase() === "partial"
                              ? t("orderPresentation.payRemaining")
                              : t("orderPresentation.payAdvance")}
                          </button>
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
