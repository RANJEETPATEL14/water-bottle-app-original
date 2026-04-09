const PIN_HASH =
  "06e4e03ca2f33bfe31a11c525a702c5b23ab298754fdefdc1cba636959f766b0";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function login(pin: string): Promise<boolean> {
  const hashed = await hashPin(pin);
  if (hashed === PIN_HASH) {
    localStorage.setItem("waterApp_auth", "true");
    return true;
  }
  return false;
}

export function isLoggedIn(): boolean {
  return localStorage.getItem("waterApp_auth") === "true";
}

export function logout(): void {
  localStorage.removeItem("waterApp_auth");
}
