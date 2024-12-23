'use client'

import { Input } from "@/components/ui/input"
import { Folder, Grid, Menu, Box, Search, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ImagePreview } from "./ImagePreview"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/actions/utils"

type ViewType = 'folder' | 'grid' | 'list' | 'box' | 'image';

interface AssetLibraryProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    assetGroups: {
        id: string
        title: string
        assets: string[]
    }[]
}

export function AssetLibrary({ searchQuery, onSearchChange, assetGroups }: AssetLibraryProps) {
    const [showLibrary, setShowLibrary] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedView, setSelectedView] = useState<ViewType>('grid')

    const viewButtons = [
        { type: 'folder' as ViewType, icon: Folder },
        { type: 'grid' as ViewType, icon: Grid },
        { type: 'list' as ViewType, icon: Menu },
        { type: 'box' as ViewType, icon: Box },
        { type: 'image' as ViewType, icon: ImageIcon },
    ]

    const handleViewChange = (view: ViewType) => {
        if (view === 'image') {
            setShowLibrary(!showLibrary)
        } else {
            setShowLibrary(false)
        }
        setSelectedView(view)
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 border border-border bg-card/50 flex flex-col h-full">
                <div className="p-2 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 h-9 text-xs rounded-none bg-background/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>
                <div className="flex border-b border-border justify-center px-2">
                    <div className="flex items-center">
                        {viewButtons.map(({ type, icon: Icon }) => (
                            <Button
                                key={type}
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "w-10 h-10 rounded-none",
                                    selectedView === type && "bg-accent"
                                )}
                                onClick={() => handleViewChange(type)}
                            >
                                <Icon className="w-4 h-4" />
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-2 overflow-auto">
                    <AnimatePresence mode="wait">
                        {showLibrary ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ImagePreview
                                    imagePaths={[]}
                                    selectedImage={null}
                                    onImageClick={() => { }}
                                    onImageRemove={() => { }}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                    isLoading={false}
                                    processingImages={{}}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {assetGroups.map((group) => (
                                    <div key={group.id} className="space-y-1 mb-2">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-medium">{group.title}</h3>
                                            <span className="text-xs text-muted-foreground">
                                                All {group.assets.length} assets
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                            {group.assets.slice(0, 4).map((asset, index) => (
                                                <div
                                                    key={index}
                                                    className="aspect-square bg-background/50 border border-border"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
} 