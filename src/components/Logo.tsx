import Image from "next/image";

type LogoProps = {
  className?: string;
  priority?: boolean;
  src?: string;
};

export function Logo({
  className = "",
  priority = false,
  src = "/logo-home-queen.png",
}: LogoProps) {
  return (
    <Image
      src={src}
      alt="Home Queen Camas Box"
      width={220}
      height={140}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
