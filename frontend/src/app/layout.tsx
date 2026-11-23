import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FinTechathon 2026 | Student Tuition Payment Agent',
  description:
    'Cross-border student tuition payment desk with permission tiers, corridor route scoring, and financial safety limits for international students.',
  keywords: [
    'FinTechathon 2026',
    'Student Tuition Payment',
    'Cross-Border Remittance',
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
      <body className="bg-[#F5F7FA] text-[#111827] antialiased selection:bg-[#0F766E] selection:text-white">
        {children}
      </body>
    </html>
  );
}
