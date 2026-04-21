import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import IngredientsPage from "./pages/IngredientsPage";
import MenuItemsPage from "./pages/MenuItemsPage";
import OrdersPage from "./pages/OrdersPage";
import TablesPage from "./pages/TablesPage";
import MobileMenuPage from "./pages/MobileMenuPage";

function RoleHomeRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === "customer" ? (
    <Navigate to="/menu" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "customer") {
    return <Navigate to="/menu" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <AdminRoute>
              <CategoriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/ingredients"
          element={
            <AdminRoute>
              <IngredientsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/menu-items"
          element={
            <AdminRoute>
              <MenuItemsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <AdminRoute>
              <OrdersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/tables"
          element={
            <AdminRoute>
              <TablesPage />
            </AdminRoute>
          }
        />
        <Route path="/menu" element={<MobileMenuPage />} />
        <Route path="/menu/:tableCode" element={<MobileMenuPage />} />
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="*" element={<RoleHomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
