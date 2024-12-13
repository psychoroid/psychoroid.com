import { Suspense } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export function ModelViewer({ url }) {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Model url={url} />
        </Suspense>
    )
}

function Model({ url }) {
    const gltf = useLoader(GLTFLoader, url)
    return <primitive object={gltf.scene} />
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
    )
} 