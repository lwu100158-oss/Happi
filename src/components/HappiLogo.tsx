import React from "react";
import logoImg from "../assets/images/happi_new_logo_1785143296668.jpg";

interface HappiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const HappiLogo: React.FC<HappiLogoProps> = ({
  className = "",
  size = "md",
}) => {
  const heights = {
    sm: "h-7",
    md: "h-10",
    lg: "h-16",
    xl: "h-24",
  };

  return (
    <div className={`inline-flex items-center justify-center select-none ${heights[size]} ${className}`}>
      <img
        src={logoImg}
        alt="Happi Logo"
        className="h-full w-auto object-contain mix-blend-multiply rounded-lg"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
