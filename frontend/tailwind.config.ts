import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Background & Surface
                background: '#F9FAFB',
                surface: '#FFFFFF',
                border: '#E5E7EB',

                // Primary (Intelligence/Truth)
                primary: {
                    DEFAULT: '#4F46E5',
                    hover: '#4338CA',
                    light: '#EEF2FF',
                },

                // Semantic Colors
                conflict: {
                    DEFAULT: '#DC2626',
                    dark: '#B91C1C',
                    light: '#FEE2E2',
                },
                aligned: {
                    DEFAULT: '#16A34A',
                    light: '#DCFCE7',
                },
                neutral: {
                    DEFAULT: '#64748B',
                    light: '#F3F4F6',
                },

                // Text Hierarchy
                text: {
                    primary: '#0F172A',
                    secondary: '#475569',
                    tertiary: '#94A3B8',
                },
            },
            fontSize: {
                'display': ['36px', { lineHeight: '1.2', fontWeight: '600' }],
                'h1': ['32px', { lineHeight: '1.25', fontWeight: '600' }],
                'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
                'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
                'body': ['16px', { lineHeight: '1.6' }],
                'small': ['14px', { lineHeight: '1.5' }],
                'meta': ['12px', { lineHeight: '1.5', letterSpacing: '0.05em' }],
            },
            spacing: {
                '65': '260px', // Sidebar width
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
        },
    },
    plugins: [],
};
export default config;
