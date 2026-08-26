import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    turbopack: {
        root: path.resolve(import.meta.dirname),
    },
};

export default nextConfig;
