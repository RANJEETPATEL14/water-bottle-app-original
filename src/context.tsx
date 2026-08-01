import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  Customer,
  Delivery,
  Return,
  Product,
  Group,
  Payment,
  Expense,
  Employee,
  AppEvent,
  Agency,
} from "./types";
import * as store from "./store";

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                */
/* -------------------------------------------------------------------------- */

export type Route =
  | { name: "home" }
  | { name: "products" }
  | { name: "groups" }
  | { name: "newGroup" }
  | { name: "customers" }
  | { name: "customerDetail"; id: string }
  | { name: "customerForm"; id?: string }
  | { name: "payment"; customerId?: string }
  | { name: "payments" }
  | { name: "delivery"; customerId?: string }
  | { name: "deliveryBrowse" }
  | { name: "openingDelivery"; customerId?: string }
  | { name: "deliveries" }
  | { name: "monthly"; customerId?: string }
  | { name: "ledger"; customerId?: string }
  | { name: "inventory" }
  | { name: "expenses" }
  | { name: "invoices" }
  | { name: "invoiceDetail"; customerId: string; year: number; month: number }
  | { name: "employees" }
  | { name: "events" }
  | { name: "agency" }
  | { name: "messages" }
  | { name: "reports" }
  | { name: "simple"; key: string };

export type ToastType = "success" | "error";

interface AppState {
  loading: boolean;
  isOnline: boolean;
  customers: Customer[];
  deliveries: Delivery[];
  returns: Return[];
  products: Product[];
  groups: Group[];
  payments: Payment[];
  expenses: Expense[];
  employees: Employee[];
  events: AppEvent[];
  agency: Agency;

  // navigation
  route: Route;
  stack: Route[];
  navigate: (route: Route) => void;
  back: () => void;
  goHome: () => void;

