/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            backgroundImage: {
                radial: "radial-gradient(var(--tw-gradient-stops))",
            },
            keyframes: {
                gradient: {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
            },
            animation: {
                gradient: "gradient 8s ease infinite", // slowed a bit for smoothness
            },
            backgroundSize: {
                "400%": "400% 400%", // allows the animation to move smoothly
            },
            backdropBlur: {
                xs: "2px",
            },
        },
    },
    plugins: [],
};
