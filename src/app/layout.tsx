import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calibration Masters | Certificate Workspace",
  description: "Calibration certificate register, quality review, and approvals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

