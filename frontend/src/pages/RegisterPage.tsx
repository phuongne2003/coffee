import { useState, FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Coffee, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";

export default function RegisterPage() {
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Họ và tên là bắt buộc";
    if (!form.email) e.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Mật khẩu là bắt buộc";
    else if (form.password.length < 8)
      e.password = "Mật khẩu tối thiểu 8 ký tự";
    if (form.password !== form.confirm)
      e.confirm = "Mật khẩu nhập lại không khớp";
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
      const res = await authApi.register({
        fullName: form.name.trim(),
        email: form.email,
        password: form.password,
        role: "customer",
      });
      login(res.token, res.user);
      showToast("Tạo tài khoản thành công", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast((err as Error).message || "Đăng ký thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
    className: `input-field ${errors[key] ? "border-red-400 ring-1 ring-red-300" : ""}`,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center">
            <Coffee size={20} className="text-white" />
          </div>
          <span className="font-serif text-2xl font-bold text-espresso">
            BrewDesk
          </span>
        </div>

        <div className="card p-8">
          <h2 className="font-serif text-2xl font-semibold text-espresso mb-1">
            Tạo tài khoản
          </h2>
          <p className="text-espresso-400 text-sm mb-6">
            Tham gia BrewDesk để quản lý quán cà phê của bạn
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                {...field("name")}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                placeholder="admin@cafe.com"
                {...field("email")}
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
                  placeholder="Tối thiểu 8 ký tự"
                  {...field("password")}
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

            <div>
              <label className="label">Nhập lại mật khẩu</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                {...field("confirm")}
              />
              {errors.confirm && (
                <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-terracotta hover:bg-terracotta-600 text-white font-medium rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg mt-2"
            >
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="text-center text-sm text-espresso-400 mt-5">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-terracotta hover:text-terracotta-600 font-medium"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
