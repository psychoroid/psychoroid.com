const WebpackObfuscator = require('webpack-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    poweredByHeader: false,
    compress: true,

    // Optimize page loading
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

    // Font optimization
    optimizeFonts: true,

    webpack: (config, { dev, isServer }) => {
        // Asset handling
        config.module.rules.push({
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
            generator: {
                filename: 'static/fonts/[hash][ext]'
            }
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
            },
            {
                protocol: 'https',
                hostname: 'api.producthunt.com',
                pathname: '/widgets/embed-image/v1/**',
            }
        ],
        unoptimized: false,
        minimumCacheTTL: 60,
    },

    async headers() {
        const headers = [
            {
                key: 'Cross-Origin-Opener-Policy',
                value: 'same-origin',
            },
            {
                key: 'Cross-Origin-Embedder-Policy',
                value: 'credentialless',
            }
        ];

        // Only add aggressive caching in production
        if (process.env.NODE_ENV === 'production') {
            headers.push({
                key: 'Cache-Control',
                value: 'public, max-age=150000, stale-while-revalidate=86400',
            });
        } else {
            headers.push({
                key: 'Cache-Control',
                value: 'no-cache, no-store, must-revalidate',
            });
        }

        return [
            {
                source: '/:path*',
                headers,
            },
        ];
    },
};

module.exports = nextConfig; 