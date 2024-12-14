const JavaScriptObfuscator = require('javascript-obfuscator');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    // Optimize and protect production builds
    webpack: (config, { dev, isServer }) => {
        // Keep existing rules
        config.module.rules.push({
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
        });
        config.module.rules.push({
            test: /\.(glb|gltf)$/,
            use: {
                loader: 'file-loader',
            },
        });

        // Add code protection for production builds
        if (!dev && !isServer) {
            // Add JavaScript Obfuscator
            config.module.rules.push({
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'webpack-obfuscator',
                    options: {
                        compact: true,
                        controlFlowFlattening: true,
                        controlFlowFlatteningThreshold: 1,
                        deadCodeInjection: true,
                        deadCodeInjectionThreshold: 0.9,
                        debugProtection: true,
                        disableConsoleOutput: true,
                        identifierNamesGenerator: 'hexadecimal',
                        log: false,
                        renameGlobals: true,
                        rotateStringArray: true,
                        selfDefending: true,
                        shuffleStringArray: true,
                        splitStrings: true,
                        stringArray: true,
                        stringArrayThreshold: 1,
                        transformObjectKeys: true,
                        unicodeEscapeSequence: false
                    }
                }
            });

            // Optimize chunks
            config.optimization = {
                ...config.optimization,
                minimize: true,
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    maxSize: 244000,
                    minChunks: 1,
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
                    cacheGroups: {
                        defaultVendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10,
                            reuseExistingChunk: true,
                        },
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };
        }

        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };

        return config;
    },

    // Keep existing image configuration
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
    },

    // Additional production optimizations
    productionBrowserSourceMaps: false,
    compress: true,
}

// Export with bundle analyzer wrapper
module.exports = withBundleAnalyzer(nextConfig); 