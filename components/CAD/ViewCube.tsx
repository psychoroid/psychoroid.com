'use client';

import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function ViewCube() {
    const { camera } = useThree();
    const cubeRef = useRef<HTMLDivElement>(null);

    const handleFaceClick = (position: [number, number, number]) => {
        if (!camera) return;

        // Animate camera to the clicked face
        const distance = camera.position.length();
        camera.position.set(
            position[0] * distance,
            position[1] * distance,
            position[2] * distance
        );
        camera.lookAt(0, 0, 0);
    };

    return (
        <Html
            position={[0, 0, 0]}
            style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                width: '80px',
                height: '80px',
                pointerEvents: 'none'
            }}
        >
            <div
                ref={cubeRef}
                className="relative w-full h-full"
                style={{
                    transform: `rotateX(${-camera.rotation.x}rad) rotateY(${-camera.rotation.y}rad) rotateZ(${-camera.rotation.z}rad)`
                }}
            >
                {/* Cube faces */}
                <button
                    onClick={() => handleFaceClick([0, 0, 1])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border text-xs font-medium pointer-events-auto"
                >
                    Front
                </button>
                <button
                    onClick={() => handleFaceClick([1, 0, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border text-xs font-medium pointer-events-auto"
                    style={{ transform: 'rotateY(90deg) translateZ(40px)' }}
                >
                    Right
                </button>
                <button
                    onClick={() => handleFaceClick([-1, 0, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border text-xs font-medium pointer-events-auto"
                    style={{ transform: 'rotateY(-90deg) translateZ(40px)' }}
                >
                    Left
                </button>
                <button
                    onClick={() => handleFaceClick([0, 1, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border text-xs font-medium pointer-events-auto"
                    style={{ transform: 'rotateX(-90deg) translateZ(40px)' }}
                >
                    Top
                </button>
                <button
                    onClick={() => handleFaceClick([0, -1, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border text-xs font-medium pointer-events-auto"
                    style={{ transform: 'rotateX(90deg) translateZ(40px)' }}
                >
                    Bottom
                </button>
                <button
                    onClick={() => handleFaceClick([0, 0, -1])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border text-xs font-medium pointer-events-auto"
                    style={{ transform: 'rotateY(180deg) translateZ(40px)' }}
                >
                    Back
                </button>
            </div>
        </Html>
    );
} 