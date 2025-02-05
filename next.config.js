const WebpackObfuscator = require('webpack-obfuscator');
const CompressionPlugin = require('compression-webpack-plugin');

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
        // Existing asset handling rules...
        config.module.rules.push({
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
            generator: {
                filename: 'static/fonts/[hash][ext]'
            }
        });

        config.module.rules.push({
            test: /\.(glb|gltf|obj|stl|usdz|fbx|step)$/,
            type: 'asset/resource',
            generator: {
                filename: 'static/models/[hash][ext]'
            }
        });

        // Handle WebSocket module
        if (isServer) {
            config.externals.push({
                'bufferutil': 'bufferutil',
                'utf-8-validate': 'utf-8-validate',
                'ws': 'ws'
            })
        }

        // Production-only optimizations
        if (!dev && !isServer) {
            // Add compression plugin
            config.plugins.push(
                new CompressionPlugin({
                    filename: '[path][base].gz',
                    algorithm: 'gzip',
                    test: /\.(js|css|html|svg)$/,
                    threshold: 10240,
                    minRatio: 0.8,
                    deleteOriginalAssets: false // Keep original files
                }),
                new CompressionPlugin({
                    filename: '[path][base].br',
                    algorithm: 'brotliCompress',
                    test: /\.(js|css|html|svg)$/,
                    threshold: 10240,
                    minRatio: 0.8,
                    deleteOriginalAssets: false // Keep original files
                })
            );

            // Existing obfuscation
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

        // Enable WebAssembly
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
            syncWebAssembly: true,
        };

        return config;
    },

    // Enhanced image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'peyzpnmmgsxjydvpussg.supabase.co',
                port: '',
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
            },
            {
                protocol: 'https',
                hostname: 'fal.media',
                pathname: '/files/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.sanity.io',
            },
        ],
        unoptimized: true,
        minimumCacheTTL: 60,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Enhanced headers with better caching strategy
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

        if (process.env.BUN_ENV === 'production') {
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