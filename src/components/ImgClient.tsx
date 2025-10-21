// components/ImgClient.tsx
"use client";
import React, { useState } from "react";

export default function ImgClient({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const DEFAULT_ICON = "/file.svg";
  const [err, setErr] = useState(false);
  const url = !src
    ? DEFAULT_ICON
    : src.startsWith("http") || src.startsWith("/")
    ? src
    : `/${src}`;
  return (
    <img
      src={err ? DEFAULT_ICON : url}
      alt={alt}
      className={className}
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}
