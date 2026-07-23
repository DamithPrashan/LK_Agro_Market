import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../../src/context/AuthContext";

const fmt = (n) => "Rs " + Number(n).toLocaleString("en-LK");

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [method, setMethod] = useState("bank");
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("No order ID provided.");
        setFetchLoading(false);
        return;
      }
      setFetchLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/backend/get_order_payment_details.php?orderId=${orderId}`,
          {
            credentials: "include",
          },
        );
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.message || "Failed to load order payment details.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error loading order payment details.");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (method === "bank" && !proof) {
      setError("Please upload your payment receipt or screenshot.");
      return;
    }
    setLoading(true);
    setError("");

    const isPrePayment = order.paymentStatus === "pending";
    const total = order.subtotal;
    const amountDue = isPrePayment
      ? order.prePaymentDue
      : order.balanceOnCollection;

    const body = new FormData();
    body.append("order_id", order.id);
    body.append("payment_type", isPrePayment ? "prepayment" : "balance");
    body.append("amount", amountDue);
    body.append("method", method);
    body.append("proof", proof);

    try {
      const res = await fetch("/backend/Apis/submit_payment.php", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.message || "Payment submission failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayHerePayment = async () => {
    if (!window.payhere) {
      setError("PayHere payment gateway is currently unavailable. Please refresh or try again.");
      return;
    }

    setLoading(true);
    setError("");

    const isPrePayment = order.paymentStatus === "pending";
    const amountDue = isPrePayment
      ? order.prePaymentDue
      : order.balanceOnCollection;

    const paymentType = isPrePayment ? "prepayment" : "balance";

    try {
      // 1. Get payment hash from backend
      const hashRes = await fetch("/backend/Apis/get_payhere_hash.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.orderId,
          amount: amountDue,
          currency: "LKR",
        }),
      });

      const hashData = await hashRes.json();
      if (!hashData.success) {
        setError(hashData.message || "Failed to initiate payment gateway.");
        setLoading(false);
        return;
      }

      // 2. Set up PayHere callbacks
      window.payhere.onCompleted = async function (payhereOrderId) {
        console.log("PayHere Payment completed. OrderID:" + payhereOrderId);
        // Call backend submit_payment.php to record payment in DB
        const body = new FormData();
        body.append("order_id", order.id);
        body.append("payment_type", paymentType);
        body.append("amount", amountDue);
        body.append("method", "lanka");

        try {
          const res = await fetch("/backend/Apis/submit_payment.php", {
            method: "POST",
            body,
            credentials: "include",
          });
          const data = await res.json();
          if (data.success) {
            setDone(true);
          } else {
            setError(data.message || "Payment verification failed.");
          }
        } catch (err) {
          console.error(err);
          setError("Network error verifying payment.");
        } finally {
          setLoading(false);
        }
      };

      window.payhere.onDismissed = function () {
        console.log("PayHere Payment dismissed");
        setError("Payment was dismissed/cancelled.");
        setLoading(false);
      };

      window.payhere.onError = function (errorMsg) {
        console.log("PayHere Error:" + errorMsg);
        setError("Payment gateway error: " + errorMsg);
        setLoading(false);
      };

      // 3. Construct payment details and start payment
      const paymentObj = {
        sandbox: hashData.sandbox,
        merchant_id: hashData.merchant_id,
        return_url: window.location.origin + "/buyer/buyerorderhistory",
        cancel_url: window.location.href,
        notify_url: window.location.origin + "/backend/Apis/payhere_notify.php",
        order_id: order.orderId,
        items: `${order.cropName} x ${order.quantity}kg`,
        amount: Number(amountDue).toFixed(2),
        currency: "LKR",
        hash: hashData.hash,
        first_name: user?.name?.split(" ")[0] || "Buyer",
        last_name: user?.name?.split(" ").slice(1).join(" ") || "User",
        email: user?.email || "buyer@test.com",
        phone: user?.contact || "0771234567",
        address: user?.district || "Sri Lanka",
        city: user?.district || "Colombo",
        country: "Sri Lanka",
      };

      window.payhere.startPayment(paymentObj);
    } catch (err) {
      console.error(err);
      setError("Failed to start PayHere gateway. Please try again.");
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h3>Loading order payment details...</h3>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#c0392b", marginBottom: "15px" }}>Error</h2>
        <p style={{ marginBottom: "25px", textAlign: "center" }}>{error}</p>
        {/* edit for payment page confirm */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/buyer/BuyerOrderHistory")}
            style={{ cursor: "pointer", padding: "8px 16px" }}
          >
            Go to Order History
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate(-1)}
            style={{
              cursor: "pointer",
              padding: "8px 16px",
              background: "none",
              border: "1px solid #ccc",
              borderRadius: "var(--r-md)",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isPrePayment = order.paymentStatus === "pending";
  const total = order.subtotal;
  const amountDue = isPrePayment
    ? order.prePaymentDue
    : order.balanceOnCollection;
  const balance = order.balanceOnCollection;

  if (done) {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <main style={s.page}>
          <div
            className="card"
            style={{
              maxWidth: 460,
              width: "100%",
              textAlign: "center",
              padding: "32px 28px",
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--g-800)",
                marginBottom: 8,
              }}
            >
              {isPrePayment ? "Pre-Payment Confirmed!" : "Payment Complete!"}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--t-2)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {isPrePayment
                ? `Your 1/3 pre-payment of ${fmt(amountDue)} has been recorded. The farmer has been notified.`
                : `Your final payment of ${fmt(amountDue)} has been recorded. Transaction is complete.`}
            </p>
            <div style={s.sumBox}>
              {[
                ["Order", `#${order.id}`],
                ["Crop", `${order.cropName} · ${order.quantity} kg`],
                ["Amount paid", fmt(amountDue)],
                ...(isPrePayment
                  ? [["Balance on collection", fmt(balance)]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} style={s.sumRow}>
                  <span>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/buyer/BuyerOrderHistory")}
              >
                View My Orders
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate("/browse")}
              >
                Browse More
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <main style={s.page}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <button onClick={() => navigate(-1)} style={s.back}>
            ← Back
          </button>
          <h1 style={s.heading}>
            {isPrePayment ? "Pre-Payment (1/3)" : "Final Balance Payment"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--t-3)", marginBottom: 18 }}>
            Order #{order.id} — Secure platform payment
          </p>

          {/* Order summary */}
          <div
            className="card"
            style={{
              marginBottom: 14,
              display: "flex",
              gap: 14,
              alignItems: "center",
              borderColor: "var(--g-100)",
            }}
          >
            <div style={{ fontSize: 38, flexShrink: 0 }}>{order.cropEmoji}</div>
            <div>
              <div
                style={{ fontSize: 15, fontWeight: 700, color: "var(--g-800)" }}
              >
                {order.cropName} — {fmt(order.pricePerUnit)}/kg
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--t-3)",
                  margin: "2px 0 4px",
                }}
              >
                {order.farmerName}
                {order.farmerVerified && (
                  <span
                    className="badge badge-green"
                    style={{ marginLeft: 6, fontSize: 9 }}
                  >
                    ✓ Verified
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--t-2)" }}>
                {order.quantity} kg · Collection {order.collectionDate}
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          <div style={s.payBox}>
            <p className="section-label" style={{ marginBottom: 10 }}>
              Payment Breakdown
            </p>
            <div style={s.payRow}>
              <span>
                {order.quantity} kg × {fmt(order.pricePerUnit)}
              </span>
              <span style={s.payTotal}>{fmt(total)}</span>
            </div>
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--g-100)",
                margin: "8px 0",
              }}
            />
            <div
              style={{
                ...s.payRow,
                background: "var(--a-50)",
                margin: "0 -16px",
                padding: "8px 16px",
              }}
            >
              <span style={{ fontWeight: 700 }}>
                {isPrePayment ? "1/3 Pre-payment due now" : "Balance due now"}
              </span>
              <span
                style={{ fontWeight: 700, fontSize: 15, color: "var(--a-600)" }}
              >
                {fmt(amountDue)}
              </span>
            </div>
            {isPrePayment && (
              <div style={{ ...s.payRow, color: "var(--t-3)", marginTop: 6 }}>
                <span>Balance on collection</span>
                <span style={{ fontWeight: 600 }}>{fmt(balance)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Payment method */}
            <div className="card" style={{ marginBottom: 14 }}>
              <p className="section-label" style={{ marginBottom: 12 }}>
                Payment Method
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  {
                    id: "bank",
                    icon: "🏦",
                    label: "Bank Transfer",
                    sub: "IPG / Internet Banking",
                  },
                  {
                    id: "lanka",
                    icon: "💳",
                    label: "PayHere",
                    sub: "Online Payment",
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    style={{
                      ...s.methBtn,
                      ...(method === m.id ? s.methActive : {}),
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{m.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--t-3)" }}>
                      {m.sub}
                    </span>
                  </button>
                ))}
              </div>

              {method === "bank" && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <p className="section-label" style={{ marginBottom: 10 }}>
                    Upload Payment Proof
                  </p>
                  <div
                    className="upload-zone"
                    style={
                      proof
                        ? {
                          borderColor: "var(--g-400)",
                          background: "var(--g-50)",
                        }
                        : {}
                    }
                    onClick={() =>
                      document.getElementById("proof-upload").click()
                    }
                  >
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/*,.pdf"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        setProof(e.target.files[0]);
                        setError("");
                      }}
                    />
                    <span>{proof ? "✅" : "📄"}</span>
                    <p>
                      {proof
                        ? proof.name
                        : "Click to upload receipt or screenshot (JPG / PNG / PDF · max 5 MB)"}
                    </p>
                  </div>
                </div>
              )}

              {method === "lanka" && <div style={s.detailBox}></div>}
            </div>

            <div className="info-green">
              🔒 Payments are processed securely through LK Agro Market. Your
              bank details are never shared with the farmer.
            </div>

            {error && <div className="info-red">{error}</div>}

            {method === "bank" && (
              <button className="btn btn-primary btn-lg btn-full" type="button" disabled={loading}
                onClick={(e) => {
                  if (!proof) {
                    setError("Please upload your payment receipt or screenshot.",);
                    return;
                  }

                  handleSubmit(e);
                }}
              >
                {loading ? "Submitting…" : `Confirm Payment — ${fmt(amountDue)}`}
              </button>
            )}

            {method === "lanka" && (
              <button
                className="btn btn-primary btn-lg btn-full"
                type="button"
                disabled={loading}
                onClick={handlePayHerePayment}
              >
                {loading ? "Processing..." : `Confirm Payment — ${fmt(amountDue)}`}
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

const s = {
  page: {
    flex: 1,
    background: "var(--page)",
    display: "flex",
    justifyContent: "center",
    padding: "28px 16px",
  },
  back: {
    background: "none",
    border: "none",
    color: "var(--g-600)",
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 14,
    padding: 0,
  },
  heading: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  payBox: {
    background: "var(--g-50)",
    border: "1px solid var(--g-100)",
    borderRadius: "var(--r-lg)",
    padding: "14px 16px",
    marginBottom: 14,
  },
  payRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "4px 0",
  },
  payTotal: { fontWeight: 700, fontSize: 14, color: "var(--g-800)" },
  methBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "12px 8px",
    border: "2px solid var(--s-200)",
    borderRadius: "var(--r-lg)",
    background: "var(--white)",
    cursor: "pointer",
    transition: "all .15s",
  },
  methActive: { borderColor: "var(--g-600)", background: "var(--g-50)" },
  detailBox: {
    background: "var(--s-50)",
    borderRadius: "var(--r-md)",
    padding: "12px 14px",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "5px 14px",
    fontSize: 12,
  },
  sumBox: {
    background: "var(--s-50)",
    borderRadius: "var(--r-md)",
    padding: "12px 14px",
    textAlign: "left",
  },
  sumRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "4px 0",
    borderBottom: "1px solid var(--s-200)",
  },
};
