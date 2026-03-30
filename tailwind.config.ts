import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brandDeal: "#8B5CF6",
        contentShoot: "#F59E0B",
        liveStream: "#EF4444",
        collaboration: "#3B82F6",
        deadline: "#6B7280",
      },
    },
  },
  plugins: [],
};

export default config;
