'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/contexts/UserContext'
import dynamic from 'next/dynamic'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { CADSidebar } from '@/components/CAD/CADSidebar'
import { CADHeader } from '@/components/CAD/CADHeader'
import { CADMessage } from '@/components/CAD/CADMessage'
import { CADInput } from '@/components/CAD/CADInput'
import { CADSuggestions } from '@/components/CAD/CADSuggestions'
import { CADParameters } from '@/components/CAD/CADParameters'
import { CADToolbar } from '@/components/CAD/CADToolbar'

// Remove heavy components from initial bundle
const DynamicCADViewer = dynamic(() => import('@/components/3D/ProductViewer').then(mod => ({ default: mod.ProductViewer })), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-card/50 animate-pulse" />
})

interface CADMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    parameters?: any
}

interface CADParameters {
    [key: string]: number
}

interface CADHistoryItem {
    id: string
    title: string
    timestamp: Date
    preview?: string
}

export default function CADPage() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isLoading: isUserLoading } = useUser()
    const [modelUrl, setModelUrl] = useState<string | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [messages, setMessages] = useState<CADMessage[]>([])
    const [parameters, setParameters] = useState<CADParameters>({
        width: 100,
        height: 100,
        depth: 100,
        radius: 10,
        segments: 32
    })
    const [selectedModel, setSelectedModel] = useState('basic')
    const [showSidebar, setShowSidebar] = useState(true)
    const [history, setHistory] = useState<CADHistoryItem[]>([])
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // Protect route with better handling
    useEffect(() => {
        if (!isUserLoading && !user) {
            const returnPath = encodeURIComponent(pathname)
            router.push(`/auth/sign-in?returnPath=${returnPath}`)
            return
        }
    }, [user, isUserLoading, router, pathname])

    // Show loading state while checking auth
    if (isUserLoading) {
        return (
            <div className="h-svh bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        )
    }

    // Don't render anything if not authenticated
    if (!user) {
        return null
    }

    const handlePromptSubmit = async (content: string, attachments?: File[]) => {
        try {
            setIsGenerating(true)

            // Add user message
            const userMessage: CADMessage = {
                id: Date.now().toString(),
                role: 'user',
                content,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, userMessage])

            // Handle attachments if needed
            const formData = new FormData()
            formData.append('prompt', content)
            if (attachments?.length) {
                attachments.forEach(file => formData.append('files', file))
            }

            // Call our CAD API endpoint
            const response = await fetch('/api/cad', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate CAD model')
            }

            // Add assistant message
            const assistantMessage: CADMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Here are the CAD instructions based on your request:',
                timestamp: new Date(),
                parameters: data.shapes[0]?.parameters
            }
            setMessages(prev => [...prev, assistantMessage])

            // Update parameters if available
            if (data.shapes[0]?.parameters) {
                setParameters(prev => ({
                    ...prev,
                    ...data.shapes[0].parameters
                }))
            }

            // Update history
            const historyItem: CADHistoryItem = {
                id: Date.now().toString(),
                title: content,
                timestamp: new Date(),
                preview: data.shapes[0]?.preview
            }
            setHistory(prev => [...prev, historyItem])

            toast.success('CAD instructions generated successfully')

        } catch (error) {
            console.error('Error generating CAD model:', error)

            // Add error message
            const errorMessage: CADMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: error instanceof Error ? error.message : 'Failed to generate CAD model',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])

            toast.error('Failed to generate CAD model')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExport = () => {
        // TODO: Implement export functionality
        toast.success('Export feature coming soon')
    }

    const handleShare = () => {
        // TODO: Implement share functionality
        toast.success('Share feature coming soon')
    }

    const handleSettings = () => {
        // TODO: Implement settings functionality
        toast.success('Settings feature coming soon')
    }

    const defaultParameters = [
        { name: 'width', value: 100, min: 1, max: 1000, step: 1, unit: 'mm' },
        { name: 'height', value: 100, min: 1, max: 1000, step: 1, unit: 'mm' },
        { name: 'depth', value: 100, min: 1, max: 1000, step: 1, unit: 'mm' },
        { name: 'radius', value: 10, min: 0, max: 100, step: 0.1, unit: 'mm' },
        { name: 'segments', value: 32, min: 3, max: 64, step: 1 }
    ];

    const handleParameterChange = (name: string, value: number) => {
        setParameters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSuggestionClick = async (prompt: string) => {
        await handlePromptSubmit(prompt);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-svh bg-background flex flex-col overflow-hidden"
        >
            <CADHeader
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={() => setCanUndo(false)}
                onRedo={() => setCanRedo(false)}
                onExport={handleExport}
                onShare={handleShare}
                onSettings={handleSettings}
            />

            <div className="flex-1 flex overflow-hidden">
                {showSidebar && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="border-r"
                    >
                        <CADSidebar
                            user={user}
                            history={history}
                            onNewProject={() => {
                                setMessages([])
                                setParameters({
                                    width: 100,
                                    height: 100,
                                    depth: 100,
                                    radius: 10,
                                    segments: 32
                                })
                                setModelUrl(null)
                            }}
                            onHistoryItemClick={(item) => {
                                // TODO: Load project from history
                                toast.success('Loading project...')
                            }}
                        />
                    </motion.div>
                )}

                <div className="flex-1 flex">
                    {/* Left Panel - Parameters */}
                    <div className="w-[300px] border-r">
                        <CADParameters
                            parameters={defaultParameters}
                            onChange={handleParameterChange}
                            onReset={() => {
                                setParameters({
                                    width: 100,
                                    height: 100,
                                    depth: 100,
                                    radius: 10,
                                    segments: 32
                                })
                            }}
                            onUndo={() => setCanUndo(false)}
                            className="h-full"
                        />
                    </div>

                    {/* Middle Panel - Viewer */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 p-4">
                            <div className="w-full h-full bg-muted/50 rounded-lg border">
                                {modelUrl ? (
                                    <DynamicCADViewer modelUrl={modelUrl} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <p className="text-sm mb-8">Start creating your CAD model using the chat interface</p>
                                        <CADSuggestions
                                            onSuggestionClick={handleSuggestionClick}
                                            isLoading={isGenerating}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Floating Toolbar */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <CADToolbar
                                onExport={handleExport}
                                onShare={handleShare}
                            />
                        </div>
                    </div>

                    {/* Right Panel - Chat */}
                    <div className="w-[400px] border-l flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-4 p-4">
                                {messages.map((message, index) => (
                                    <CADMessage
                                        key={message.id}
                                        {...message}
                                        isLatest={index === messages.length - 1}
                                    />
                                ))}
                            </div>
                        </div>

                        <CADInput
                            onSubmit={handlePromptSubmit}
                            isLoading={isGenerating}
                            disabled={isGenerating}
                            showAttachments
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    )
} 