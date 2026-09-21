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
        <span className="badge badge-amber" style={{ fontSize: 11, padding: "3px 8px" }}>{t("verification.requiredBadge")}</span>
      </div>
      <div className="info-green" style={{ marginBottom: 10, padding: "8px 12px", fontSize: 12, lineHeight: 1.45 }}>
        {t("verification.infoGreen")}
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="nic">{t("verification.nic")}</label>
          <input
            id="nic" name="nic" value={nic}
            placeholder="982341234V" onChange={onChange} onBlur={onBlur}
          />
        </div>

        <div className="field">
          <label htmlFor="farm_location">{t("verification.farmLocation")}</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              id="farm_location" name="farm_location" value={farm_location}
              placeholder={t("verification.farmLocationPlaceholder")}
              onChange={onChange} onBlur={onBlur}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ padding: "5px 10px", fontSize: 12, minHeight: 38, whiteSpace: "nowrap" }}
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
      </div>

      {/* Side-by-side Upload Boxes in the Same Row */}
      <div className="grid-2" style={{ marginTop: 2 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, marginBottom: 4, fontWeight: 600, color: "var(--t-1)" }}>{t("verification.nicImage")}</label>
          <div
            className="upload-zone-box"
            onClick={() => document.getElementById("nic-upload").click()}
          >
            <input
              id="nic-upload" type="file" accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onNicFile(e.target.files[0])}
            />
            <div className="upload-icon">{nicFile ? "✅" : "🪪"}</div>
            <div className="upload-title">{nicFile ? nicFile.name : t("verification.nicPhotoPlaceholder", "NIC photo")}</div>
            <div className="upload-subtext">JPG · PNG · max 3 MB</div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, marginBottom: 4, fontWeight: 600, color: "var(--t-1)" }}>{t("verification.evidence")}</label>
          <div
            className="upload-zone-box"
            onClick={() => document.getElementById("ev-upload").click()}
          >
            <input
              id="ev-upload" type="file" accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onEvidenceFile(e.target.files[0])}
            />
            <div className="upload-icon">{evidenceFile ? "✅" : "📷"}</div>
            <div className="upload-title">{evidenceFile ? evidenceFile.name : t("verification.cropEvidencePlaceholder", "Crop evidence")}</div>
            <div className="upload-subtext">JPG · PNG · max 3 MB</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  box:   { background: "var(--g-50)", border: "1px solid var(--g-100)", borderRadius: "var(--r-lg)", padding: "14px 16px", marginBottom: 6 },
  head:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 },
  title: { fontSize: 14, fontWeight: 700, color: "var(--g-800)" },
};