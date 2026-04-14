import { useState, FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Coffee, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const getHomeRoute = (role?: string) =>
    role === "customer" ? "/menu" : "/dashboard";

  if (isAuthenticated)
    return <Navigate to={getHomeRoute(user?.role)} replace />;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Mật khẩu là bắt buộc";
    else if (form.password.length < 8)
      e.password = "Mật khẩu tối thiểu 8 ký tự";
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await authApi.login(form);
      login(res.token, res.user);
      showToast("Đăng nhập thành công", "success");
      navigate(getHomeRoute(res.user.role), { replace: true });
    } catch (err) {
      showToast((err as Error).message || "Đăng nhập thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 bg-espresso-800 items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage:
            "url(https://images.pexels.com/photos/1995842/pexels-photo-1995842.jpeg?w=800)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-espresso-800/75" />
        <div className="relative text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-terracotta mx-auto flex items-center justify-center mb-4">
            <Coffee size={32} className="text-white" />
          </div>
          <h1 className="font-serif text-4xl text-cream-100 mb-2">BrewDesk</h1>
          <p className="text-cream-300 text-lg">Café POS & Management</p>
          <p className="text-cream-400 mt-4 text-sm max-w-xs mx-auto">
            Streamline your café operations with elegant, intuitive tools.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-cream-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center">
              <Coffee size={20} className="text-white" />
            </div>
            <span className="font-serif text-2xl font-bold text-espresso">
              BrewDesk
            </span>
          </div>

          <h2 className="font-serif text-3xl font-semibold text-espresso mb-1">
            Chào mừng quay lại
          </h2>
          <p className="text-espresso-400 text-sm mb-8">
            Đăng nhập để tiếp tục sử dụng hệ thống
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input-field ${errors.email ? "border-red-400 ring-1 ring-red-300" : ""}`}
                placeholder="admin@cafe.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className={`input-field pr-10 ${errors.password ? "border-red-400 ring-1 ring-red-300" : ""}`}
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-400 hover:text-espresso"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-terracotta hover:bg-terracotta-600 text-white font-medium rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center text-sm text-espresso-400 mt-6">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-terracotta hover:text-terracotta-600 font-medium"
            >
              Tạo tài khoản
            </Link>
          </p>

          <div className="mt-8 p-4 bg-cream-200 rounded-xl border border-cream-300">
            <p className="text-xs text-espresso-500 font-semibold mb-1">API</p>
            <p className="text-xs text-espresso-400">
              Đăng nhập bằng tài khoản đã đăng ký trên server (
              {import.meta.env.VITE_API_URL || "http://localhost:3000"}).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
