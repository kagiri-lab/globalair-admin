import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { AdminAuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    template: '%s | Global Air Cargo Admin',
    default: 'Global Air Cargo Admin',
  },
  description: 'Global Air Cargo internal admin dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} 
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <AdminAuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{
            style: { background: '#0f1629', color: '#f1f5f9', border: '1px solid #1a2540', borderRadius: '10px', fontSize: '0.875rem' },
          }} />
        </AdminAuthProvider>
      </body>
    </html>
  );
}
