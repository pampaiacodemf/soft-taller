/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
                chart: {
                    "1": "hsl(var(--chart-1))",
                    "2": "hsl(var(--chart-2))",
                    "3": "hsl(var(--chart-3))",
                    "4": "hsl(var(--chart-4))",
                    "5": "hsl(var(--chart-5))",
                },
                // ── High-Performance brand palette ──
                fire: {
                    orange: "#f97316",
                    red: "#dc2626",
                    "orange-light": "#fb923c",
                    "red-dark": "#7f1d1d",
                },
                pit: {
                    black: "#0a0a0a",
                    "black-soft": "#171717",
                    "black-card": "#111111",
                    "black-muted": "#1f1f1f",
                    "gray-dim": "#3f3f3f",
                    "gray-mid": "#6b6b6b",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            backgroundImage: {
                "gradient-fire": "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
                "gradient-fire-subtle": "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(220,38,38,0.10) 100%)",
                "gradient-dark": "linear-gradient(135deg, #171717 0%, #0a0a0a 100%)",
                "gradient-sidebar": "linear-gradient(180deg, #0a0a0a 0%, #0f0f0f 100%)",
            },
            boxShadow: {
                "fire": "0 0 20px rgba(249, 115, 22, 0.3), 0 4px 16px rgba(0, 0, 0, 0.6)",
                "fire-lg": "0 0 40px rgba(249, 115, 22, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)",
                "red": "0 0 20px rgba(220, 38, 38, 0.3), 0 4px 16px rgba(0, 0, 0, 0.6)",
                "card": "0 2px 12px rgba(0, 0, 0, 0.5)",
                "card-hover": "0 4px 24px rgba(0, 0, 0, 0.7), 0 0 1px rgba(249,115,22,0.3)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "slide-in": {
                    "0%": { transform: "translateX(-100%)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(8px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "pulse-fire": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(249,115,22,0)" },
                    "50%": { boxShadow: "0 0 0 6px rgba(249,115,22,0.15)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "slide-in": "slide-in 0.3s ease-out",
                "fade-in": "fade-in 0.3s ease-out",
                "pulse-fire": "pulse-fire 2s ease-in-out infinite",
                shimmer: "shimmer 2s linear infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
