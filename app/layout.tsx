import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import RouteTracker from "./components/route-tracker/RouteTracker";
import { Toaster } from "sonner";

export const metadata = {
  title: "AbleAI",
  description: "Connecting gig workers and buyers",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1.0,
  userScalable: 'no'
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RouteTracker />
          <Toaster position="bottom-right" richColors />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
