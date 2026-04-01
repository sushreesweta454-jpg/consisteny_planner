import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "accent" | "success" | "warning";
}

const variantStyles = {
  primary: "text-primary glow-primary",
  accent: "text-accent glow-accent",
  success: "text-success",
  warning: "text-warning",
};

const StatCard = ({ title, value, subtitle, icon: Icon, variant = "primary" }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-5 hover:border-primary/30 transition-colors"
  >
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className={`p-2 rounded-lg bg-secondary ${variantStyles[variant]}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="text-3xl font-bold font-display">{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </motion.div>
);

export default StatCard;
