import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../src/context/AuthContext";
import { readJsonResponse } from "../utils/readJsonResponse";

const fmt = (n) => "Rs " + Number(n).toLocaleString("en-LK");

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

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
        setError(t("payment.errorNoOrderId", "No order ID provided."));
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
        const data = await readJsonResponse(res, t("errors.networkXamppError"));
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.message || t("payment.loading"));
        }
      } catch (err) {
        console.error(err);
        setError(t("errors.networkXamppError"));
      } finally {
        setFetchLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (method === "bank" && !proof) {
      setError(t("payment.errorNoProof"));
      return;
    }
    setLoading(true);
    setError("");

    const isPrePayment = order.paymentStatus === "pending";
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
      const data = await readJsonResponse(res, t("errors.submissionFailed"));
      if (data.success) {
        setDone(true);
      } else {
        setError(data.message || t("errors.submissionFailed"));
      }
    } catch (err) {
      console.error(err);
      setError(t("errors.networkXamppError"));
    } finally {
      setLoading(false);
    }
  };

  const handlePayHerePayment = async () => {
    if (!window.payhere) {
      setError(t("payment.errorPayHereUnav"));
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
        setError(hashData.message || t("errors.submissionFailed"));
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
            setError(data.message || t("errors.submissionFailed"));
          }
        } catch (err) {
          console.error(err);
          setError(t("errors.networkXamppError"));
        } finally {
          setLoading(false);
        }
      };

      window.payhere.onDismissed = function () {
        console.log("PayHere Payment dismissed");
        setError(t("payment.errorDismissed"));
        setLoading(false);
      };

      window.payhere.onError = function (errorMsg) {
        console.log("PayHere Error:" + errorMsg);
        setError(t("payment.errorGateway", "Payment gateway error:") + " " + errorMsg);
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
        items: `${order.cropName} x ${order.quantity}${order.unit}`,
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
      setError(t("payment.errorPayHereUnav"));
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
        <h3>{t("payment.loading")}</h3>
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
        <h2 style={{ color: "#c0392b", marginBottom: "15px" }}>{t("payment.errorTitle")}</h2>
        <p style={{ marginBottom: "25px", textAlign: "center" }}>{error}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/buyer/BuyerOrderHistory")}
            style={{ cursor: "pointer", padding: "8px 16px" }}
          >
            {t("payment.btnHistory")}
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
            {t("payment.btnBack")}
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
              {isPrePayment ? t("payment.successPrepaymentTitle") : t("payment.successCompleteTitle")}
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
                ? t("payment.successPrepaymentMsg", { amount: fmt(amountDue) })
                : t("payment.successCompleteMsg", { amount: fmt(amountDue) })}
            </p>
            <div style={s.sumBox}>
              {[
                [t("payment.summaryOrder"), `#${order.id}`],
                [t("payment.summaryCrop"), `${order.cropName} · ${order.quantity} ${order.unit}`],
                [t("payment.summaryAmountPaid"), fmt(amountDue)],
                ...(isPrePayment
                  ? [[t("payment.summaryBalance"), fmt(balance)]]
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
                {t("payment.btnViewOrders")}
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate("/browse")}
              >
                {t("payment.btnBrowseMore")}
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
            ← {t("payment.btnBack")}
          </button>
          <h1 style={s.heading}>
            {isPrePayment ? t("payment.titlePrepayment") : t("payment.titleBalance")}
          </h1>
          <p style={{ fontSize: 12, color: "var(--t-3)", marginBottom: 18 }}>
            {t("payment.subtitleSecure", { id: order.id })}
          </p>

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
                {order.cropName} — {fmt(order.pricePerUnit)}/{order.unit}
              </div>
              {order.source === "cultivation" && (
                <div style={{ fontSize: 11, color: "var(--g-600)", fontWeight: 600 }}>
                  Cultivation Agreement
                </div>
              )}
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
                    {t("payment.verified")}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--t-2)" }}>
                {order.quantity} {order.unit} · Collection {order.collectionDate}
              </div>
            </div>
          </div>

          <div style={s.payBox}>
            <p className="section-label" style={{ marginBottom: 10 }}>
              {t("payment.breakdownTitle")}
            </p>
            <div style={s.payRow}>
              <span>
                {order.quantity} {order.unit} × {fmt(order.pricePerUnit)}
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
                {isPrePayment ? t("payment.prepaymentDue") : t("payment.balanceDue")}
              </span>
              <span
                style={{ fontWeight: 700, fontSize: 15, color: "var(--a-600)" }}
              >
                {fmt(amountDue)}
              </span>
            </div>
            {isPrePayment && (
              <div style={{ ...s.payRow, color: "var(--t-3)", marginTop: 6 }}>
                <span>{t("payment.summaryBalance")}</span>
                <span style={{ fontWeight: 600 }}>{fmt(balance)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card" style={{ marginBottom: 14 }}>
              <p className="section-label" style={{ marginBottom: 12 }}>
                {t("payment.methodTitle")}
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
                    label: t("payment.methodBank"),
                    sub: t("payment.methodBankSub"),
                  },
                  {
                    id: "lanka",
                    icon: "💳",
                    label: t("payment.methodLanka"),
                    sub: t("payment.methodLankaSub"),
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
                    {t("payment.uploadTitle")}
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
                        : t("payment.uploadPlaceholder")}
                    </p>
                  </div>
                </div>
              )}

              {method === "lanka" && <div style={s.detailBox}></div>}
            </div>

            <div className="info-green">
              {t("payment.securityNote")}
            </div>

            {error && <div className="info-red">{error}</div>}

            {method === "bank" && (
              <button className="btn btn-primary btn-lg btn-full" type="button" disabled={loading}
                onClick={(e) => {
                  if (!proof) {
                    setError(t("payment.errorNoProof"));
                    return;
                  }

                  handleSubmit(e);
                }}
              >
                {loading ? t("payment.btnSubmitting") : t("payment.btnConfirm", { amount: fmt(amountDue) })}
              </button>
            )}

            {method === "lanka" && (
              <button
                className="btn btn-primary btn-lg btn-full"
                type="button"
                disabled={loading}
                onClick={handlePayHerePayment}
              >
                {loading ? t("payment.btnProcessing") : t("payment.btnProceed", { amount: fmt(amountDue) })}
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
