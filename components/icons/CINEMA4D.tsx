import { FC } from 'react';
import Image from 'next/image';

interface IconProps {
    width?: number;
    height?: number;
    className?: string;
}

export const CINEMA4DIcon: FC<IconProps> = ({ width = 24, height = 24, className }) => {
    return (
        <div style={{ width, height }} className={className}>
            <Image
                src="/icon/cinema4d.png"
                alt="Cinema 4D"
                width={width}
                height={height}
                style={{ objectFit: 'contain' }}
            />
        </div>
    );
};
