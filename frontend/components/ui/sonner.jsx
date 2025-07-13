"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
        "--normal-bg": "#1a1a1a",
        "--normal-text": "#e0ffe0",
        "--normal-border": "#2e6f40",
        transition: "all 300ms ease-in-out",
        }
      }
      {...props} />
  );
}

export { Toaster }
