'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { CADSidebar } from '@/components/CAD/sidebar/CADSidebarLeft'
import CADParameters from '@/components/CAD/sidebar/CADSidebarRight'
import { CADViewer } from '@/components/CAD/CADViewer'
import { ChatInstance } from '@/components/CAD/CADChat'
import { cn } from "@/lib/actions/utils"
import { SidebarProvider } from '@/components/ui/sidebar'
import Loader from '@/components/design/loader'
import { useCADChat } from '@/hooks/use-cad-chat'

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
    [key: string]: number | string | boolean;
}

interface NumberParameter {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    group: string;
    type: 'number';
}

interface ColorParameter {
    name: string;
    value: string;
    min: number;
    max: number;
    step: number;
    group: string;
    type: 'color';
}

type Parameter = NumberParameter | ColorParameter;

interface CADHistoryItem {
    id: string
    title: string
    timestamp: Date
    preview?: string
}

interface CADResponse {
    modelUrl?: string;
    format?: string;
    modelId: string;
    message: string;
    error?: string;
}

interface PageProps {
    params: {
        username: string
    }
}

export default function CADPage({ params }: PageProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isLoading: isUserLoading } = useUser()
    const [modelUrl, setModelUrl] = useState<string | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [parameters, setParameters] = useState<CADParameters>({
        width: 1,
        height: 1,
        depth: 1,
        radius: 0,
        segments: 4,
        color: '#ffffff',
        roughness: 0.5,
        metalness: 0,
        opacity: 1,
        wireframe: false,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1
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

    // Use our CAD chat hook
    const {
        messages,
        currentChat,
        createChat,
        loadChat,
        saveMessage,
        loadUserChats
    } = useCADChat()

    const defaultParameters = useMemo(() => {
        const params: Parameter[] = [
            // Dimensions
            { name: 'width', value: Number(parameters.width), min: 0.1, max: 100, step: 0.1, unit: 'mm', group: 'dimensions', type: 'number' },
            { name: 'height', value: Number(parameters.height), min: 0.1, max: 100, step: 0.1, unit: 'mm', group: 'dimensions', type: 'number' },
            { name: 'depth', value: Number(parameters.depth), min: 0.1, max: 100, step: 0.1, unit: 'mm', group: 'dimensions', type: 'number' },
            { name: 'radius', value: Number(parameters.radius), min: 0, max: 100, step: 0.1, unit: 'mm', group: 'dimensions', type: 'number' },
            { name: 'segments', value: Number(parameters.segments), min: 2, max: 32, step: 1, group: 'dimensions', type: 'number' },

            // Transform
            { name: 'rotationX', value: Number(parameters.rotationX), min: -360, max: 360, step: 1, unit: '°', group: 'transform', type: 'number' },
            { name: 'rotationY', value: Number(parameters.rotationY), min: -360, max: 360, step: 1, unit: '°', group: 'transform', type: 'number' },
            { name: 'rotationZ', value: Number(parameters.rotationZ), min: -360, max: 360, step: 1, unit: '°', group: 'transform', type: 'number' },
            { name: 'positionX', value: Number(parameters.positionX), min: -100, max: 100, step: 0.1, unit: 'mm', group: 'transform', type: 'number' },
            { name: 'positionY', value: Number(parameters.positionY), min: -100, max: 100, step: 0.1, unit: 'mm', group: 'transform', type: 'number' },
            { name: 'positionZ', value: Number(parameters.positionZ), min: -100, max: 100, step: 0.1, unit: 'mm', group: 'transform', type: 'number' },

            // Material
            { name: 'color', value: String(parameters.color), min: 0, max: 0, step: 0, group: 'material', type: 'color' },
            { name: 'roughness', value: Number(parameters.roughness), min: 0, max: 1, step: 0.01, group: 'material', type: 'number' },
            { name: 'metalness', value: Number(parameters.metalness), min: 0, max: 1, step: 0.01, group: 'material', type: 'number' },
            { name: 'opacity', value: Number(parameters.opacity), min: 0, max: 1, step: 0.01, group: 'material', type: 'number' },
            { name: 'wireframe', value: Number(parameters.wireframe ? 1 : 0), min: 0, max: 1, step: 1, group: 'material', type: 'number' }
        ];
        return params;
    }, [parameters]);

    const handleReset = useCallback(() => {
        setParameters({
            width: 1,
            height: 1,
            depth: 1,
            radius: 0,
            segments: 4,
            color: '#ffffff',
            roughness: 0.5,
            metalness: 0,
            opacity: 1,
            wireframe: false,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1
        });
    }, []);

    const onNewProject = useCallback(async () => {
        // Create a new chat session
        const chat = await createChat('New CAD Project')
        if (chat) {
            // Reset all states
            setParameters({
                width: 1,
                height: 1,
                depth: 1,
                radius: 0,
                segments: 4,
                color: '#ffffff',
                roughness: 0.5,
                metalness: 0,
                opacity: 1,
                wireframe: false,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                positionX: 0,
                positionY: 0,
                positionZ: 0,
                scaleX: 1,
                scaleY: 1,
                scaleZ: 1
            })
            setModelUrl(null)
        }
    }, [createChat])

    const handleUndo = useCallback(() => {
        // TODO: Implement undo functionality
        toast.success('Undo feature coming soon');
    }, []);

    // Memoize parameter change handler with throttling
    const handleParameterChange = useCallback((name: string, value: number | string | boolean) => {
        // Use requestAnimationFrame to sync with browser's render cycle
        requestAnimationFrame(() => {
            setParameters(prev => {
                // Only update if the value has actually changed
                if (prev[name] === value) return prev;
                return {
                    ...prev,
                    [name]: value
                };
            });
        });
    }, []);

    // Memoize operation change handler
    const handleOperationChange = useCallback((operation: string | null) => {
        setActiveOperation(operation || '')
    }, [])

    // Load user's chat history on mount
    useEffect(() => {
        if (user) {
            loadUserChats().then(chats => {
                // If there are previous chats, you might want to load the most recent one
                if (chats?.length > 0) {
                    loadChat(chats[0].id)
                }
            })
        }
    }, [user, loadUserChats, loadChat])

    // Modified prompt submit handler to use chat persistence
    const handlePromptSubmit = useCallback(async (content: string, attachments?: File[]): Promise<CADResponse> => {
        try {
            setIsGenerating(true)

            // Create a new chat if we don't have one
            if (!currentChat) {
                const chat = await createChat(content)
                if (!chat) {
                    throw new Error('Failed to create chat session')
                }
            }

            // Save user message to database
            await saveMessage(content, 'user')

            // Call our CAD API endpoint
            const response = await fetch('/api/cad', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: content })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate CAD model')
            }

            // Save assistant message to database with model data
            await saveMessage(
                'Here is your generated CAD model:',
                'assistant',
                {
                    modelUrl: data.modelUrl,
                    format: data.format,
                    modelId: data.modelId,
                    parameters: data.shapes?.[0]?.parameters
                }
            )

            // Update parameters if available
            if (data.shapes?.[0]?.parameters) {
                setParameters(data.shapes[0].parameters)
            }

            // Create a Blob URL for the mesh data
            const meshBlob = new Blob([JSON.stringify(data.mesh)], { type: 'application/json' })
            const meshUrl = URL.createObjectURL(meshBlob)
            setModelUrl(meshUrl)

            toast.success('CAD model generated successfully')

            return {
                modelUrl: meshUrl,
                format: 'glb',
                modelId: data.modelId || Date.now().toString(),
                message: 'CAD model generated successfully'
            }

        } catch (error) {
            console.error('Error generating CAD model:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate CAD model'
            toast.error(errorMessage)
            return {
                modelId: Date.now().toString(),
                message: errorMessage,
                error: errorMessage
            }
        } finally {
            setIsGenerating(false)
        }
    }, [currentChat, createChat, saveMessage])

    // Protect route with better handling - add proper dependencies
    useEffect(() => {
        if (!isUserLoading && !user) {
            const returnPath = encodeURIComponent(pathname)
            router.push(`/sign-in?returnPath=${returnPath}`)
        }
    }, [user, isUserLoading, router, pathname])

    useEffect(() => {
        // Verify the username matches the current user
        const checkUser = async () => {
            if (!isUserLoading) {
                if (!user) {
                    const returnPath = encodeURIComponent(`/cad/${params.username}`)
                    router.push(`/sign-in?returnPath=${returnPath}`)
                    return
                }

                // Check if username matches
                if (user.user_metadata?.username !== params.username) {
                    // If username doesn't match, redirect to their own page
                    router.replace(`/cad/${user.user_metadata?.username}`)
                }
            }
        }

        checkUser()
    }, [user, isUserLoading, router, params.username])

    // Show loading state while checking auth
    if (isUserLoading) {
        return <Loader />
    }

    // Don't render anything if not authenticated or username doesn't match
    if (!user || user.user_metadata?.username !== params.username) {
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
                            onNewProject={onNewProject}
                            onHistoryItemClick={async (item: CADHistoryItem) => {
                                if (item.id) {
                                    await loadChat(item.id)
                                    toast.success('Chat loaded successfully')
                                }
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
                                sessionId={currentChat?.id}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel - Parameters */}
                <div className="flex-shrink-0">
                    <SidebarProvider defaultCollapsed={false} id="right">
                        <CADParameters
                            parameters={defaultParameters}
                            onChange={handleParameterChange}
                            onReset={handleReset}
                            onUndo={handleUndo}
                            className="h-full"
                        />
                    </SidebarProvider>
                </div>
            </div>
        </motion.div>
    )
} 