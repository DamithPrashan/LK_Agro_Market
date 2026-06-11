<<<<<<< Updated upstream
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const fmt = (n) => "Rs " + Number(n).toLocaleString("en-LK");

// Demo order used when page is accessed directly without router state
const DEMO = {
  id: 2041, crop_name: "Tomato", crop_emoji: "🍅",
  farmer_name: "Randeniya Farm", farmer_verified: true,
  quantity: 60, price_per_unit: 85,
  collection_date: "Jun 22, 2026", payment_status: "pending",
};

export default function Payment() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const order      = location.state?.order ?? DEMO;

  const isPrePayment = order.payment_status === "pending";
  const total        = order.quantity * order.price_per_unit;
  const prePayment   = Math.round(total / 3);
  const balance      = total - prePayment;
  const amountDue    = isPrePayment ? prePayment : balance;

  const [method, setMethod]   = useState("bank");
  const [proof, setProof]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proof) { setError("Please upload your payment receipt or screenshot."); return; }
    setLoading(true); setError("");
    const body = new FormData();
    body.append("order_id",     order.id);
    body.append("payment_type", isPrePayment ? "prepayment" : "balance");
    body.append("amount",       amountDue);
    body.append("method",       method);
    body.append("proof",        proof);
    try {
      const res  = await fetch("/backend/Apis/submit_payment.php",
        { method: "POST", body, credentials: "include" });
      const data = await res.json();
      if (data.success) setDone(true);
      else setError(data.message || "Payment submission failed.");
    } catch {
      setError("Network error. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
        
        <main style={s.page}>
          <div className="card" style={{ maxWidth: 460, width: "100%", textAlign: "center", padding: "32px 28px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--g-800)", marginBottom: 8 }}>
              {isPrePayment ? "Pre-Payment Confirmed!" : "Payment Complete!"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--t-2)", marginBottom: 20, lineHeight: 1.6 }}>
              {isPrePayment
                ? `Your 1/3 pre-payment of ${fmt(amountDue)} has been recorded. The farmer has been notified.`
                : `Your final payment of ${fmt(amountDue)} has been recorded. Transaction is complete.`}
            </p>
            <div style={s.sumBox}>
              {[
                ["Order",            `#${order.id}`],
                ["Crop",             `${order.crop_name} · ${order.quantity} kg`],
                ["Amount paid",      fmt(amountDue)],
                ...(isPrePayment ? [["Balance on collection", fmt(balance)]] : []),
              ].map(([k, v]) => (
                <div key={k} style={s.sumRow}><span>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/buyer/dashboard")}>View My Orders</button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate("/buyer/browse")}>Browse More</button>
            </div>
          </div>
        </main>
        
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      
      <main style={s.page}>
        <div style={{ width:"100%", maxWidth:500 }}>
          <button onClick={() => navigate(-1)} style={s.back}>← Back</button>
          <h1 style={s.heading}>{isPrePayment ? "Pre-Payment (1/3)" : "Final Balance Payment"}</h1>
          <p style={{ fontSize:12, color:"var(--t-3)", marginBottom:18 }}>Order #{order.id} — Secure platform payment</p>

          {/* Order summary */}
          <div className="card" style={{ marginBottom:14, display:"flex", gap:14, alignItems:"center", borderColor:"var(--g-100)" }}>
            <div style={{ fontSize:38, flexShrink:0 }}>{order.crop_emoji}</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--g-800)" }}>{order.crop_name} — {fmt(order.price_per_unit)}/kg</div>
              <div style={{ fontSize:12, color:"var(--t-3)", margin:"2px 0 4px" }}>
                {order.farmer_name}
                {order.farmer_verified && <span className="badge badge-green" style={{ marginLeft:6, fontSize:9 }}>✓ Verified</span>}
              </div>
              <div style={{ fontSize:11, color:"var(--t-2)" }}>{order.quantity} kg · Collection {order.collection_date}</div>
            </div>
          </div>

          {/* Payment breakdown */}
          <div style={s.payBox}>
            <p className="section-label" style={{ marginBottom:10 }}>Payment Breakdown</p>
            <div style={s.payRow}><span>{order.quantity} kg × {fmt(order.price_per_unit)}</span><span style={s.payTotal}>{fmt(total)}</span></div>
            <hr style={{ border:"none", borderTop:"1px solid var(--g-100)", margin:"8px 0" }} />
            <div style={{ ...s.payRow, background:"var(--a-50)", margin:"0 -16px", padding:"8px 16px" }}>
              <span style={{ fontWeight:700 }}>{isPrePayment ? "1/3 Pre-payment due now" : "Balance due now"}</span>
              <span style={{ fontWeight:700, fontSize:15, color:"var(--a-600)" }}>{fmt(amountDue)}</span>
            </div>
            {isPrePayment && (
              <div style={{ ...s.payRow, color:"var(--t-3)", marginTop:6 }}>
                <span>Balance on collection</span>
                <span style={{ fontWeight:600 }}>{fmt(balance)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Payment method */}
            <div className="card" style={{ marginBottom:14 }}>
              <p className="section-label" style={{ marginBottom:12 }}>Payment Method</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                {[
                  { id:"bank",  icon:"🏦", label:"Bank Transfer",  sub:"IPG / Internet Banking" },
                  { id:"lanka", icon:"📱", label:"Lanka QR",        sub:"Mobile Payment" },
                ].map((m) => (
                  <button
                    key={m.id} type="button"
                    onClick={() => setMethod(m.id)}
                    style={{ ...s.methBtn, ...(method === m.id ? s.methActive : {}) }}
                  >
                    <span style={{ fontSize:22 }}>{m.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700 }}>{m.label}</span>
                    <span style={{ fontSize:10, color:"var(--t-3)" }}>{m.sub}</span>
                  </button>
                ))}
              </div>

              {method === "bank" && (
                <div style={s.detailBox}>
                  <p style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>Bank Transfer Details</p>
                  <div style={s.detailGrid}>
                    {[
                      ["Bank",      "Bank of Ceylon"],
                      ["Account",   "0087654321"],
                      ["Branch",    "Badulla"],
                      ["Amount",    fmt(amountDue)],
                      ["Reference", `LKA-${order.id}-${isPrePayment ? "PRE" : "BAL"}`],
                    ].map(([k, v]) => (
                      <>
                        <span key={k+"-k"} style={{ color:"var(--t-3)" }}>{k}</span>
                        <span key={k+"-v"} style={{ fontWeight:500, color: k==="Amount" ? "var(--g-800)" : "var(--t-1)", fontFamily: k==="Reference" ? "monospace" : "inherit" }}>{v}</span>
                      </>
                    ))}
                  </div>
                </div>
              )}

              {method === "lanka" && (
                <div style={s.detailBox}>
                  <p style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>Lanka QR Payment</p>
                  <p style={{ fontSize:12, color:"var(--t-2)", lineHeight:1.6 }}>
                    Scan using any Lanka QR compatible banking app.
                    Amount: <strong>{fmt(amountDue)}</strong> — Reference:
                    <code style={{ background:"var(--s-100)", padding:"1px 6px", borderRadius:3, marginLeft:4 }}>LKA-{order.id}</code>
                  </p>
                  <div style={{ width:100, height:100, background:"var(--s-100)", border:"1px solid var(--s-200)", borderRadius:"var(--r-md)", margin:"12px auto 0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"var(--t-3)", textAlign:"center" }}>
                    QR Code<br/>(generated by backend)
                  </div>
                </div>
              )}
            </div>

            {/* Proof upload */}
            <div className="card" style={{ marginBottom:14 }}>
              <p className="section-label" style={{ marginBottom:10 }}>Upload Payment Proof</p>
              <div
                className="upload-zone"
                style={proof ? { borderColor:"var(--g-400)", background:"var(--g-50)" } : {}}
                onClick={() => document.getElementById("proof-upload").click()}
              >
                <input
                  id="proof-upload" type="file" accept="image/*,.pdf"
                  style={{ display:"none" }}
                  onChange={(e) => { setProof(e.target.files[0]); setError(""); }}
                />
                <span>{proof ? "✅" : "📄"}</span>
                <p>{proof ? proof.name : "Click to upload receipt or screenshot (JPG / PNG / PDF · max 5 MB)"}</p>
              </div>
            </div>

            <div className="info-green">
              🔒 Payments are processed securely through LK Agro Market.
              Your bank details are never shared with the farmer.
            </div>

            {error && <div className="info-red">{error}</div>}

            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
              {loading ? "Submitting…" : `Confirm Payment — ${fmt(amountDue)}`}
            </button>
          </form>
        </div>
      </main>
      
    </div>
  );
}

<<<<<<< Updated upstream
const s = {
  page:       { flex:1, background:"var(--page)", display:"flex", justifyContent:"center", padding:"28px 16px" },
  back:       { background:"none", border:"none", color:"var(--g-600)", cursor:"pointer", fontSize:13, marginBottom:14, padding:0 },
  heading:    { fontSize:20, fontWeight:700, marginBottom:4 },
  payBox:     { background:"var(--g-50)", border:"1px solid var(--g-100)", borderRadius:"var(--r-lg)", padding:"14px 16px", marginBottom:14 },
  payRow:     { display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 0" },
  payTotal:   { fontWeight:700, fontSize:14, color:"var(--g-800)" },
  methBtn:    { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"12px 8px", border:"2px solid var(--s-200)", borderRadius:"var(--r-lg)", background:"var(--white)", cursor:"pointer", transition:"all .15s" },
  methActive: { borderColor:"var(--g-600)", background:"var(--g-50)" },
  detailBox:  { background:"var(--s-50)", borderRadius:"var(--r-md)", padding:"12px 14px" },
  detailGrid: { display:"grid", gridTemplateColumns:"auto 1fr", gap:"5px 14px", fontSize:12 },
  sumBox:     { background:"var(--s-50)", borderRadius:"var(--r-md)", padding:"12px 14px", textAlign:"left" },
  sumRow:     { display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 0", borderBottom:"1px solid var(--s-200)" },
};