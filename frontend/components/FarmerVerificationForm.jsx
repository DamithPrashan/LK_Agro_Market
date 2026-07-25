import { useTranslation } from "react-i18next";

export default function FarmerVerificationForm({
  nic, farm_location, onChange, onBlur,
  onNicFile, onEvidenceFile, nicFile, evidenceFile,
}) {
  const { t } = useTranslation();

  return (
    <div style={s.box}>
      <div style={s.head}>
        <span style={s.title}>{t("verification.title")}</span>
        <span className="badge badge-amber">{t("verification.requiredBadge")}</span>
      </div>
      <div className="info-green" style={{ marginBottom: 14 }}>
        {t("verification.infoGreen")}
      </div>

      <div className="field">
        <label htmlFor="nic">{t("verification.nic")}</label>
        <input
          id="nic" name="nic" value={nic}
          placeholder="982341234V" onChange={onChange} onBlur={onBlur}
        />
      </div>

      <div className="field">
        <label htmlFor="farm_location">{t("verification.farmLocation")}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="farm_location" name="farm_location" value={farm_location}
            placeholder="Ella, Badulla  (or GPS: 6.8742, 81.0457)"
            onChange={onChange} onBlur={onBlur}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  const fake = { target: { name: "farm_location", value: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` } };
                  onChange(fake);
                });
              }
            }}
          >
            {t("verification.btnLocate")}
          </button>
        </div>
      </div>

      <div className="field">
        <label>{t("verification.nicImage")}</label>
        <div
          className="upload-zone"
          onClick={() => document.getElementById("nic-upload").click()}
        >
          <input
            id="nic-upload" type="file" accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onNicFile(e.target.files[0])}
          />
          <span>{nicFile ? "✅" : "🪪"}</span>
          <p>{nicFile ? nicFile.name : t("verification.nicPlaceholder")}</p>
        </div>
      </div>

      <div className="field">
        <label>{t("verification.evidence")}</label>
        <div
          className="upload-zone"
          onClick={() => document.getElementById("ev-upload").click()}
        >
          <input
            id="ev-upload" type="file" accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onEvidenceFile(e.target.files[0])}
          />
          <span>{evidenceFile ? "✅" : "📷"}</span>
          <p>{evidenceFile ? evidenceFile.name : t("verification.evidencePlaceholder")}</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  box:   { background: "var(--g-50)", border: "1px solid var(--g-100)", borderRadius: "var(--r-lg)", padding: "16px 18px", marginBottom: 14 },
  head:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 },
  title: { fontSize: 13, fontWeight: 700, color: "var(--g-800)" },
};