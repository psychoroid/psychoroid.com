import Image from 'next/image';

interface IconProps {
    width?: number;
    height?: number;
    className?: string;
}

export function MAYAIcon({ width = 24, height = 24, className }: IconProps) {
    return (
        <div style={{ width, height }} className={className}>
            <Image
                src="/icon/maya.webp"
                alt="Maya Icon"
                width={width}
                height={height}
                style={{ objectFit: 'contain' }}
            />
        </div>
    );
}