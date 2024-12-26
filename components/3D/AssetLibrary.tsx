'use client'

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { AssetCard } from "./AssetCard"
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
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [assets, setAssets] = useState<Asset[]>([])
    const [internalSearchQuery, setInternalSearchQuery] = useState('')
    const [totalPages, setTotalPages] = useState(1)
    const [error, setError] = useState<string | null>(null)

    // Use external search query if provided, otherwise use internal
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

    // Fetch products from Supabase with debounced search
    const fetchAssets = useCallback(async (page = 1, search = '') => {
        if (!user?.id) return;

        try {
            setIsLoading(true);
            setError(null);

            const { data, error } = await supabase.rpc('search_user_products', {
                p_user_id: user.id,
                p_search_query: search || '',
                p_page_size: 15,
                p_page: page
            });

            if (error) {
                console.error('Error fetching products:', error);
                setError('Failed to load assets');
                return;
            }

            if (!data || !Array.isArray(data)) {
                setAssets([]);
                setTotalPages(1);
                return;
            }

            // Calculate total pages
            if (data.length > 0) {
                const totalCount = data[0].total_count;
                setTotalPages(Math.ceil(totalCount / 15));
            }

            // Transform the data and filter out default-assets
            const transformedData = data
                .filter(item => !item.model_path?.startsWith('default-assets/'))
                .map((item: any) => ({
                    ...item,
                    created_at: new Date(item.created_at).toISOString(),
                    updated_at: new Date(item.updated_at).toISOString()
                }));

            setAssets(transformedData);
        } catch (error) {
            console.error('Error in fetchAssets:', error);
            setError('An error occurred while loading assets');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // Create debounced search function inline
    const debouncedSearch = useCallback((query: string) => {
        const debouncedFn = debounce((searchQuery: string) => {
            setCurrentPage(1);
            fetchAssets(1, searchQuery);
        }, 300);
        debouncedFn(query);
        return () => debouncedFn.cancel();
    }, [fetchAssets]);

    // Effect for search query changes
    useEffect(() => {
        const cleanup = debouncedSearch(searchQuery);
        return cleanup;
    }, [searchQuery, debouncedSearch]);

    // Initial fetch and refetch on page change
    useEffect(() => {
        fetchAssets(currentPage, searchQuery);
    }, [currentPage, fetchAssets, searchQuery]);

    const handleSearch = (query: string) => {
        if (onSearchChange) {
            onSearchChange(query);
        } else {
            setInternalSearchQuery(query);
        }
    };

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