  // shared UI preferences
  customerSort: store.CustomerSort;
  setCustomerSort: (sort: store.CustomerSort) => void;

  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type: ToastType) => void;
  dismissToast: () => void;

  refresh: () => Promise<void>;

  // actions
  addCustomer: (data: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addDelivery: (data: Omit<Delivery, "id" | "createdAt">) => void;
  updateDelivery: (id: string, data: Partial<Delivery>) => void;
  deleteDelivery: (id: string) => void;
  addReturn: (data: Omit<Return, "id" | "createdAt">) => void;
  addProduct: (data: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addGroup: (data: Omit<Group, "id" | "createdAt">) => Group;
  deleteGroup: (id: string) => void;
  addPayment: (data: Omit<Payment, "id" | "createdAt">) => void;
  deletePayment: (id: string) => void;
  addExpense: (data: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;
  addEmployee: (data: Omit<Employee, "id" | "createdAt">) => void;
  deleteEmployee: (id: string) => void;
  addEvent: (data: Omit<AppEvent, "id" | "createdAt">) => void;
  deleteEvent: (id: string) => void;
  saveAgency: (agency: Agency) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [agency, setAgency] = useState<Agency>(store.defaultAgency);

  const [customerSort, setCustomerSortState] = useState<store.CustomerSort>(() => {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem("waterApp_customerSort") : null;
    return v === "az" || v === "za" || v === "time" ? v : "time";
  });
  const setCustomerSort = useCallback((sort: store.CustomerSort) => {
    setCustomerSortState(sort);
    try {
      localStorage.setItem("waterApp_customerSort", sort);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const [stack, setStack] = useState<Route[]>(
    (() => {
      const h = typeof location !== "undefined" ? location.hash.replace("#/", "") : "";
      const initial: Route[] = [{ name: "home" }];
      if (h === "customers") initial.push({ name: "customers" });
      else if (h === "products") initial.push({ name: "products" });
      else if (h === "groups") initial.push({ name: "groups" });
      else if (h === "delivery") initial.push({ name: "delivery" });
      else if (h === "deliveryBrowse") initial.push({ name: "deliveryBrowse" });
      else if (h === "payment") initial.push({ name: "payment" });
      else if (h === "invoices") initial.push({ name: "invoices" });
      else if (h === "employees") initial.push({ name: "employees" });
      else if (h === "events") initial.push({ name: "events" });
      else if (h === "customerForm") initial.push({ name: "customerForm" });
      else if (h === "monthly") initial.push({ name: "monthly" });
      else if (h === "ledger") initial.push({ name: "ledger" });
      return initial;
    })(),
  );
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const applyData = useCallback((data: store.StoreData) => {
    setCustomers(data.customers);
    setDeliveries(data.deliveries);
    setReturns(data.returns);
    setProducts(data.products);
    setGroups(data.groups);
    setPayments(data.payments);
    setExpenses(data.expenses);
    setEmployees(data.employees);
    setEvents(data.events);
    setAgency(data.agency);
    setIsOnline(data.isOnline);
  }, []);

  useEffect(() => {
    store.loadAllData().then((data) => {
      applyData(data);
      setLoading(false);
    });
  }, [applyData]);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await store.loadAllData();
    applyData(data);
    setLoading(false);
    showToast("Data refreshed!", "success");
  }, [applyData, showToast]);

  const navigate = useCallback((route: Route) => {
    setStack((prev) => [...prev, route]);
  }, []);
  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);
  const goHome = useCallback(() => setStack([{ name: "home" }]), []);

  const actions = useMemo(
    () => ({
      addCustomer: (data: Omit<Customer, "id" | "createdAt">) => {
        const c = store.addUser(customers, data, isOnline);
        setCustomers((prev) => [...prev, c]);
        return c;
      },
      updateCustomer: (id: string, data: Partial<Customer>) =>
        setCustomers(store.updateUser(customers, id, data, isOnline)),
      deleteCustomer: (id: string) =>
        setCustomers(store.deleteUser(customers, id, isOnline)),
      addDelivery: (data: Omit<Delivery, "id" | "createdAt">) => {
        const d = store.addDelivery(deliveries, data, isOnline);
        setDeliveries((prev) => [...prev, d]);
      },
      updateDelivery: (id: string, data: Partial<Delivery>) =>
        setDeliveries(store.updateDelivery(deliveries, id, data, isOnline)),
      deleteDelivery: (id: string) =>
        setDeliveries(store.deleteDelivery(deliveries, id, isOnline)),
      addReturn: (data: Omit<Return, "id" | "createdAt">) => {
        const r = store.addReturn(returns, data, isOnline);
        setReturns((prev) => [...prev, r]);
      },
      addProduct: (data: Omit<Product, "id" | "createdAt">) =>
        setProducts(store.addProduct(products, data, isOnline)),
      updateProduct: (id: string, data: Partial<Product>) =>
        setProducts(store.updateProduct(products, id, data, isOnline)),
      deleteProduct: (id: string) =>
        setProducts(store.deleteProduct(products, id, isOnline)),
      addGroup: (data: Omit<Group, "id" | "createdAt">) => {
        const { groups: updated, group } = store.addGroup(groups, data, isOnline);
        setGroups(updated);
        return group;
      },
      deleteGroup: (id: string) => setGroups(store.deleteGroup(groups, id, isOnline)),
      addPayment: (data: Omit<Payment, "id" | "createdAt">) =>
        setPayments(store.addPayment(payments, data, isOnline)),
      deletePayment: (id: string) =>
        setPayments(store.deletePayment(payments, id, isOnline)),
      addExpense: (data: Omit<Expense, "id" | "createdAt">) =>
        setExpenses(store.addExpense(expenses, data, isOnline)),
      deleteExpense: (id: string) =>
        setExpenses(store.deleteExpense(expenses, id, isOnline)),
      addEmployee: (data: Omit<Employee, "id" | "createdAt">) =>
        setEmployees(store.addEmployee(employees, data, isOnline)),
      deleteEmployee: (id: string) =>
        setEmployees(store.deleteEmployee(employees, id, isOnline)),
      addEvent: (data: Omit<AppEvent, "id" | "createdAt">) =>
        setEvents(store.addEvent(events, data, isOnline)),
      deleteEvent: (id: string) =>
        setEvents(store.deleteEvent(events, id, isOnline)),
      saveAgency: (a: Agency) => setAgency(store.saveAgency(a, isOnline)),
    }),
    [customers, deliveries, returns, products, groups, payments, expenses, employees, events, isOnline],
  );

  const value: AppState = {
    loading,
    isOnline,
    customers,
    deliveries,
    returns,
    products,
    groups,
    payments,
    expenses,
    employees,
    events,
    agency,
    customerSort,
    setCustomerSort,
    route: stack[stack.length - 1]!,
    stack,
    navigate,
    back,
    goHome,
    toast,
    showToast,
    dismissToast: () => setToast(null),
    refresh,
    ...actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
