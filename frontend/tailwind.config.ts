import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dynamic CSS Variable Colors
                background: 'var(--background)',
                surface: 'var(--surface)',
                'surface-elevated': 'var(--surface-elevated)',
                border: 'var(--border)',
                'border-subtle': 'var(--border-subtle)',

                // Primary
                primary: {
                    DEFAULT: 'var(--primary)',
                    hover: 'var(--primary-hover)',
                    light: 'var(--primary-light)',
                    glow: 'var(--primary-glow)',
                },

                // Semantic
                conflict: {
                    DEFAULT: 'var(--conflict)',
                    light: 'var(--conflict-light)',
                },
                aligned: {
                    DEFAULT: 'var(--aligned)',
                    light: 'var(--aligned-light)',
                },
                neutral: {
                    DEFAULT: 'var(--neutral)',
                    light: 'var(--neutral-light)',
                },

                // Text Hierarchy
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    inverse: 'var(--text-inverse)',
                },

                // Gradient Colors
                gradient: {
                    start: 'var(--gradient-start)',
                    end: 'var(--gradient-end)',
                },
            },
            fontSize: {
                'display': ['48px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
                'h1': ['32px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
                'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
                'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
                'body': ['16px', { lineHeight: '1.6' }],
                'small': ['14px', { lineHeight: '1.5' }],
                'meta': ['12px', { lineHeight: '1.5', letterSpacing: '0.02em' }],
            },
            spacing: {
                '65': '260px', // Sidebar width
                '18': '72px',  // TopNav height
            },
            boxShadow: {
                'card': '0 1px 2px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
                'elevated': '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                'modal': '0 24px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 24px var(--primary-glow)',
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
                '3xl': '24px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease forwards',
                'slide-in': 'slideInRight 0.3s ease forwards',
                'scale-in': 'scaleIn 0.2s ease forwards',
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gradient': 'gradientShift 15s ease infinite',
                'shimmer': 'shimmer 1.5s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                gradientShift: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-primary': 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                'gradient-hero': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent)',
            },
        },
    },
    plugins: [],
};
export default config;
