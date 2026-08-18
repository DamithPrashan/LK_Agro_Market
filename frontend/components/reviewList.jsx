import RatingStars from "./ratingStars";
import { useTranslation } from "react-i18next";

export default function ReviewList({ reviews = [] }) {
  const { t } = useTranslation();
  if (reviews.length === 0) {
    return <p style={{ fontSize:12, color:"var(--t-3)", padding:"12px 0" }}>No reviews yet.</p>;
  }
  return (
    <div>
      {reviews.map((r) => (
        <div key={r.id} style={s.card}>
          <div style={s.head}>
            <div>
              <span style={s.name}>{r.reviewer_name}</span>
              <span style={s.date}>{r.created_at}</span>
              {r.reservation_source && <span style={s.context}>{t(r.reservation_source === "cultivation" ? "complaints.cultivationOrder" : "complaints.availableCrop")} · {r.crop_name}</span>}
            </div>
            <RatingStars value={r.rating} readOnly size={16} />
          </div>
          {r.comment && <p style={s.text}>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

const s = {
  card: { padding:"12px 0", borderBottom:"1px solid var(--s-100)" },
  head: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, flexWrap:"wrap", gap:6 },
  name: { fontWeight:600, fontSize:13, marginRight:10 },
  date: { fontSize:11, color:"var(--t-3)" },
  context: { display:"block", fontSize:11, color:"var(--g-700)", marginTop:3 },
  text: { fontSize:12, color:"var(--t-2)", lineHeight:1.6 },
};
