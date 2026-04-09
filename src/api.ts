const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwwEppn5INTSd6gM2g_S5QDJAuslqFZJuAGrXugpnH225A9iiZK9Tvr9IIxPTcUJIaYDw/exec";

export const isGoogleSheetsEnabled = () =>
  (GOOGLE_SCRIPT_URL as string) !== "YOUR_GOOGLE_SCRIPT_URL_HERE";

export async function apiRequest(
  action: string,
  params: Record<string, unknown> = {},
) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append("action", action);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  }

  const response = await fetch(url.toString());
  return response.json();
}
