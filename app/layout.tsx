import type { Metadata } from "next";
import "./globals.css";
import AppProvider from "./context/AppProvider";
import { generatePageMetadata } from "./_utils/metadata";

export const metadata: Metadata = generatePageMetadata({
  title: "Bouwnce | Find your people. Get what you need.",
  description:
    "Bouwnce redefines how students experience campus life — connect, learn, and grow in a smarter digital environment designed for collaboration and success.",
  path: "/",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-screen antialiased"
      data-scroll-behavior="smooth"
      style={{ colorScheme: "light" }}
    >
      <head>
        {/* Move imports here to bypass the CSS build error */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Londrina+Shadow&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Pompiere&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/huge-promo"
        />
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/0927e08fbdf95205b63c5b8774adeef6?family=Aeonik+TRIAL"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen w-screen flex flex-col font-inter">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
