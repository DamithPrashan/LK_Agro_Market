import { useState, useEffect } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import RatingStars from "../components/ratingStars";
import ReviewList  from "../components/reviewList";
import "./ratingPage.css";
import { readJsonResponse } from "../utils/readJsonResponse";

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

export default function RatingsPage() {
  const { user }                       = useAuth();
  const { t }                          = useTranslation();
  const [summary, setSummary]          = useState(null);
  const [reviews, setReviews]          = useState([]);
  const [pendingOrders, setPending]    = useState([]);
  const [selectedOrder, setSelected]   = useState("");
  const [stars, setStars]              = useState(0);
  const [comment, setComment]          = useState("");
  const [submitting, setSubmitting]    = useState(false);
  const [submitMsg, setSubmitMsg]      = useState({ text:"", ok:false });
  const [loadingData, setLoadingData]  = useState(true);
  const sourceLabel = (source) => t(source === "cultivation" ? "complaints.cultivationOrder" : "complaints.availableCrop");

  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => setLoadingData(false));
      return;
    }
    Promise.all([
      fetch(`/backend/Apis/ratings/get_ratings.php?user_id=${user.id}`, { credentials:"include" }).then((r) => readJsonResponse(r)),
      fetch("/backend/orders/get_completed_unrated.php",          { credentials:"include" }).then((r) => readJsonResponse(r)),
    ]).then(([rd, od]) => {
      if (rd.success) { setSummary(rd.summary); setReviews(rd.reviews); }
      else            { setSummary(null); setReviews([]); }
      if (od.success) setPending(od.orders);
      else            setPending([]);
    }).catch(() => {
      setSummary(null); setReviews([]); setPending([]);
    }).finally(() => setLoadingData(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (stars === 0)    { setSubmitMsg({ text: t("errors.selectStars"), ok:false }); return; }
    if (!selectedOrder) { setSubmitMsg({ text: t("errors.selectOrderRating"), ok:false }); return; }
    setSubmitting(true); setSubmitMsg({ text:"", ok:false });
    try {
      const res  = await fetch("/backend/Apis/ratings/submit_rating.php", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ order_id:selectedOrder, rating:stars, comment }),
        credentials:"include",
      });
      const data = await readJsonResponse(res, t("errors.submissionFailed"));
      if (data.success) {
        setSubmitMsg({ text: "✅ " + t("ratings.successAlert"), ok:true });
        setStars(0); setComment(""); setSelected("");
        setReviews((p) => [data.new_review, ...p]);
        setPending((p) => p.filter((o) => String(o.id) !== String(selectedOrder)));
        if (data.new_summary) setSummary(data.new_summary);
      } else {
        setSubmitMsg({ text: data.message || t("errors.submissionFailed"), ok:false });
      }
    } catch {
      setSubmitMsg({ text: t("errors.networkXamppError"), ok:false });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <div style={{ padding:40, textAlign:"center", color:"var(--t-3)" }}>{t("ratings.loading")}</div>;

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      
      <main className="rp-page">
        <h1 className="rp-heading">{t("ratings.title")}</h1>

        <div className="rp-top-grid">
          {/* Summary card */}
          <div className="card">
            <p className="section-label">{t("ratings.yourRating")}</p>
            {summary ? (
              <>
                <div className="rp-big-score">
                  <div className="rp-score-num">{summary.average.toFixed(1)}</div>
                  <RatingStars value={Math.round(summary.average)} readOnly size={22} />
                  <p className="rp-score-total">{summary.total} {t(summary.total === 1 ? "ratings.review" : "ratings.reviews")}</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:12 }}>
                  {[5,4,3,2,1].map((n) => (
                    <RatingBar key={n} star={n} count={summary.breakdown[n] ?? 0} total={summary.total} />
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize:12, color:"var(--t-3)" }}>{t("ratings.noRatings")}</p>
            )}
          </div>

          {/* Submit rating card */}
          <div className="card">
            <p className="section-label">{t(user?.role === "buyer" ? "ratings.rateFarmer" : "ratings.rateBuyer")}</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="order-sel">{t("ratings.selectOrder")}</label>
                <select id="order-sel" value={selectedOrder} onChange={(e) => setSelected(e.target.value)}>
                  <option value="">{t("ratings.chooseOrder")}</option>
                  {pendingOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {sourceLabel(o.reservation_source)} · #{o.id} · {o.crop_name} · {o.quantity} {o.unit} · {o.other_party_name} · {t("ratings.completed")} {o.completion_date}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--t-2)", marginBottom:6 }}>
                  {t("ratings.yourRating")}
                </label>
                <RatingStars value={stars} onChange={setStars} size={28} />
              </div>
              <div className="field">
                <label htmlFor="rev-comment">{t("ratings.reviewOptional")}</label>
                <textarea
                  id="rev-comment" rows={3} value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("ratings.reviewPlaceholder")}
                  style={{ resize:"vertical" }}
                />
              </div>
              {submitMsg.text && (
                <div className={submitMsg.ok ? "info-green" : "info-red"} style={{ marginBottom:12 }}>
                  {submitMsg.text}
                </div>
              )}
              <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
                {submitting ? t("ratings.btnSubmitting") : t("ratings.btnSubmit")}
              </button>
            </form>
          </div>
        </div>

        {/* Review list */}
        <div className="card" style={{ marginTop:16 }}>
          <p className="section-label">{t("ratings.reviewsReceived", { count: reviews.length })}</p>
          <ReviewList reviews={reviews} />
        </div>
      </main>
      
    </div>
  );
}
