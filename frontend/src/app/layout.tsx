import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FinTechathon 2026 | Student Tuition Payment Agent',
  description:
    'Autonomous AI-powered Cross-Border Student Tuition Payment Assistant with Permission Tiers, Multi-Objective Route Optimization, and Financial Safety Guardrails for International Students.',
  keywords: [
    'FinTechathon 2026',
    'Student Tuition Payment',
    'Cross-Border Remittance',
    'AI Agent',
    'Permission Tiers',
    'FinTech Security',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="fintechTheme">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
