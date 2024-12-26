'use client'

import { Box } from "lucide-react"
import { StudioChat } from "./StudioChat"
import RippleButton from "@/components/ui/magic/ripple-button"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
// import { RemeshButton } from "./RemeshButton"
// import { TextureButton } from "./TextureButton"

interface ModelGeneratorProps {
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
    isUploading: boolean
    onPromptSubmit: (prompt: string) => void
    user: any
    onGenerateVariation: () => void
}

export function ModelGenerator({
    onFileSelect,
    isUploading,
    onPromptSubmit,
    user,
    onGenerateVariation
}: ModelGeneratorProps) {
    const [isRemeshOpen, setIsRemeshOpen] = useState(false)
    const [isTextureOpen, setIsTextureOpen] = useState(false)
    const [isNewModelOpen, setIsNewModelOpen] = useState(true)

    // const handleRemeshClick = () => {
    //     setIsRemeshOpen(!isRemeshOpen)
    //     setIsTextureOpen(false)
    //     setIsNewModelOpen(false)
    // }

    // const handleTextureClick = () => {
    //     setIsTextureOpen(!isTextureOpen)
    //     setIsRemeshOpen(false)
    //     setIsNewModelOpen(false)
    // }

    const handleNewModelClick = () => {
        setIsNewModelOpen(!isNewModelOpen)
        setIsRemeshOpen(false)
        setIsTextureOpen(false)
    }

    return (
        <div className="w-full h-full flex flex-col">
            <motion.div
                className="flex-1 border border-border bg-card/50 flex flex-col h-full"
                animate={{
                    height: isRemeshOpen || isTextureOpen ? "auto" : "100%"
                }}
            >
                <div className="grid grid-cols-1 gap-1 p-1">
                    <RippleButton
                        onClick={handleNewModelClick}
                        className="w-full h-16 px-6 group hover:bg-accent rounded-none border-2 border-border"
                        rippleColor="rgba(215, 61, 87, 0.2)"
                    >
                        <div className="flex items-center gap-3">
                            <Box className="h-5 w-5 -ml-11 shrink-0 text-[#D73D57]" />
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Create</span>
                                <span className="text-xs text-muted-foreground">
                                    Generate a new 3D model
                                </span>
                            </div>
                        </div>
                    </RippleButton>

                    <AnimatePresence>
                        {isNewModelOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="border border-border bg-background/50 p-1">
                                    <StudioChat
                                        onFileSelect={onFileSelect}
                                        isUploading={isUploading}
                                        onPromptSubmit={onPromptSubmit}
                                        user={user}
                                        onGenerateVariation={onGenerateVariation}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* <div className="relative">
                        <RemeshButton isOpen={isRemeshOpen} onClick={handleRemeshClick} />
                    </div>

                    <div className="relative">
                        <TextureButton isOpen={isTextureOpen} onClick={handleTextureClick} />
                    </div> */}

                    <div className="relative">
                        <RippleButton
                            className="w-full h-16 px-6 group hover:bg-accent rounded-none border border-border opacity-50 cursor-not-allowed"
                            rippleColor="rgba(100, 100, 100, 0.2)"
                            disabled
                        >
                            <div className="flex items-center gap-3">
                                <Box className="h-5 w-5 shrink-0 text-gray-500" />
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Coming Soon</span>
                                    <span className="text-xs text-muted-foreground">
                                        Exciting features in development
                                    </span>
                                </div>
                            </div>
                        </RippleButton>
                    </div>
                </div>
            </motion.div>
        </div>
    )
} 