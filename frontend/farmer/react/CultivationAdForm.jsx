import { useEffect, useMemo } from "react";
import { DISTRICTS } from "../../../src/constants/districts";

export function CultivationAdForm({ form, setForm, photos, setPhotos, existingPhotos = [], submitting, onSubmit, onCancel, t }) {
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const previews = useMemo(() => photos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [photos]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);
  const selectPhotos = (event) => {
    const selected = Array.from(event.target.files);
    if (selected.length + existingPhotos.length > 5) {
      event.target.value = "";
      setPhotos([]);
      return alert(t("validation.photos"));
    }
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024)) {
      event.target.value = "";
      setPhotos([]);
      return alert(t("validation.photoType"));
    }
    setPhotos(selected);
  };
  return (
    <form className="cultivation-form" onSubmit={onSubmit}>
      <div className="cultivation-form-grid">
        <label>{t("cropName")}<input name="crop_name" value={form.crop_name} onChange={change} maxLength="100" required /></label>
        <label>{t("category")}<select name="category" value={form.category} onChange={change} required><option value="">{t("select")}</option><option value="Vegetable">{t("categories.vegetable")}</option><option value="Fruit">{t("categories.fruit")}</option><option value="Grain">{t("categories.grain")}</option><option value="Other">{t("categories.other")}</option></select></label>
        <label>{t("district")}<select name="district" value={form.district} onChange={change} required><option value="">{t("select")}</option>{DISTRICTS.map((district) => <option key={district.key} value={district.value}>{t(`districts.${district.key}`, district.value)}</option>)}</select></label>
        <label>{t("capacity")}<input type="number" min="0.01" step="0.01" name="capacity_quantity" value={form.capacity_quantity} onChange={change} required /></label>
        <label>{t("unit")}<select name="unit" value={form.unit} onChange={change} required><option value="kg">kg</option></select></label>
        <label>{t("estimatedPrice")}<input type="number" min="0.01" step="0.01" name="estimated_unit_price" value={form.estimated_unit_price} onChange={change} required /></label>
        <label>{t("expectedHarvest")}<input type="date" name="expected_harvest_date" value={form.expected_harvest_date} onChange={change} required /></label>
        <label>{t("cultivationArea")}<input type="number" min="0.01" step="0.01" name="cultivation_area" value={form.cultivation_area} onChange={change} /></label>
        <label>{t("areaUnit")}<select name="area_unit" value={form.area_unit} onChange={change} disabled={form.cultivation_area === ""} required={form.cultivation_area !== ""}><option value="">{t("select")}</option><option value="acres">{t("areaUnits.acres")}</option><option value="hectares">{t("areaUnits.hectares")}</option><option value="perches">{t("areaUnits.perches")}</option></select></label>
        <label className="cultivation-wide">{t("description")}<textarea name="description" rows="5" maxLength="2000" value={form.description} onChange={change} /><small>{form.description.length}/2000</small></label>
        <label className="cultivation-wide">{t("photos")}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectPhotos} /><small>{t("photoHint")} {t("selectedCount", "{{count}} selected", { count: photos.length })}</small></label>
      </div>
      {existingPhotos.length > 0 && <div className="cultivation-photo-group"><strong>{t("existingPhotos")}</strong><div className="cultivation-photo-strip">{existingPhotos.map((photo) => <img key={photo.id} src={`/${photo.photo_path}`} alt={`${form.crop_name} — ${t("existingPhotos")}`} />)}</div></div>}
      {previews.length > 0 && <div className="cultivation-photo-group"><strong>{t("newPhotos")}</strong><div className="cultivation-photo-strip">{previews.map((preview) => <figure key={preview.url}><img src={preview.url} alt={preview.name} /><figcaption>{preview.name}</figcaption></figure>)}</div></div>}
      <div className="cultivation-form-actions"><button type="button" className="cultivation-secondary" onClick={onCancel}>{t("cancel")}</button><button type="submit" className="cultivation-primary" disabled={submitting}>{submitting ? t("saving") : t("save")}</button></div>
    </form>
  );
}
