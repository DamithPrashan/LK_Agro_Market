export async function readJsonResponse(response, fallbackMessage = "The server returned an invalid response. Please try again.") {
  const text = await response.text();
  if (!text.trim()) throw new Error(fallbackMessage);
  let payload;
  try { payload = JSON.parse(text); }
  catch { throw new Error(fallbackMessage); }
  if (!response.ok) throw new Error(payload?.message || payload?.error || fallbackMessage);
  return payload;
}
