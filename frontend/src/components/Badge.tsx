type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "gold";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-800 border border-green-200",
  warning: "bg-amber-100 text-amber-800 border border-amber-200",
  error: "bg-red-100 text-red-800 border border-red-200",
  info: "bg-sky-100 text-sky-800 border border-sky-200",
  neutral: "bg-cream-200 text-espresso-500 border border-cream-300",
  gold: "bg-gold-100 text-gold-600 border border-gold-200",
};

const orderStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "pending":
      return "warning";
    case "preparing":
      return "info";
    case "served":
      return "gold";
    case "paid":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "neutral";
  }
};

const orderStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Chờ xử lý";
    case "preparing":
      return "Đang chuẩn bị";
    case "served":
      return "Đã phục vụ";
    case "paid":
      return "Đã thanh toán";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
};

export function StatusBadge({ status }: { status: string }) {
  const variant = orderStatusVariant(status);
  return <Badge label={orderStatusLabel(status)} variant={variant} />;
}

export function AvailabilityBadge({ status }: { status: string }) {
  const variant = status === "available" ? "success" : "neutral";
  return <Badge label={status} variant={variant} />;
}

export default function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[variant]}`}
    >
      {label}
    </span>
  );
}
