import { apiRequest, isGoogleSheetsEnabled } from "./api";
import type {
  Customer,
  Delivery,
  Return,
  Product,
  Group,
  Payment,
  Expense,
  Agency,
  Dues,
  Shift,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Local persistence                                                         */
/* -------------------------------------------------------------------------- */

const KEYS = {
  customers: "waterApp_users", // reuse legacy key so old data loads
  deliveries: "waterApp_deliveries",
  returns: "waterApp_returns",
  products: "waterApp_products",
  groups: "waterApp_groups",
  payments: "waterApp_payments",
  expenses: "waterApp_expenses",
  agency: "waterApp_agency",
} as const;

function saveLocal(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadLocal<T>(key: string): T | null {
  const data = localStorage.getItem(key);
  return data ? (JSON.parse(data) as T) : null;
}

const uid = () =>
  Date.now().toString(36) + Math.floor(performance.now() * 1000).toString(36);

export const DEFAULT_GROUP_ID = "default";

export const defaultAgency: Agency = {
  name: "Shree Balaji Water Supply",
  ownerName: "Agency Owner",
  ownerPhone: "",
  address: "",
  email: "",
  gst: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
};

/* -------------------------------------------------------------------------- */
/*  Lookups & date helpers                                                    */
/* -------------------------------------------------------------------------- */

export function findUser(
  users: Customer[],
  id: string | number,
): Customer | undefined {
  const sid = String(id);
  return users.find((u) => String(u.id) === sid);
}

export function findProduct(products: Product[], id: string) {
  return products.find((p) => String(p.id) === String(id));
}

export function findGroup(groups: Group[], id: string) {
  return groups.find((g) => String(g.id) === String(id));
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

export function money(n: number): string {
  return `₹${Number(n || 0).toFixed(1)}`;
}

/* -------------------------------------------------------------------------- */
/*  Migration — bring legacy User rows up to the Customer shape               */
/* -------------------------------------------------------------------------- */

function migrateCustomer(raw: Partial<Customer> & Record<string, unknown>): Customer {
  return {
    id: String(raw.id ?? uid()),
    name: String(raw.name ?? "Unknown"),
    phone: String(raw.phone ?? ""),
    billingPhone: raw.billingPhone as string | undefined,
    groupId: String(raw.groupId ?? DEFAULT_GROUP_ID),
    address: String(raw.address ?? ""),
    email: (raw.email as string) ?? "",
    gst: (raw.gst as string) ?? "",
    shift: (raw.shift as Shift) ?? "morning",
    frequency: (raw.frequency as Customer["frequency"]) ?? "daily",
    defaultBottles: Number(raw.defaultBottles ?? 1),
    price: Number(raw.price ?? 20),
    openingDue: Number(raw.openingDue ?? 0),
    securityDeposit: Number(raw.securityDeposit ?? 0),
    active: raw.active !== false,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function migrateDelivery(raw: Partial<Delivery> & Record<string, unknown>): Delivery {
  const bottles = Number(raw.bottles ?? 0);
  const price = Number(raw.price ?? 20);
  return {
    id: String(raw.id ?? uid()),
    userId: String(raw.userId ?? ""),
    date: normalizeDate(String(raw.date ?? formatDate(new Date()))),
    shift: (raw.shift as Shift) ?? "morning",
    items: raw.items as Delivery["items"],
    bottles,
    price,
    amount: Number(raw.amount ?? bottles * price),
    notes: String(raw.notes ?? ""),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

/* -------------------------------------------------------------------------- */
/*  Load all data                                                             */
/* -------------------------------------------------------------------------- */

export interface StoreData {
  customers: Customer[];
  deliveries: Delivery[];
  returns: Return[];
  products: Product[];
  groups: Group[];
  payments: Payment[];
  expenses: Expense[];
  agency: Agency;
  isOnline: boolean;
}

export async function loadAllData(): Promise<StoreData> {
  const isOnline = isGoogleSheetsEnabled();

  let rawCustomers: unknown[] | null = null;
  let rawDeliveries: unknown[] | null = null;
  let rawReturns: Return[] | null = null;
  let cloudProducts: Product[] | null = null;
  let cloudGroups: Group[] | null = null;
  let cloudPayments: Payment[] | null = null;
  let cloudExpenses: Expense[] | null = null;
  let cloudAgency: Agency | null = null;

  if (isOnline) {
    try {
      const result = await apiRequest("getAllData");
      if (result.success) {
        rawCustomers = (result.users ?? []) as unknown[];
        rawDeliveries = (result.deliveries ?? []) as unknown[];
        rawReturns = (result.returns ?? []) as Return[];
        saveLocal(KEYS.customers, rawCustomers);
        saveLocal(KEYS.deliveries, rawDeliveries);
        saveLocal(KEYS.returns, rawReturns);

        // New entities — only trust the cloud copy when the Sheet actually
        // returns the field (older Apps Script deployments won't).
        if (Array.isArray(result.products)) {
          cloudProducts = result.products as Product[];
          saveLocal(KEYS.products, cloudProducts);
        }
        if (Array.isArray(result.groups)) {
          cloudGroups = result.groups as Group[];
          saveLocal(KEYS.groups, cloudGroups);
        }
        if (Array.isArray(result.payments)) {
          cloudPayments = result.payments as Payment[];
          saveLocal(KEYS.payments, cloudPayments);
        }
        if (Array.isArray(result.expenses)) {
          cloudExpenses = result.expenses as Expense[];
          saveLocal(KEYS.expenses, cloudExpenses);
        }
        if (result.agency && typeof result.agency === "object") {
          cloudAgency = result.agency as Agency;
          saveLocal(KEYS.agency, cloudAgency);
        }
      }
    } catch (err) {
      console.error("Sync failed, using local data:", err);
    }
  }

  rawCustomers ??= loadLocal<unknown[]>(KEYS.customers) ?? [];
  rawDeliveries ??= loadLocal<unknown[]>(KEYS.deliveries) ?? [];
  rawReturns ??= loadLocal<Return[]>(KEYS.returns) ?? [];

  const customers = rawCustomers.map((c) =>
    migrateCustomer(c as Partial<Customer> & Record<string, unknown>),
  );
  const deliveries = rawDeliveries.map((d) =>
    migrateDelivery(d as Partial<Delivery> & Record<string, unknown>),
  );

  // No demo products — the app starts empty and shows only what you add.
  const products = cloudProducts ?? loadLocal<Product[]>(KEYS.products) ?? [];

  // Every customer needs a group, so keep one built-in "Default Group".
  // Seed it once and push it to the Sheet so nothing is local-only.
  let groups = cloudGroups ?? loadLocal<Group[]>(KEYS.groups);
  if (!groups || groups.length === 0) {
    const defaultGroup: Group = {
      id: DEFAULT_GROUP_ID,
      name: "Default Group",
      createdBy: "Agency Owner",
      createdAt: new Date().toISOString(),
    };
    groups = [defaultGroup];
    saveLocal(KEYS.groups, groups);
    if (isOnline) syncToCloud("addGroup", { data: defaultGroup });
  }

  return {
    customers,
    deliveries,
    returns: rawReturns,
    products,
    groups,
    payments: cloudPayments ?? loadLocal<Payment[]>(KEYS.payments) ?? [],
    expenses: cloudExpenses ?? loadLocal<Expense[]>(KEYS.expenses) ?? [],
    agency: cloudAgency ?? loadLocal<Agency>(KEYS.agency) ?? defaultAgency,
    isOnline,
  };
}

// Fire-and-forget cloud sync (never blocks UI)
function syncToCloud(action: string, params: Record<string, unknown> = {}) {
  apiRequest(action, params).catch((err) =>
    console.error(`Background sync failed [${action}]:`, err),
  );
}

/* -------------------------------------------------------------------------- */
/*  Customers                                                                 */
/* -------------------------------------------------------------------------- */

export function addUser(
  users: Customer[],
  data: Omit<Customer, "id" | "createdAt">,
  isOnline: boolean,
): Customer {
  const user: Customer = { ...data, id: uid(), createdAt: new Date().toISOString() };
  const updated = [...users, user];
  saveLocal(KEYS.customers, updated);
  if (isOnline) syncToCloud("addUser", { data: user });
  return user;
}

export function updateUser(
  users: Customer[],
  id: string,
  data: Partial<Customer>,
  isOnline: boolean,
): Customer[] {
  const updated = users.map((u) => (String(u.id) === String(id) ? { ...u, ...data } : u));
  saveLocal(KEYS.customers, updated);
  if (isOnline) syncToCloud("updateUser", { id, data });
  return updated;
}

export function deleteUser(users: Customer[], id: string, isOnline: boolean): Customer[] {
  const updated = users.filter((u) => String(u.id) !== String(id));
  saveLocal(KEYS.customers, updated);
  if (isOnline) syncToCloud("deleteUser", { id });
  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Deliveries                                                                */
/* -------------------------------------------------------------------------- */

export function addDelivery(
  deliveries: Delivery[],
  data: Omit<Delivery, "id" | "createdAt">,
  isOnline: boolean,
): Delivery {
  const delivery: Delivery = { ...data, id: uid(), createdAt: new Date().toISOString() };
  const updated = [...deliveries, delivery];
  saveLocal(KEYS.deliveries, updated);
  if (isOnline) syncToCloud("addDelivery", { data: delivery });
  return delivery;
}

export function deleteDelivery(deliveries: Delivery[], id: string, isOnline: boolean): Delivery[] {
  const updated = deliveries.filter((d) => d.id !== id);
  saveLocal(KEYS.deliveries, updated);
  if (isOnline) syncToCloud("deleteDelivery", { id });
  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Returns                                                                   */
/* -------------------------------------------------------------------------- */

export function addReturn(
  returns: Return[],
  data: Omit<Return, "id" | "createdAt">,
  isOnline: boolean,
): Return {
  const ret: Return = { ...data, id: uid(), createdAt: new Date().toISOString() };
  const updated = [...returns, ret];
  saveLocal(KEYS.returns, updated);
  if (isOnline) syncToCloud("addReturn", { data: ret });
  return ret;
}

export function deleteReturn(returns: Return[], id: string, isOnline: boolean): Return[] {
  const updated = returns.filter((r) => r.id !== id);
  saveLocal(KEYS.returns, updated);
  if (isOnline) syncToCloud("deleteReturn", { id });
  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                  */
/* -------------------------------------------------------------------------- */

export function addProduct(
  products: Product[],
  data: Omit<Product, "id" | "createdAt">,
  isOnline: boolean,
): Product[] {
  const product: Product = { ...data, id: uid(), createdAt: new Date().toISOString() };
  const updated = [...products, product];
  saveLocal(KEYS.products, updated);
  if (isOnline) syncToCloud("addProduct", { data: product });
  return updated;
}

export function updateProduct(
  products: Product[],
  id: string,
  data: Partial<Product>,
  isOnline: boolean,
): Product[] {
  const updated = products.map((p) => (String(p.id) === String(id) ? { ...p, ...data } : p));
  saveLocal(KEYS.products, updated);
  if (isOnline) syncToCloud("updateProduct", { id, data });
  return updated;
}

export function deleteProduct(products: Product[], id: string, isOnline: boolean): Product[] {
  const updated = products.filter((p) => String(p.id) !== String(id));
  saveLocal(KEYS.products, updated);
  if (isOnline) syncToCloud("deleteProduct", { id });
  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Groups                                                                    */
/* -------------------------------------------------------------------------- */

export function addGroup(
  groups: Group[],
  data: Omit<Group, "id" | "createdAt">,
  isOnline: boolean,
): { groups: Group[]; group: Group } {
  const group: Group = { ...data, id: uid(), createdAt: new Date().toISOString() };
  const updated = [...groups, group];
  saveLocal(KEYS.groups, updated);
  if (isOnline) syncToCloud("addGroup", { data: group });
  return { groups: updated, group };
}

export function deleteGroup(groups: Group[], id: string, isOnline: boolean): Group[] {
  const updated = groups.filter((g) => String(g.id) !== String(id));
  saveLocal(KEYS.groups, updated);
  if (isOnline) syncToCloud("deleteGroup", { id });
  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Payments                                                                  */
/* -------------------------------------------------------------------------- */

export function addPayment(
  payments: Payment[],
  data: Omit<Payment, "id" | "createdAt">,
  isOnline: boolean,
): Payment[] {
  const payment: Payment = { ...data, id: uid(), createdAt: new Date().toISOString() };
  const updated = [...payments, payment];
  saveLocal(KEYS.payments, updated);
  if (isOnline) syncToCloud("addPayment", { data: payment });
  return updated;
}

export function deletePayment(payments: Payment[], id: string, isOnline: boolean): Payment[] {
  const updated = payments.filter((p) => String(p.id) !== String(id));
  saveLocal(KEYS.payments, updated);
  if (isOnline) syncToCloud("deletePayment", { id });
  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Expenses                                                                  */
/* -------------------------------------------------------------------------- */

export function addExpense(
  expenses: Expense[],
  data: Omit<Expense, "id" | "createdAt">,
  isOnline: boolean,
): Expense[] {
  const expense: Expense = { ...data, id: uid(), createdAt: new Date().toISOString() };
  const updated = [...expenses, expense];
  saveLocal(KEYS.expenses, updated);
  if (isOnline) syncToCloud("addExpense", { data: expense });
  return updated;
}

export function deleteExpense(expenses: Expense[], id: string, isOnline: boolean): Expense[] {
  const updated = expenses.filter((e) => String(e.id) !== String(id));
  saveLocal(KEYS.expenses, updated);
  if (isOnline) syncToCloud("deleteExpense", { id });
  return updated;
}

/* -------------------------------------------------------------------------- */
/*  Agency                                                                    */
/* -------------------------------------------------------------------------- */

export function saveAgency(agency: Agency, isOnline: boolean): Agency {
  saveLocal(KEYS.agency, agency);
  if (isOnline) syncToCloud("saveAgency", { data: agency });
  return agency;
}

/* -------------------------------------------------------------------------- */
/*  Queries                                                                   */
/* -------------------------------------------------------------------------- */

export function getDeliveriesByDate(deliveries: Delivery[], date: string): Delivery[] {
  return deliveries.filter((d) => normalizeDate(d.date) === date);
}

export function getDeliveriesByUser(deliveries: Delivery[], userId: string): Delivery[] {
  return deliveries.filter((d) => String(d.userId) === String(userId));
}

export function getReturnsByUser(returns: Return[], userId: string): Return[] {
  return returns.filter((r) => String(r.userId) === String(userId));
}

export function getPaymentsByUser(payments: Payment[], userId: string): Payment[] {
  return payments.filter((p) => String(p.userId) === String(userId));
}

/** Net jars still out with a customer (delivered − received/returned). */
export function getUserBottlesOut(
  deliveries: Delivery[],
  returns: Return[],
  userId: string,
): number {
  const rows = getDeliveriesByUser(deliveries, userId);
  const delivered = rows.reduce((s, d) => s + Number(d.bottles), 0);
  const receivedInline = rows.reduce(
    (s, d) => s + (d.items?.reduce((x, i) => x + Number(i.received), 0) ?? 0),
    0,
  );
  const returned = getReturnsByUser(returns, userId).reduce((s, r) => s + Number(r.bottles), 0);
  return delivered - receivedInline - returned;
}

export function getTotalBottlesOut(deliveries: Delivery[], returns: Return[]): number {
  const delivered = deliveries.reduce((s, d) => s + Number(d.bottles), 0);
  const receivedInline = deliveries.reduce(
    (s, d) => s + (d.items?.reduce((x, i) => x + Number(i.received), 0) ?? 0),
    0,
  );
  const returned = returns.reduce((s, r) => s + Number(r.bottles), 0);
  return delivered - receivedInline - returned;
}

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/**
 * Compute the money summary for one customer.
 * Current due = this-month charges − this-month payments.
 * Past due    = opening balance + earlier charges − earlier payments.
 */
export function getCustomerDues(
  customer: Customer,
  deliveries: Delivery[],
  returns: Return[],
  payments: Payment[],
): Dues {
  const now = new Date();
  const custDeliveries = getDeliveriesByUser(deliveries, customer.id);
  const custPayments = getPaymentsByUser(payments, customer.id);

  let currentCharges = 0;
  let pastCharges = 0;
  for (const d of custDeliveries) {
    const value = Number(d.amount || d.bottles * d.price);
    if (isSameMonth(d.date, now)) currentCharges += value;
    else pastCharges += value;
  }

  let currentPaid = 0;
  let pastPaid = 0;
  for (const p of custPayments) {
    if (isSameMonth(p.date, now)) currentPaid += Number(p.amount);
    else pastPaid += Number(p.amount);
  }

  const pastDue = Number(customer.openingDue || 0) + pastCharges - pastPaid;
  const currentDue = currentCharges - currentPaid;
  const totalDue = pastDue + currentDue;

  return {
    balanceJar: getUserBottlesOut(deliveries, returns, customer.id),
    pastDue: Math.max(0, pastDue),
    currentDue: Math.max(0, currentDue),
    totalDue,
    advance: totalDue < 0 ? -totalDue : 0,
  };
}

export function getGroupDues(
  group: Group,
  customers: Customer[],
  deliveries: Delivery[],
  returns: Return[],
  payments: Payment[],
): Dues & { customerCount: number } {
  const members = customers.filter((c) => String(c.groupId) === String(group.id));
  const acc: Dues = { balanceJar: 0, pastDue: 0, currentDue: 0, totalDue: 0, advance: 0 };
  for (const c of members) {
    const d = getCustomerDues(c, deliveries, returns, payments);
    acc.balanceJar += d.balanceJar;
    acc.pastDue += d.pastDue;
    acc.currentDue += d.currentDue;
    acc.totalDue += d.totalDue;
    acc.advance += d.advance;
  }
  return { ...acc, customerCount: members.length };
}

/* ---- Dashboard aggregates ------------------------------------------------ */

export function getTodayBottleCount(deliveries: Delivery[]): number {
  const today = formatDate(new Date());
  return getDeliveriesByDate(deliveries, today).reduce((s, d) => s + Number(d.bottles), 0);
}

export function getMonthBottleCount(deliveries: Delivery[]): number {
  const now = new Date();
  return deliveries
    .filter((d) => isSameMonth(d.date, now))
    .reduce((s, d) => s + Number(d.bottles), 0);
}

export function getTodayReturnCount(returns: Return[]): number {
  const today = formatDate(new Date());
  return returns
    .filter((r) => normalizeDate(r.date) === today)
    .reduce((s, r) => s + Number(r.bottles), 0);
}

export function getTotalDue(
  customers: Customer[],
  deliveries: Delivery[],
  returns: Return[],
  payments: Payment[],
): number {
  return customers.reduce(
    (s, c) => s + getCustomerDues(c, deliveries, returns, payments).totalDue,
    0,
  );
}

export function getPendingDeliveries(customers: Customer[], deliveries: Delivery[]): Customer[] {
  const today = formatDate(new Date());
  const deliveredIds = new Set(getDeliveriesByDate(deliveries, today).map((d) => String(d.userId)));
  return customers.filter((c) => c.active !== false && !deliveredIds.has(String(c.id)));
}

export function getProductStats(
  product: Product,
  deliveries: Delivery[],
): { balanceJar: number; customerCount: number } {
  const customerIds = new Set<string>();
  let balanceJar = 0;
  for (const d of deliveries) {
    const items = d.items;
    if (!items) continue;
    for (const item of items) {
      if (String(item.productId) === String(product.id)) {
        balanceJar += Number(item.delivered) - Number(item.received);
        customerIds.add(String(d.userId));
      }
    }
  }
  // Fall back to explicitly-stored counts when no itemised deliveries exist.
  return {
    balanceJar: balanceJar || product.balanceJar,
    customerCount: customerIds.size,
  };
}
