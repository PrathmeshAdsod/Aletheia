import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamProvider } from "@/contexts/TeamContext";

const inter = Inter({ subsets: ["latin"], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
    title: "Aletheia - Causal Memory Engine",
    description: "Institutional memory that detects contradictions before they become failures",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <TeamProvider>
                        {children}
                    </TeamProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
