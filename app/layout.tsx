import ClientProviders from "./components/shared/ClientProviders";
import "./globals.css";
import ErrorBoundary from "./components/shared/ErrorBoundary";

export const metadata = {
  title: "AbleAI",
  description: "Connecting gig workers and buyers",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: "1.0",
  minimumScale: "1.0",
  userScalable: "no",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ClientProviders>
            {/* <Debuggur /> */}
            {children}
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
