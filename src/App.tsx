import { AppProvider, useApp } from "./context";
import { Toast } from "./components/Toast";
import { BottomNav } from "./components/BottomNav";
import { HomeScreen } from "./components/HomeScreen";
import { CustomersScreen } from "./components/CustomersScreen";
import { CustomerForm } from "./components/CustomerForm";
import { CustomerDetail } from "./components/CustomerDetail";
import { ProductsScreen } from "./components/ProductsScreen";
import { GroupsScreen } from "./components/GroupsScreen";
import { NewGroupScreen } from "./components/NewGroupScreen";
import { DeliveryScreen } from "./components/DeliveryScreen";
import { DeliveriesScreen } from "./components/DeliveriesScreen";
import { PaymentScreen } from "./components/PaymentScreen";
import { PaymentsScreen } from "./components/PaymentsScreen";
import { MonthlyScreen } from "./components/MonthlyScreen";
import { InventoryScreen } from "./components/InventoryScreen";
import { ExpensesScreen } from "./components/ExpensesScreen";
import { AgencyScreen } from "./components/AgencyScreen";
import {
  InvoicesScreen,
  ReportsScreen,
  MessagesScreen,
  SimpleScreen,
} from "./components/MiscScreens";

// Screens that show their own full-bleed header (no bottom nav) OR a custom
// bottom bar of their own.
const NO_BOTTOM_NAV = new Set([
  "customerForm",
  "customerDetail",
  "newGroup",
  "customers",
  "delivery",
  "payment",
]);

function Router() {
  const { route } = useApp();

  switch (route.name) {
    case "home":
      return <HomeScreen />;
    case "customers":
      return <CustomersScreen />;
    case "customerForm":
      return <CustomerForm id={route.id} />;
    case "customerDetail":
      return <CustomerDetail id={route.id} />;
    case "products":
      return <ProductsScreen />;
    case "groups":
      return <GroupsScreen />;
    case "newGroup":
      return <NewGroupScreen />;
    case "delivery":
      return <DeliveryScreen customerId={route.customerId} />;
    case "deliveries":
      return <DeliveriesScreen />;
    case "payment":
      return <PaymentScreen customerId={route.customerId} />;
    case "payments":
      return <PaymentsScreen />;
    case "monthly":
      return <MonthlyScreen customerId={route.customerId} />;
    case "inventory":
      return <InventoryScreen />;
    case "expenses":
      return <ExpensesScreen />;
    case "invoices":
      return <InvoicesScreen />;
    case "reports":
      return <ReportsScreen />;
    case "messages":
      return <MessagesScreen />;
    case "agency":
      return <AgencyScreen />;
    case "simple":
      return <SimpleScreen screenKey={route.key} />;
    default:
      return <HomeScreen />;
  }
}

function Shell() {
  const { route, loading, toast, dismissToast } = useApp();
  const showBottomNav = !NO_BOTTOM_NAV.has(route.name);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-slate-50 relative shadow-xl">
      <main className={`${showBottomNav ? "pb-16" : ""} ${loading ? "opacity-60 pointer-events-none" : ""}`}>
        <Router />
      </main>

      {showBottomNav && <BottomNav />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
