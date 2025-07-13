import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OGnite",
  description: "Developed by TAMAN ",
  icons:{
    icon: "/favicon.ico",
  }
};

export default function RootLayout({ children }) {
  return (
      <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >

                  <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false} enableColorScheme={false}
                    disableTransitionOnChange>
                    {children}
                  </ThemeProvider>
          
      <Toaster />
      </body>
    </html>
  );
}
