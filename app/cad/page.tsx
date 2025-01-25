'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/contexts/UserContext'
import dynamic from 'next/dynamic'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { CADSidebar } from '@/components/CAD/sidebar/CADSidebarLeft'
import { CADParameters } from '@/components/CAD/sidebar/CADSidebarRight'
import { CADViewer } from '@/components/CAD/CADViewer'
import { ChatInstance } from '@/components/CAD/CADChat'
import { cn } from "@/lib/actions/utils"
import { SidebarProvider } from '@/components/ui/sidebar'
import Loader from '@/components/design/loader'

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
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
    const [history, setHistory] = useState<CADHistoryItem[]>([])
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)
    const [activeOperation, setActiveOperation] = useState<string>('')
    const [currentPrompt, setCurrentPrompt] = useState('')

    // Memoize parameter change handler
    const handleParameterChange = useCallback((name: string, value: number) => {
        setParameters(prev => ({
            ...prev,
            [name]: value
        }))
    }, [])

    // Memoize operation change handler
    const handleOperationChange = useCallback((operation: string | null) => {
        setActiveOperation(operation || '')
    }, [])

    // Memoize prompt submit handler
    const handlePromptSubmit = useCallback(async (content: string, attachments?: File[]) => {
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
            toast.error(error instanceof Error ? error.message : 'Failed to generate CAD model')
        } finally {
            setIsGenerating(false)
        }
    }, [])

    // Protect route with better handling - add proper dependencies
    useEffect(() => {
        if (!isUserLoading && !user) {
            const returnPath = encodeURIComponent(pathname)
            router.push(`/auth/sign-in?returnPath=${returnPath}`)
        }
    }, [user, isUserLoading, router, pathname])

    // Show loading state while checking auth
    if (isUserLoading) {
        return <Loader />
    }

    // Don't render anything if not authenticated
    if (!user) {
        return null
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
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Chat History */}
                <div className="flex-shrink-0">
                    <SidebarProvider defaultCollapsed={false} id="left">
                        <CADSidebar
                            user={user}
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
                            onHistoryItemClick={(item: CADHistoryItem) => {
                                toast.success('Loading project...')
                            }}
                        />
                    </SidebarProvider>
                </div>

                {/* Middle Panel - Visualizer and Chat */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* CAD Visualizer */}
                    <div className="flex-1 relative bg-muted/50 min-h-[70%]">
                        <CADViewer
                            modelUrl={modelUrl}
                            parameters={parameters}
                            onParameterChange={handleParameterChange}
                            onExport={handleExport}
                            onShare={handleShare}
                            activeOperation={activeOperation}
                            onOperationChange={handleOperationChange}
                        />
                    </div>

                    {/* Chat Interface with History */}
                    <div className="h-[30%] flex flex-col bg-background/95 backdrop-blur-sm border-t border-border/50">
                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-2 items-start",
                                        message.role === 'assistant' ? "justify-start" : "justify-end"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[80%] rounded-none p-3",
                                        message.role === 'assistant'
                                            ? "bg-muted/50"
                                            : "bg-primary/5"
                                    )}>
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        {message.parameters && (
                                            <div className="mt-2 text-xs opacity-80 bg-muted/50 p-2 rounded-none">
                                                <pre className="overflow-x-auto">
                                                    {JSON.stringify(message.parameters, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chat Input */}
                        <div className="p-2">
                            <ChatInstance
                                isUploading={isGenerating}
                                onPromptSubmit={handlePromptSubmit}
                                showPreview={false}
                                user={user}
                                setShowAuthModal={setShowAuthModal}
                                value={currentPrompt}
                                onChange={setCurrentPrompt}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel - Parameters */}
                <div className="flex-shrink-0">
                    <SidebarProvider defaultCollapsed={false} id="right">
                        <CADParameters
                            parameters={defaultParameters.map(param => ({
                                ...param,
                                value: parameters[param.name] || param.value
                            }))}
                            onChange={handleParameterChange}
                            onReset={() => {
                                setParameters({
                                    width: 100,
                                    height: 100,
                                    depth: 100,
                                    radius: 10,
                                    segments: 32
                                });
                            }}
                            onUndo={() => {
                                setCanUndo(false);
                                toast.success('Undo feature coming soon');
                            }}
                            className="h-full"
                        />
                    </SidebarProvider>
                </div>
            </div>
        </motion.div>
    )
} 