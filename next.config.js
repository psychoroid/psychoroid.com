const WebpackObfuscator = require('webpack-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

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

        // Add lightweight code protection for production builds only
        if (!dev && !isServer) {
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
                ],
            },
        ];
    },
}

module.exports = nextConfig 