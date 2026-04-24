"use client";
import Link from "next/link";
import Image from "next/image";
import logoFull from "../../assets/bouwnce-main.png";
import logoIcon from "../../assets/bouwnce-icon.png";
const Logo = ({
  onlyImage = false,
  size,
}: {
  onlyImage?: boolean;
  size?: number;
}) => {
  const dimension = size || 40;

  return (
    <Link
      href="/"
      className="flex items-center font-STHupo font-extrabold tracking-[0.53px] lowercase text-[rgb(26,26,26)] dark:text-white transition-colors duration-300"
      style={size ? { fontSize: `${Math.round(size * 0.3)}px` } : {}}
    >
      <Image
        src={onlyImage ? logoIcon.src : logoFull.src}
        alt="Bouwnce logo"
        width={dimension}
        height={dimension}
        priority
        className="object-contain"
      />
    </Link>
  );
};

export default Logo;
