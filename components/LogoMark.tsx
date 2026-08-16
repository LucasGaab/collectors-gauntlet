import Image from "next/image";

export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Collector's Gauntlet"
      width={256}
      height={256}
      className={className}
      style={{ width: size, height: size }}
      priority
    />
  );
}
