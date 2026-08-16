import { LogoMark } from "@/components/LogoMark";

export function ImagePlaceholder({ compact }: { compact?: boolean }) {
  return (
    <div className="vitrine-tile relative grid h-full w-full place-items-center overflow-hidden">
      {!compact && (
        <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
      )}
      <div className={`flex flex-col items-center opacity-40 ${compact ? "gap-1" : "gap-3"}`}>
        <LogoMark size={compact ? 12 : 36} className="opacity-60" />
        {!compact && (
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Sem foto
          </span>
        )}
      </div>
    </div>
  );
}
