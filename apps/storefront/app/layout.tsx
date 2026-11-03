import React from 'react';

export const metadata = {
  title: 'Brand Beats — Merchant',
  description: 'Merchant dashboard and storefront preview',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Inter, -apple-system, 'Segoe UI', sans-serif",
          color: '#1a1a1a',
          background: '#f7f7f8',
        }}
      >
        {children}
      </body>
    </html>
  );
}
