import { useState, useEffect } from "react";
import { useAuth } from "../../src/context/AuthContext";
import RatingStars from "../components/ratingStars";
import ReviewList  from "../components/reviewList";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./ratingPage.css";

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rp-bar-row">
      <span className="rp-bar-lbl">{star}★</span>
      <div className="rp-bar-track"><div className="rp-bar-fill" style={{ width:`${pct}%` }} /></div>
      <span className="rp-bar-count">{count}</span>
    </div>
  );
}

// Demo data shown when backend is offline
const DEMO_SUMMARY  = { average:4.8, total:24, breakdown:{5:18,4:4,3:2,2:0,1:0} };
const DEMO_REVIEWS  = [
  { id:1, reviewer_name:"Hotel Ella Inn",     rating:5, comment:"Excellent tomatoes. Very fresh, correct weight.", created_at:"May 28, 2026" },
  { id:2, reviewer_name:"Perera Supermart",   rating:4, comment:"Good carrots. Slight delay but resolved well.",  created_at:"May 15, 2026" },
  { id:3, reviewer_name:"Colombo Fresh Mart", rating:5, comment:"Best leeks I have purchased online.",            created_at:"Apr 30, 2026" },
];
const DEMO_PENDING  = [
  { id:2041, crop_name:"Tomato", other_party_name:"Hotel Ella Inn" },
  { id:2040, crop_name:"Carrot", other_party_name:"Perera Supermart" },
];

export default function RatingsPage() {
  const { user }                       = useAuth();
  const [summary, setSummary]          = useState(null);
  const [reviews, setReviews]          = useState([]);
  const [pendingOrders, setPending]    = useState([]);
  const [selectedOrder, setSelected]   = useState("");
  const [stars, setStars]              = useState(0);
  const [comment, setComment]          = useState("");
  const [submitting, setSubmitting]    = useState(false);
  const [submitMsg, setSubmitMsg]      = useState({ text:"", ok:false });
  const [loadingData, setLoadingData]  = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/backend/Apis/get_ratings.php?user_id=${user.id}`, { credentials:"include" }).then(r=>r.json()),
      fetch("/backend/Apis/get_completed_unrated.php",          { credentials:"include" }).then(r=>r.json()),
    ]).then(([rd, od]) => {
      if (rd.success) { setSummary(rd.summary); setReviews(rd.reviews); }
      else            { setSummary(DEMO_SUMMARY); setReviews(DEMO_REVIEWS); }
      if (od.success) setPending(od.orders);
      else            setPending(DEMO_PENDING);
    }).catch(() => {
      setSummary(DEMO_SUMMARY); setReviews(DEMO_REVIEWS); setPending(DEMO_PENDING);
    }).finally(() => setLoadingData(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stars === 0)    { setSubmitMsg({ text:"Please select a star rating.", ok:false }); return; }
    if (!selectedOrder) { setSubmitMsg({ text:"Please select an order.", ok:false }); return; }
    setSubmitting(true); setSubmitMsg({ text:"", ok:false });
    try {
      const res  = await fetch("/backend/Apis/submit_rating.php", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ order_id:selectedOrder, rating:stars, comment }),
        credentials:"include",
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMsg({ text:"✅ Rating submitted successfully!", ok:true });
        setStars(0); setComment(""); setSelected("");
        setReviews((p) => [data.new_review, ...p]);
        setPending((p) => p.filter((o) => String(o.id) !== String(selectedOrder)));
        if (data.new_summary) setSummary(data.new_summary);
      } else {
        setSubmitMsg({ text: data.message || "Submission failed.", ok:false });
      }
    } catch {
      setSubmitMsg({ text:"Network error. Make sure XAMPP is running.", ok:false });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <div style={{ padding:40, textAlign:"center", color:"var(--t-3)" }}>Loading ratings…</div>;

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <Navbar />
      <main className="rp-page">
        <h1 className="rp-heading">Ratings &amp; Reviews</h1>

        <div className="rp-top-grid">
          {/* Summary card */}
          <div className="card">
            <p className="section-label">Your Rating</p>
            {summary ? (
              <>
                <div className="rp-big-score">
                  <div className="rp-score-num">{summary.average.toFixed(1)}</div>
                  <RatingStars value={Math.round(summary.average)} readOnly size={22} />
                  <p className="rp-score-total">{summary.total} review{summary.total !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:12 }}>
                  {[5,4,3,2,1].map((n) => (
                    <RatingBar key={n} star={n} count={summary.breakdown[n] ?? 0} total={summary.total} />
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize:12, color:"var(--t-3)" }}>No ratings yet.</p>
            )}
          </div>

          {/* Submit rating card */}
          <div className="card">
            <p className="section-label">Rate a completed order</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="order-sel">Select Order</label>
                <select id="order-sel" value={selectedOrder} onChange={(e) => setSelected(e.target.value)}>
                  <option value="">— Choose an order —</option>
                  {pendingOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} · {o.crop_name} · {o.other_party_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--t-2)", marginBottom:6 }}>
                  Your Rating
                </label>
                <RatingStars value={stars} onChange={setStars} size={28} />
              </div>
              <div className="field">
                <label htmlFor="rev-comment">Review (optional)</label>
                <textarea
                  id="rev-comment" rows={3} value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe your experience…"
                  style={{ resize:"vertical" }}
                />
              </div>
              {submitMsg.text && (
                <div className={submitMsg.ok ? "info-green" : "info-red"} style={{ marginBottom:12 }}>
                  {submitMsg.text}
                </div>
              )}
              <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Rating"}
              </button>
            </form>
          </div>
        </div>

        {/* Review list */}
        <div className="card" style={{ marginTop:16 }}>
          <p className="section-label">Reviews received ({reviews.length})</p>
          <ReviewList reviews={reviews} />
        </div>
      </main>
      <Footer />
    </div>
  );
}