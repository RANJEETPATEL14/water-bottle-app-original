export interface User {
  id: string;
  name: string;
  phone: string;
  address: string;
  defaultBottles: number;
  price: number;
  active: boolean;
  createdAt: string;
}

export interface Delivery {
  id: string;
  userId: string;
  date: string;
  bottles: number;
  price: number;
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

export type Tab = "dashboard" | "users" | "delivery" | "returns" | "history";
