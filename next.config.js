/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    webpack: (config) => {
        config.module.rules.push({
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
        });
        return config;
    },
    images: {
        domains: ['peyzpnmmgsxjydvpussg.supabase.co', 'peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images'],
    },
}

module.exports = nextConfig 