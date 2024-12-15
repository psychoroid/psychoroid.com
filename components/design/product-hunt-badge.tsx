'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'

interface ProductHuntBadgeProps {
    productId: string
}

export function ProductHuntBadge({ productId }: ProductHuntBadgeProps) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <a
            href={`https://www.producthunt.com/posts/${productId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
        >
            <Image
                src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=${productId}&theme=${isDark ? 'dark' : 'light'}`}
                alt="Product Hunt Badge"
                width={125}
                height={27}
                priority
                unoptimized
                className="w-auto h-auto"
                style={{
                    maxWidth: '100%',
                    height: 'auto'
                }}
            />
        </a>
    )
}

