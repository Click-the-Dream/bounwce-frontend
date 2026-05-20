import { useState, useEffect } from "react";
import Image from "next/image";

const SafeImage = ({
  src,
  alt,
  width,
  height,
  className,
  style,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onError?: any;
  style?: any;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // don't render on server
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
      style={style}
    />
  );
};

export default SafeImage;
