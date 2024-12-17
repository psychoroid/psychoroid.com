const WebpackObfuscator = require('webpack-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    poweredByHeader: false,
    compress: true,

    // Optimize page loading
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

    webpack: (config, { dev, isServer }) => {
        // Asset handling
        config.module.rules.push({
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
        });

        // Enhanced 3D model file handling
        config.module.rules.push({
            test: /\.(glb|gltf|obj|stl|usdz|fbx|step)$/,
            type: 'asset/resource',
            generator: {
                filename: 'static/models/[hash][ext]'
            }
        });

        // Production-only optimizations
        if (!dev && !isServer) {
            // Only apply obfuscation to production client-side code
            config.plugins.push(
                new WebpackObfuscator({
                    compact: true,
                    controlFlowFlattening: false,
                    deadCodeInjection: false,
                    debugProtection: true,
                    disableConsoleOutput: true,
                    identifierNamesGenerator: 'hexadecimal',
                    log: false,
                    renameGlobals: false,
                    rotateStringArray: true,
                    selfDefending: true,
                    stringArray: true,
                    stringArrayThreshold: 0.75,
                    transformObjectKeys: false
                }, [])
            );
        }

        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };

        return config;
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'peyzpnmmgsxjydvpussg.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/dzrdlevfn/**',
            }
        ],
        unoptimized: false,
        minimumCacheTTL: 60,
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig; 