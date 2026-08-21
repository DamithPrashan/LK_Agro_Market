export const emptyCultivationAd = {
  crop_name: "", category: "", district: "", capacity_quantity: "", unit: "kg",
  estimated_unit_price: "", timing_model: "growing_period", expected_harvest_date: "",
  growing_period_value: "", growing_period_unit: "days", cultivation_area: "",
  area_unit: "", description: ""
};

export function validateCultivationAd(form, photos, existingPhotoCount = 0) {
  if (!form.crop_name.trim() || !form.category || !form.district || !form.unit.trim()) return "required";
  if (Number(form.capacity_quantity) <= 0) return "capacity";
  if (Number(form.estimated_unit_price) <= 0) return "price";
  if (form.timing_model === "fixed_date") {
    const harvest = new Date(`${form.expected_harvest_date}T00:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!form.expected_harvest_date || harvest <= today) return "date";
  } else {
    const value = Number(form.growing_period_value);
    const multiplier = { days: 1, weeks: 7, months: 30 }[form.growing_period_unit];
    const days = Math.round(value * (multiplier || 0));
    if (!Number.isFinite(value) || value <= 0 || !multiplier || days <= 0 || days > 3650) return "growingPeriod";
  }
  if (form.cultivation_area !== "" && Number(form.cultivation_area) <= 0) return "area";
  if (form.description.length > 2000) return "description";
  if (photos.length + existingPhotoCount > 5) return "photos";
  if (photos.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024)) return "photoType";
  if (form.cultivation_area !== "" && !["acres", "hectares", "perches"].includes(form.area_unit)) return "areaUnit";
  return null;
}
