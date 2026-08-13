import Image from "next/image";

type LogoProps = {
  className?: string;
  priority?: boolean;
};

export function Logo({ className = "", priority = false }: LogoProps) {
  return (
    <Image
      src="/logo-home-queen.png"
      alt="Home Queen Camas Box"
      width={220}
      height={147}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
