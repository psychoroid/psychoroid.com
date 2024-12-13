const ProgressEvent = typeof window !== 'undefined' ? window.ProgressEvent : null;

import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('./SceneComponent'), {
    ssr: false
})

export default Scene;