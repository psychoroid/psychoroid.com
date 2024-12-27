'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { AssetCard } from "./LibraryAssetCard"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from '@/lib/supabase/supabase'
import { useUser } from '@/lib/contexts/UserContext'
import type { Asset } from '@/types/product'
import debounce from 'lodash/debounce'
import Loader from '@/components/design/loader'

interface AssetLibraryProps {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onImageClick: (imagePath: string | null, modelUrl: string | null) => void;
}

export function AssetLibrary({ searchQuery: externalSearchQuery, onSearchChange, onImageClick }: AssetLibraryProps) {
    const { user } = useUser()
    const [currentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [assets, setAssets] = useState<Asset[]>([])
    const [internalSearchQuery, setInternalSearchQuery] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Use external search query if provided, otherwise use internal
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

    // Memoize fetch function
    const fetchAssets = useCallback(async (search = '') => {
        if (!user?.id) return;

        try {
            setIsLoading(true);
            setError(null);

            const { data, error } = await supabase.rpc('search_user_products', {
                p_user_id: user.id,
                p_search_query: search || '',
                p_page_size: 15,
                p_page: 1
            });

            if (error) throw error;

            if (!data || !Array.isArray(data)) {
                setAssets([]);
                return;
            }

            // Transform and filter data
            const transformedData = data
                .filter(item => !item.model_path?.includes('default-assets/'))
                .map((item: any) => ({
                    ...item,
                    created_at: new Date(item.created_at).toISOString(),
                    updated_at: new Date(item.updated_at).toISOString()
                }));

            setAssets(transformedData);
        } catch (error) {
            console.error('Error in fetchAssets:', error);
            setError('Failed to load assets');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // Memoize debounced search function
    const debouncedSearch = useMemo(() =>
        debounce((query: string) => {
            fetchAssets(query);
        }, 300)
        , [fetchAssets]);

    // Effect for search query changes
    useEffect(() => {
        debouncedSearch(searchQuery);
        return () => debouncedSearch.cancel();
    }, [searchQuery, debouncedSearch]);

    // Initial fetch
    useEffect(() => {
        fetchAssets(searchQuery);
        return () => setAssets([]); // Cleanup
    }, [fetchAssets, searchQuery]);

    const handleSearch = useCallback((query: string) => {
        if (onSearchChange) {
            onSearchChange(query);
        } else {
            setInternalSearchQuery(query);
        }
    }, [onSearchChange]);

    const handleImageClick = useCallback((imagePath: string | null, modelUrl: string | null) => {
        if (modelUrl) {
            // Ensure we have the full URL and proper path formatting
            const fullModelUrl = modelUrl.startsWith('http')
                ? modelUrl
                : modelUrl.includes('product-models/')
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-models/${modelUrl.replace('product-models/', '')}`
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-models/${modelUrl}`;

            const fullImagePath = imagePath?.startsWith('http')
                ? imagePath
                : imagePath
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`
                    : null;

            // Pre-load the model before triggering the click
            const preloadModel = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('HEAD', fullModelUrl, true);
                xhr.onload = () => resolve(true);
                xhr.onerror = () => reject(new Error('Failed to preload model'));
                xhr.send();
            });

            // Show loading state
            setIsLoading(true);

            // Wait for preload and then trigger click
            preloadModel
                .then(() => {
                    onImageClick(fullImagePath, fullModelUrl);
                })
                .catch(error => {
                    console.error('Error preloading model:', error);
                    // Still try to load even if preload fails
                    onImageClick(fullImagePath, fullModelUrl);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            onImageClick(imagePath, null);
        }
    }, [onImageClick]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 border border-border bg-card/50 flex flex-col h-full">
                <div className="p-2 border-b border-border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-9 h-9 text-xs rounded-none bg-background/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>

                <div className="flex-1 p-2 overflow-auto scrollbar-hide">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader />
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                {error}
                            </div>
                        ) : assets.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                {searchQuery ? 'No assets found matching your search' : 'No assets found'}
                            </div>
                        ) : (
                            <motion.div
                                key={`assets-${searchQuery}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex flex-col space-y-2">
                                    {assets.map((asset, index) => (
                                        <AssetCard
                                            key={asset.id}
                                            id={asset.id}
                                            title={asset.name}
                                            description={asset.description}
                                            modelPath={asset.model_path}
                                            imagePath={asset.image_path}
                                            onClick={handleImageClick}
                                            index={index}
                                            layout="stack"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
} 