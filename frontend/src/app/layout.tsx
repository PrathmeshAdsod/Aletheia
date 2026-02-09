import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
    subsets: ["latin"],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: "Aletheia - Strategic Decision Intelligence",
    description: "Enterprise-grade decision intelligence system for teams who need to track, align, and resolve strategic decisions at scale.",
    keywords: ["decision intelligence", "strategic alignment", "conflict detection", "enterprise", "team collaboration"],
    authors: [{ name: "Aletheia" }],
    openGraph: {
        title: "Aletheia - Strategic Decision Intelligence",
        description: "Enterprise-grade decision intelligence system for teams",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    const theme = localStorage.getItem('aletheia-theme');
                                    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                    const isDark = theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark);
                                    document.documentElement.classList.add(isDark ? 'dark' : 'light');
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className={`${inter.className} ${inter.variable} antialiased`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
