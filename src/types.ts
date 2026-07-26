export type Shift = "morning" | "afternoon" | "evening";
export type Frequency = "daily" | "weekly" | "monthly";
export type PaymentMode = "cash" | "cheque" | "online" | "wallet";

/**
 * A customer of the agency. (Historically called "User" — kept as `User`
 * alias below for backward compatibility with older stored data.)
 */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  billingPhone?: string;
  groupId: string;
  address: string;
  email?: string;
  gst?: string;
  shift: Shift;
  frequency: Frequency;
  /** Default number of jars/bottles delivered per visit. */
  defaultBottles: number;
  /** Default per-jar rate for this customer. */
  price: number;
  /** Opening balance the customer owed before tracking started. */
  openingDue: number;
  /** Refundable security deposit held for jars. */
  securityDeposit: number;
  active: boolean;
  createdAt: string;
}

/** Backward-compatible alias. Older code/data referred to customers as users. */
export type User = Customer;

export interface Product {
  id: string;
  name: string;
  supplier: string;
  /** Human capacity label, e.g. "20 L". */
  capacity: string;
  rate: number;
  /** Jars of this product currently out with customers. */
  balanceJar: number;
  /** Jars of this product in the agency's own stock. */
  stockBalance: number;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface DeliveryItem {
  productId: string;
  delivered: number;
  received: number;
}

export interface Delivery {
  id: string;
  userId: string;
  date: string;
  shift: Shift;
  /** Per-product breakdown. Legacy rows may omit this. */
  items?: DeliveryItem[];
  /** Total jars delivered (kept for backward compatibility). */
  bottles: number;
  price: number;
  /** Total money value of the delivery. */
  amount: number;
  notes: string;
  createdAt: string;
}

export interface Return {
  id: string;
  userId: string;
  date: string;
  bottles: number;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  mode: PaymentMode;
  receiver: string;
  date: string;
  remark: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  otpChannel: "sms" | "whatsapp";
  createdAt: string;
}

export interface AppEvent {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  isAgent: boolean;
  eventName: string;
  startDate: string;
  endDate: string;
  eventAddress: string;
  createdAt: string;
}

export interface Agency {
  name: string;
  ownerName: string;
  ownerPhone: string;
  address: string;
  email: string;
  gst: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

export interface InvoiceLine {
  productId: string;
  name: string;
  qty: number;
  rate: number;
  total: number;
}

export interface Invoice {
  ref: number;
  customerId: string;
  year: number;
  month: number;
  lines: InvoiceLine[];
  subTotal: number;
  pastDue: number;
  paid: number;
  amountToPay: number;
}

/** Per-customer money summary shown throughout the app. */
export interface Dues {
  balanceJar: number;
  pastDue: number;
  currentDue: number;
  totalDue: number;
  advance: number;
}
