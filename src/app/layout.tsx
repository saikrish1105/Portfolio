import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAI KRISH // PORTFOLIO GRAND PRIX',
  description:
    'An immersive Formula 1 night-race portfolio. Drive a full lap through projects, experience and achievements — T-cam view included.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:ital,wght@0,500;0,700;0,800;0,900;1,700;1,900&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0B0B0D" />
      </head>
      <body className="bg-asphalt text-white antialiased">{children}</body>
    </html>
  );
}
