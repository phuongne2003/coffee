import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import IngredientsPage from "./pages/IngredientsPage";
import MenuItemsPage from "./pages/MenuItemsPage";
import OrdersPage from "./pages/OrdersPage";
import TablesPage from "./pages/TablesPage";
import MobileMenuPage from "./pages/MobileMenuPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route
          path="/categories"
          element={
            <Layout>
              <CategoriesPage />
            </Layout>
          }
        />
        <Route
          path="/ingredients"
          element={
            <Layout>
              <IngredientsPage />
            </Layout>
          }
        />
        <Route
          path="/menu-items"
          element={
            <Layout>
              <MenuItemsPage />
            </Layout>
          }
        />
        <Route
          path="/orders"
          element={
            <Layout>
              <OrdersPage />
            </Layout>
          }
        />
        <Route
          path="/tables"
          element={
            <Layout>
              <TablesPage />
            </Layout>
          }
        />
        <Route path="/menu" element={<MobileMenuPage />} />
        <Route path="/menu/:tableCode" element={<MobileMenuPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
