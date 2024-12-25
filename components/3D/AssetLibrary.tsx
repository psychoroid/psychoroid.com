'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Folder, Grid, Menu, Box, Search, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImagePreview } from "./ImagePreview"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/actions/utils"
import { supabase } from '@/lib/supabase/supabase'

type ViewType = 'list' | 'models' | 'textured' | 'images';

interface AssetLibraryProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    assetGroups: {
        id: string
        title: string
        assets: string[]
    }[]
    onImageClick: (imagePath: string, modelUrl: string) => void
}

export function AssetLibrary({ searchQuery, onSearchChange, assetGroups, onImageClick }: AssetLibraryProps) {
    const [showLibrary, setShowLibrary] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedView, setSelectedView] = useState<ViewType>('list')
    const [imagePaths, setImagePaths] = useState<string[]>([])
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch products from Supabase
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data: products, error } = await supabase
                    .from('products')
                    .select('image_path')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching products:', error);
                    return;
                }

                const paths = products
                    .filter(product => product.image_path)
                    .map(product => product.image_path);

                setImagePaths(paths);
            } catch (error) {
                console.error('Error in fetchProducts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleImageClick = async (imagePath: string, modelUrl: string) => {
        setSelectedImage(imagePath);
        // Construct the full Supabase URL for the model
        const fullModelUrl = modelUrl.startsWith('http')
            ? modelUrl
            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-models/${modelUrl}`;

        // Update the URL parameters
        const params = new URLSearchParams(window.location.search);
        params.set('image', imagePath);
        params.set('model', fullModelUrl);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);

        // Pass both the image path and the full model URL
        onImageClick(imagePath, fullModelUrl);
    };

    const handleImageRemove = (imagePath: string) => {
        setImagePaths(prev => prev.filter(path => path !== imagePath));
        if (selectedImage === imagePath) {
            setSelectedImage(null);
        }
    };

    const viewButtons = [
        {
            type: 'list' as ViewType,
            icon: Menu,
            description: 'All',
            iconClass: "text-[#D73D57]"
        },
        {
            type: 'models' as ViewType,
            icon: Box,
            description: 'Models',
            iconClass: "text-purple-500"
        },
        {
            type: 'textured' as ViewType,
            icon: Grid,
            description: 'Textured',
            iconClass: "text-cyan-500"
        },
        {
            type: 'images' as ViewType,
            icon: ImageIcon,
            description: 'Images',
            iconClass: "text-emerald-500 dark:text-emerald-400"
        },
    ]

    const handleViewChange = (view: ViewType) => {
        if (view === 'images') {
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
                <div className="flex border-b border-border">
                    <div className="flex items-center w-full">
                        {viewButtons.map(({ type, icon: Icon, description, iconClass }) => (
                            <Button
                                key={type}
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "w-full h-10 rounded-none sm:h-10 relative group",
                                    selectedView === type && "bg-accent",
                                    type === 'images' && cn(
                                        "border-emerald-500 text-emerald-500",
                                        "hover:text-emerald-500/90 hover:border-emerald-500/90",
                                        "dark:border-emerald-400 dark:text-emerald-400",
                                        "dark:hover:text-emerald-400/90 dark:hover:border-emerald-400/90",
                                        "transition-colors"
                                    )
                                )}
                                onClick={() => handleViewChange(type)}
                            >
                                <Icon className={cn(
                                    "w-5 h-5 sm:w-5 sm:h-5",
                                    iconClass,
                                    type === 'images' && "text-emerald-500 dark:text-emerald-400"
                                )} />
                                <span className="sr-only">{description}</span>
                                <div
                                    className={cn(
                                        "absolute -top-8 left-1/2 transform -translate-x-1/2",
                                        "px-2 py-1 text-xs",
                                        "bg-background/80 backdrop-blur-[2px]",
                                        "text-muted-foreground/80",
                                        "rounded-sm border border-border/50",
                                        "opacity-0 group-hover:opacity-100",
                                        "transition-opacity duration-200 delay-[750ms]",
                                        "pointer-events-none whitespace-nowrap",
                                        "shadow-sm",
                                        type === 'images' && "border-emerald-500/20 dark:border-emerald-400/20"
                                    )}
                                >
                                    {description}
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-2 overflow-auto scrollbar-hide">
                    <AnimatePresence mode="wait">
                        {showLibrary ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex justify-center w-full"
                            >
                                <div className="w-[260px] min-h-[580px]">
                                    <ImagePreview
                                        imagePaths={imagePaths}
                                        selectedImage={selectedImage}
                                        onImageClick={handleImageClick}
                                        onImageRemove={handleImageRemove}
                                        currentPage={currentPage}
                                        onPageChange={setCurrentPage}
                                        isLoading={isLoading}
                                        processingImages={{}}
                                    />
                                </div>
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