export const emptyCultivationAd = {
  crop_name: "", category: "", district: "", capacity_quantity: "", unit: "kg",
  estimated_unit_price: "", expected_harvest_date: "", cultivation_area: "",
  area_unit: "", description: ""
};

export function validateCultivationAd(form, photos, existingPhotoCount = 0) {
  if (!form.crop_name.trim() || !form.category || !form.district || !form.unit.trim()) return "required";
  if (Number(form.capacity_quantity) <= 0) return "capacity";
  if (Number(form.estimated_unit_price) <= 0) return "price";
  const harvest = new Date(`${form.expected_harvest_date}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!form.expected_harvest_date || harvest <= today) return "date";
  if (form.cultivation_area !== "" && Number(form.cultivation_area) <= 0) return "area";
  if (form.description.length > 2000) return "description";
  if (photos.length + existingPhotoCount > 5) return "photos";
  if (photos.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024)) return "photoType";
  if (form.cultivation_area !== "" && !["acres", "hectares", "perches"].includes(form.area_unit)) return "areaUnit";
  return null;
}
