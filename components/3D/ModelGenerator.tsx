'use client'

import { Box } from "lucide-react"
import { WorkspaceChat } from "./WorkspaceChat"
import RippleButton from "@/components/ui/magic/ripple-button"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RemeshButton } from "./RemeshButton"
import { TextureButton } from "./TextureButton"

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

    const handleRemeshClick = () => {
        setIsRemeshOpen(!isRemeshOpen)
        setIsTextureOpen(false)
        setIsNewModelOpen(false)
    }

    const handleTextureClick = () => {
        setIsTextureOpen(!isTextureOpen)
        setIsRemeshOpen(false)
        setIsNewModelOpen(false)
    }

    const handleNewModelClick = () => {
        setIsNewModelOpen(!isNewModelOpen)
        setIsRemeshOpen(false)
        setIsTextureOpen(false)
    }

    return (
        <div className="w-80 flex flex-col">
            <motion.div
                className="flex-1 border border-border bg-card/50 flex flex-col"
                animate={{
                    height: isRemeshOpen || isTextureOpen ? "auto" : "calc(100vh - 14rem)"
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
                                <span className="font-medium">New Model</span>
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
                                    <WorkspaceChat
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

                    <div className="relative">
                        <RemeshButton isOpen={isRemeshOpen} onClick={handleRemeshClick} />
                    </div>

                    <div className="relative">
                        <TextureButton isOpen={isTextureOpen} onClick={handleTextureClick} />
                    </div>
                </div>
            </motion.div>
        </div>
    )
} 