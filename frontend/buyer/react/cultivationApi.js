export async function readCultivationResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Unable to complete the request.");
  }
  return payload;
}
