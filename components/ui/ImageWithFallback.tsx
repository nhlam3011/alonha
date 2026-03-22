"use client";

import React, { useState, useEffect } from "react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const ImageWithFallback = ({
  src,
  fallbackSrc = "/images/placeholder-real-estate.png",
  alt,
  className,
  ...props
}: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src as string | undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src as string | undefined);
    setError(false);
  }, [src]);

  const handleError = () => {
    if (!error) {
      setImgSrc(fallbackSrc);
      setError(true);
    }
  };

  return (
    <img
      {...props}
      src={imgSrc || fallbackSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};
