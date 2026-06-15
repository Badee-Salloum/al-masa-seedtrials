import Image from "next/image";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/almasa_logo.png"
      alt="Al-Masa"
      width={size}
      height={size}
      priority
      className="rounded"
    />
  );
}
