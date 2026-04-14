import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Wheat,
  Coffee,
  ClipboardList,
  Grid3x3,
  LogOut,
  ChefHat,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/categories", icon: FolderOpen, label: "Categories" },
  { path: "/ingredients", icon: Wheat, label: "Ingredients" },
  { path: "/menu-items", icon: Coffee, label: "Menu Items" },
  { path: "/orders", icon: ClipboardList, label: "Orders" },
  { path: "/tables", icon: Grid3x3, label: "Tables" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-espresso-700 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center shrink-0">
          <ChefHat size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-serif text-cream-100 text-base font-semibold leading-tight">
              BrewDesk
            </p>
            <p className="text-cream-400 text-xs">POS & Management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`
            }
            onClick={() => setMobileOpen(false)}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-espresso-700">
        {!collapsed && user && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-espresso-700/50">
            <p className="text-cream-100 text-sm font-medium truncate">
              {user.fullName}
            </p>
            <p className="text-cream-400 text-xs truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-item w-full hover:bg-red-900/30 hover:text-red-300 ${collapsed ? "justify-center px-2" : ""}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`hidden lg:flex sidebar-item w-full mt-1 ${collapsed ? "justify-center px-2" : ""}`}
        >
          {collapsed ? (
            <Menu size={18} />
          ) : (
            <>
              <Menu size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-espresso text-cream-200 shadow-lg"
        onClick={() => setMobileOpen((m) => !m)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-espresso-900/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-40 bg-espresso-800 transition-all duration-300 flex flex-col
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:flex
          ${collapsed ? "w-16" : "w-60"}`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
