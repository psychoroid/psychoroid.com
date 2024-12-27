import Image from 'next/image';

interface IconProps {
    width?: number;
    height?: number;
    className?: string;
}

export function UnrealIcon({ width = 24, height = 24, className }: IconProps) {
    return (
        <div style={{ width, height }} className={className}>
            <Image
                src="/icon/unreal.png"
                alt="Unreal Icon"
                width={width}
                height={height}
                style={{ objectFit: 'contain' }}
            />
        </div>
    );
}
