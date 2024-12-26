'use client'

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Folder, Grid, Menu, Box, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssetCard } from "./AssetCard"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/actions/utils"
import { supabase } from '@/lib/supabase/supabase'
import { useUser } from '@/lib/contexts/UserContext'
import type { Asset } from '@/types/product'

type ViewType = 'list' | 'models' | 'textured';
type LayoutType = 'grid' | 'stack';

interface AssetLibraryProps {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onImageClick: (imagePath: string | null, modelUrl: string | null) => void;
}

export function AssetLibrary({ searchQuery, onSearchChange, onImageClick }: AssetLibraryProps) {
    const { user } = useUser()
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedView, setSelectedView] = useState<ViewType>('list')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [assets, setAssets] = useState<Asset[]>([])
    const [layout, setLayout] = useState<LayoutType>('stack')

    // Fetch products from Supabase
    const fetchAssets = useCallback(async (page = 1, search = '') => {
        if (!user?.id) return;

        try {
            setIsLoading(true);

            const { data, error } = await supabase.rpc('search_user_products', {
                p_user_id: user.id,
                p_search_query: search || '',
                p_page_size: 15,
                p_page: page
            });

            if (error) {
                console.error('Error fetching products:', error);
                return;
            }

            // Transform the data and filter out default assets
            const transformedData = (data || [])
                .filter((item: { model_path: string }) => !item.model_path.startsWith('default-assets/'))
                .map((item: any) => ({
                    ...item,
                    created_at: new Date(item.created_at).toISOString(),
                    updated_at: new Date(item.updated_at).toISOString()
                }));

            setAssets(transformedData);
        } catch (error) {
            console.error('Error in fetchAssets:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAssets(currentPage, searchQuery);
    }, [fetchAssets, currentPage, searchQuery]);

    const handleImageClick = (imagePath: string | null, modelUrl: string | null) => {
        if (modelUrl) {
            const fullModelUrl = modelUrl.startsWith('http')
                ? modelUrl
                : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-models/${modelUrl}`;
            onImageClick(imagePath, fullModelUrl);
        } else {
            onImageClick(imagePath, null);
        }
    };

    const viewButtons = [
        {
            type: 'models' as ViewType,
            icon: Box,
            description: 'Models',
            iconClass: "text-purple-500"
        }
    ]

    const handleViewChange = (view: ViewType) => {
        // Clear states when changing views
        setSelectedImage(null);
        setIsLoading(true);
        setSelectedView(view);
        fetchAssets(currentPage, searchQuery);
    };

    // Cleanup effect for view changes
    useEffect(() => {
        return () => {
            setSelectedImage(null);
            setIsLoading(false);
        };
    }, [selectedView]);

    const handleSearch = useCallback((query: string) => {
        onSearchChange?.(query);
    }, [onSearchChange]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 border border-border bg-card/50 flex flex-col h-full">
                <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-9 h-9 text-xs rounded-none bg-background/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLayout(l => l === 'grid' ? 'stack' : 'grid')}
                            className={cn(
                                "h-9 w-9 rounded-none",
                                layout === 'stack' && "bg-accent"
                            )}
                        >
                            <Menu className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex border-b border-border">
                    <div className="flex items-center w-full">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-full h-10 rounded-none sm:h-10 relative group"
                        >
                            <Box className="w-5 h-5 sm:w-5 sm:h-5 text-purple-500" />
                            <span className="sr-only">Models</span>
                            <div className={cn(
                                "absolute -top-8 left-1/2 transform -translate-x-1/2",
                                "px-2 py-1 text-xs",
                                "bg-background/80 backdrop-blur-[2px]",
                                "text-muted-foreground/80",
                                "rounded-sm border border-border/50",
                                "opacity-0 group-hover:opacity-100",
                                "transition-opacity duration-200 delay-[750ms]",
                                "pointer-events-none whitespace-nowrap",
                                "shadow-sm"
                            )}>
                                Models
                            </div>
                        </Button>
                    </div>
                </div>
                <div className="flex-1 p-2 overflow-auto scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${layout}-${selectedView}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className={cn(
                                layout === 'grid'
                                    ? "grid grid-cols-2 gap-4"
                                    : "flex flex-col space-y-2"
                            )}>
                                {assets.map((asset, index) => (
                                    <AssetCard
                                        key={`${selectedView}-${asset.id}`}
                                        id={asset.id}
                                        title={asset.name}
                                        description={asset.description}
                                        modelPath={asset.model_path}
                                        imagePath={asset.image_path}
                                        onClick={handleImageClick}
                                        index={index}
                                        layout={layout}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
} 