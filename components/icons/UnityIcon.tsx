import Image from 'next/image';

interface IconProps {
    width?: number;
    height?: number;
    className?: string;
}

export function UnityIcon({ width = 24, height = 24, className }: IconProps) {
    return (
        <div style={{ width, height }} className={className}>
            <Image
                src="/icon/unity.png"
                alt="Unity Icon"
                width={width}
                height={height}
                style={{ objectFit: 'contain' }}
            />
        </div>
    );
}
