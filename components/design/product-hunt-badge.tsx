'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'

export function ProductHuntBadge() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <a
            href="https://www.producthunt.com/posts/psychoroid-com?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-psychoroid-com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
        >
            <Image
                src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=425252&theme=${isDark ? 'dark' : 'light'}`}
                alt="psychoroid.com - Turn prompts and images into production-ready 3D models | Product Hunt"
                width={250}
                height={54}
                unoptimized
                style={{
                    width: '250px',
                    height: '54px'
                }}
            />
        </a>
    )
}