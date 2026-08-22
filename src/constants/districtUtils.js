/**
 * Shared district translation helper.
 * Usage: getDistrictLabel(t, rawDistrictValue)
 * Returns the translated district name, or the raw value as fallback.
 */
import { DISTRICTS } from "./districts";

export function getDistrictLabel(t, rawValue) {
  if (!rawValue) return "";
  const found = DISTRICTS.find(
    (d) => d.value.toLowerCase() === String(rawValue).toLowerCase()
  );
  return found ? t(`districts.${found.key}`) : rawValue;
}
