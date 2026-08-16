type BadgeProps = {
  label: string;
  corBg: string;
  corFg: string;
  size?: "sm" | "md";
  className?: string;
};

export function Badge({ label, corBg, corFg, size = "sm", className }: BadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded font-bold uppercase tracking-wider ${
        size === "sm" ? "whitespace-nowrap px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[11px]"
      } ${className ?? ""}`}
      style={{ backgroundColor: corBg, color: corFg, boxShadow: `inset 0 0 0 1px ${corFg}22` }}
    >
      {label}
    </span>
  );
}
