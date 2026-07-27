/**
 * Thin wrapper around the browser Contact Picker API
 * (https://developer.mozilla.org/docs/Web/API/Contact_Picker_API).
 * Available on Chrome for Android over HTTPS. Returns null when the device
 * or browser doesn't support it, or the user cancels.
 */

interface PickedContact {
  name: string;
  tel: string;
}

interface ContactsManager {
  select: (
    props: string[],
    opts?: { multiple?: boolean },
  ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
  getProperties?: () => Promise<string[]>;
}

function manager(): ContactsManager | undefined {
  return (navigator as unknown as { contacts?: ContactsManager }).contacts;
}

export function contactsSupported(): boolean {
  const m = manager();
  return !!(m && typeof m.select === "function");
}

export async function pickContact(): Promise<PickedContact | null> {
  const m = manager();
  if (!m) return null;
  try {
    const results = await m.select(["name", "tel"], { multiple: false });
    if (!results || results.length === 0) return null;
    const c = results[0]!;
    return {
      name: (c.name && c.name[0]) || "",
      tel: (c.tel && c.tel[0]) || "",
    };
  } catch {
    return null;
  }
}
