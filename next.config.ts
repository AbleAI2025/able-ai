import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ["firebasestorage.googleapis.com"],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Exclude Node.js modules from client-side bundle
            config.resolve.fallback = {
                ...config.resolve.fallback,
                child_process: false,
                fs: false,
                os: false,
                path: false,
                crypto: false,
                stream: false,
                util: false,
                buffer: false,
                process: false,
                net: false,
                tls: false,
                http2: false,
                https: false,
                http: false,
                zlib: false,
                querystring: false,
                url: false,
                assert: false,
                constants: false,
                events: false,
                punycode: false,
                string_decoder: false,
                timers: false,
                tty: false,
                vm: false,
                worker_threads: false,
            };
        }
        
        // Enable WebAssembly support
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };
        
        return config;
    },
};

export default nextConfig;
