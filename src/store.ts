import { apiRequest, isGoogleSheetsEnabled } from "./api";
import type { User, Delivery, Return } from "./types";

function saveLocal(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadLocal<T>(key: string): T | null {
  const data = localStorage.getItem(key);
  return data ? (JSON.parse(data) as T) : null;
}

export function findUser(users: User[], id: string | number): User | undefined {
  const sid = String(id);
  return users.find((u) => String(u.id) === sid);
}

function normalizeDate(dateValue: string): string {
  const str = String(dateValue);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  try {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  } catch {
    // ignore
  }
  return str;
}

export interface StoreData {
  users: User[];
  deliveries: Delivery[];
  returns: Return[];
  isOnline: boolean;
}

export async function loadAllData(): Promise<StoreData> {
  const isOnline = isGoogleSheetsEnabled();

  if (isOnline) {
    try {
      const result = await apiRequest("getAllData");
      if (result.success) {
        const users = (result.users ?? []) as User[];
        const deliveries = (result.deliveries ?? []) as Delivery[];
        const returns = (result.returns ?? []) as Return[];
        saveLocal("waterApp_users", users);
        saveLocal("waterApp_deliveries", deliveries);
        saveLocal("waterApp_returns", returns);
        return { users, deliveries, returns, isOnline };
      }
    } catch (err) {
      console.error("Sync failed, using local data:", err);
    }
  }

  return {
    users: loadLocal<User[]>("waterApp_users") ?? [],
    deliveries: loadLocal<Delivery[]>("waterApp_deliveries") ?? [],
    returns: loadLocal<Return[]>("waterApp_returns") ?? [],
    isOnline,
  };
}

// Fire-and-forget cloud sync (never blocks UI)
function syncToCloud(action: string, params: Record<string, unknown> = {}) {
  apiRequest(action, params).catch((err) =>
    console.error(`Background sync failed [${action}]:`, err),
  );
}

export function addUser(
  users: User[],
  userData: Omit<User, "id" | "createdAt">,
  isOnline: boolean,
): User {
  const user: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  const updated = [...users, user];
  saveLocal("waterApp_users", updated);
  if (isOnline) syncToCloud("addUser", { data: userData });
  return user;
}

export function updateUser(
  users: User[],
  id: string,
  data: Partial<User>,
  isOnline: boolean,
): User[] {
  const updated = users.map((u) => (String(u.id) === String(id) ? { ...u, ...data } : u));
  saveLocal("waterApp_users", updated);
  if (isOnline) syncToCloud("updateUser", { id, data });
  return updated;
}

export function deleteUser(
  users: User[],
  id: string,
  isOnline: boolean,
): User[] {
  const updated = users.filter((u) => String(u.id) !== String(id));
  saveLocal("waterApp_users", updated);
  if (isOnline) syncToCloud("deleteUser", { id });
  return updated;
}

export function addDelivery(
  deliveries: Delivery[],
  data: Omit<Delivery, "id" | "createdAt">,
  isOnline: boolean,
): Delivery {
  const delivery: Delivery = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  const updated = [...deliveries, delivery];
  saveLocal("waterApp_deliveries", updated);
  if (isOnline) syncToCloud("addDelivery", { data });
  return delivery;
}

export function deleteDelivery(
  deliveries: Delivery[],
  id: string,
  isOnline: boolean,
): Delivery[] {
  const updated = deliveries.filter((d) => d.id !== id);
  saveLocal("waterApp_deliveries", updated);
  if (isOnline) syncToCloud("deleteDelivery", { id });
  return updated;
}

export function addReturn(
  returns: Return[],
  data: Omit<Return, "id" | "createdAt">,
  isOnline: boolean,
): Return {
  const ret: Return = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  const updated = [...returns, ret];
  saveLocal("waterApp_returns", updated);
  if (isOnline) syncToCloud("addReturn", { data });
  return ret;
}

export function deleteReturn(
  returns: Return[],
  id: string,
  isOnline: boolean,
): Return[] {
  const updated = returns.filter((r) => r.id !== id);
  saveLocal("waterApp_returns", updated);
  if (isOnline) syncToCloud("deleteReturn", { id });
  return updated;
}

// Query helpers
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getDeliveriesByDate(
  deliveries: Delivery[],
  date: string,
): Delivery[] {
  return deliveries.filter((d) => normalizeDate(d.date) === date);
}

export function getDeliveriesByUser(
  deliveries: Delivery[],
  userId: string,
): Delivery[] {
  return deliveries.filter((d) => String(d.userId) === String(userId));
}

export function getReturnsByUser(
  returns: Return[],
  userId: string,
): Return[] {
  return returns.filter((r) => String(r.userId) === String(userId));
}

export function getUserBottlesOut(
  deliveries: Delivery[],
  returns: Return[],
  userId: string,
): number {
  const delivered = getDeliveriesByUser(deliveries, userId).reduce(
    (sum, d) => sum + Number(d.bottles),
    0,
  );
  const returned = getReturnsByUser(returns, userId).reduce(
    (sum, r) => sum + Number(r.bottles),
    0,
  );
  return delivered - returned;
}

export function getTotalBottlesOut(
  deliveries: Delivery[],
  returns: Return[],
): number {
  const totalDelivered = deliveries.reduce(
    (sum, d) => sum + Number(d.bottles),
    0,
  );
  const totalReturned = returns.reduce(
    (sum, r) => sum + Number(r.bottles),
    0,
  );
  return totalDelivered - totalReturned;
}

export function getTodayBottleCount(deliveries: Delivery[]): number {
  const today = formatDate(new Date());
  return getDeliveriesByDate(deliveries, today).reduce(
    (sum, d) => sum + Number(d.bottles),
    0,
  );
}

export function getMonthBottleCount(deliveries: Delivery[]): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return deliveries
    .filter((d) => {
      const dd = new Date(d.date);
      return dd.getFullYear() === y && dd.getMonth() === m;
    })
    .reduce((sum, d) => sum + Number(d.bottles), 0);
}

export function getTodayReturnCount(returns: Return[]): number {
  const today = formatDate(new Date());
  return returns
    .filter((r) => normalizeDate(r.date) === today)
    .reduce((sum, r) => sum + Number(r.bottles), 0);
}

export function getPendingDeliveries(
  users: User[],
  deliveries: Delivery[],
): User[] {
  const today = formatDate(new Date());
  const deliveredIds = new Set(
    getDeliveriesByDate(deliveries, today).map((d) => String(d.userId)),
  );
  return users.filter(
    (u) => u.active !== false && !deliveredIds.has(String(u.id)),
  );
}
