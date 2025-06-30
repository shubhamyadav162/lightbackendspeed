import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LightSpeedPay Backend API",
  description: "LightSpeedPay Payment Gateway Backend API Server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
} 