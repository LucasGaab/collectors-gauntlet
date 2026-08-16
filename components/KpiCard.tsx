import { AnimatedNumber } from "@/components/AnimatedNumber";

type Props = {
  label: string;
  value: number;
  format?: "currency";
  hero?: boolean;
};

export function KpiCard({ label, value, format, hero }: Props) {
  return (
    <div
      className={`glass-card relative overflow-hidden rounded-2xl border border-border p-6 ${
        hero ? "md:col-span-2" : ""
      }`}
    >
      {hero && (
        <div
          className={`absolute -right-4 -top-4 size-28 rounded-full blur-3xl ${
            format === "currency" ? "bg-gold/10" : "bg-primary/15"
          }`}
        />
      )}
      <p className="eyebrow mb-4">{label}</p>
      <span
        className={`display-title block ${format === "currency" ? "text-gold" : ""} ${
          hero ? "text-4xl md:text-5xl" : "text-4xl"
        }`}
      >
        <AnimatedNumber value={value} format={format} />
      </span>
    </div>
  );
}
