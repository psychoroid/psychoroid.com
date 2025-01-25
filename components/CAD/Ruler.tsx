'use client';

import React from 'react';
import { Line, Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function Ruler() {
    const { camera } = useThree();
    const size = 10;
    const divisions = 10;
    const step = size / divisions;

    // Create grid lines
    const lines = [];
    const labels = [];

    // X-axis
    for (let i = -size; i <= size; i += step) {
        const alpha = Math.abs(i) % 1 === 0 ? 1 : 0.3;
        lines.push(
            <Line
                key={`x-${i}`}
                points={[[i, 0, -size], [i, 0, size]]}
                color="gray"
                lineWidth={1}
                opacity={alpha}
                transparent
            />
        );
        if (Math.abs(i) % 1 === 0) {
            labels.push(
                <Html
                    key={`x-label-${i}`}
                    position={[i, 0, -size - 0.5]}
                    center
                    style={{
                        color: 'gray',
                        fontSize: '10px',
                        userSelect: 'none'
                    }}
                >
                    {i}
                </Html>
            );
        }
    }

    // Z-axis
    for (let i = -size; i <= size; i += step) {
        const alpha = Math.abs(i) % 1 === 0 ? 1 : 0.3;
        lines.push(
            <Line
                key={`z-${i}`}
                points={[[-size, 0, i], [size, 0, i]]}
                color="gray"
                lineWidth={1}
                opacity={alpha}
                transparent
            />
        );
        if (Math.abs(i) % 1 === 0) {
            labels.push(
                <Html
                    key={`z-label-${i}`}
                    position={[-size - 0.5, 0, i]}
                    center
                    style={{
                        color: 'gray',
                        fontSize: '10px',
                        userSelect: 'none'
                    }}
                >
                    {i}
                </Html>
            );
        }
    }

    // Axes
    const axes = (
        <>
            <Line
                points={[[-size, 0, 0], [size, 0, 0]]}
                color="red"
                lineWidth={2}
            />
            <Line
                points={[[0, -size, 0], [0, size, 0]]}
                color="green"
                lineWidth={2}
            />
            <Line
                points={[[0, 0, -size], [0, 0, size]]}
                color="blue"
                lineWidth={2}
            />
            <Html
                position={[size + 1, 0, 0]}
                center
                style={{ color: 'red', fontSize: '12px', userSelect: 'none' }}
            >
                X
            </Html>
            <Html
                position={[0, size + 1, 0]}
                center
                style={{ color: 'green', fontSize: '12px', userSelect: 'none' }}
            >
                Y
            </Html>
            <Html
                position={[0, 0, size + 1]}
                center
                style={{ color: 'blue', fontSize: '12px', userSelect: 'none' }}
            >
                Z
            </Html>
        </>
    );

    return (
        <group position={[0, -0.01, 0]}>
            {lines}
            {labels}
            {axes}
        </group>
    );
} 