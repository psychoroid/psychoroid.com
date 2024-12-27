'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CommunityNavbar } from '@/components/design/CommunityNavbar';
import { Footer } from '@/components/design/Footer';
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase/supabase';
import { CommunityProductViewer } from '@/components/community/CommunityProductViewer';
import { CommunityGrid } from '@/components/community/CommunityGrid';
import { Search } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import type { CommunityProduct, ProductLike } from '@/types/community';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { debounce } from 'lodash';
import { CommunityFilters, type SortFilter } from '@/components/community/CommunityFilters';

export default function CommunityPage() {
    const { user } = useUser();
    const { currentLanguage } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<CommunityProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<CommunityProduct | null>(null);
    const [isRotating, setIsRotating] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<SortFilter>('trending');

    const fetchUserLikes = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .rpc('get_user_product_likes', {
                    p_user_id: user.id
                });

            if (error) throw error;
            setUserLikes(new Set(data.map((like: ProductLike) => like.product_id)));
        } catch (error) {
            console.error('Error fetching user likes:', error);
        }
    }, [user?.id]);

    const fetchCommunityProducts = useCallback(async (page = 1, search = '', filter: SortFilter = 'trending') => {
        try {
            setIsLoading(true);
            setError(null);

            let rpcFunction = 'search_community_products';
            let params: any = {
                p_search_query: search,
                p_page_size: 15,
                p_page: page,
                p_sort: filter
            };

            const { data, error } = await supabase.rpc(rpcFunction, params);

            if (error) throw error;

            if (data && Array.isArray(data)) {
                // Filter out products without model_path
                const validProducts = data.filter(product =>
                    product.model_path && product.model_path.trim() !== ''
                );

                // Calculate total pages
                if (validProducts.length > 0) {
                    setTotalPages(Math.ceil(validProducts[0].total_count / 15));
                } else {
                    setTotalPages(1);
                }

                setProducts(validProducts);
            } else {
                setProducts([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(t(currentLanguage, 'ui.community.errors.loadFailed'));
            setProducts([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    }, [currentLanguage]);

    // Debounced search handler
    const debouncedSearch = useMemo(
        () => debounce((query: string) => {
            setCurrentPage(1);
            fetchCommunityProducts(1, query, activeFilter);
        }, 500),
        [fetchCommunityProducts, activeFilter]
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Initial fetch and refetch on page/filter change
    useEffect(() => {
        if (currentPage === 1) {
            // For page 1, use the current search query
            debouncedSearch(searchQuery);
        } else {
            // For other pages, use the immediate fetch
            fetchCommunityProducts(currentPage, searchQuery, activeFilter);
        }

        if (user?.id) {
            fetchUserLikes();
        }
    }, [currentPage, user?.id, fetchUserLikes, fetchCommunityProducts, activeFilter, debouncedSearch, searchQuery]);

    useEffect(() => {
        // Set up auto-refresh interval
        const interval = setInterval(() => {
            fetchCommunityProducts(currentPage, searchQuery);
        }, 5 * 60 * 1000); // Refreshes every 5 minutes

        // Also refresh when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCommunityProducts(currentPage, searchQuery);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchCommunityProducts, currentPage, searchQuery]);

    const handleLike = async (productId: string) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .rpc('toggle_product_like', { p_product_id: productId });

            if (error) throw error;

            // Update local state
            const newLikes = new Set(userLikes);
            if (data) {
                newLikes.add(productId);
            } else {
                newLikes.delete(productId);
            }
            setUserLikes(newLikes);

            // Update products array with new like count
            setProducts(prevProducts =>
                prevProducts.map(p => {
                    if (p.id === productId) {
                        return {
                            ...p,
                            likes_count: p.likes_count + (data ? 1 : -1)
                        };
                    }
                    return p;
                })
            );
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleDownload = async (productId: string) => {
        if (!user) return;
        try {
            // Record the download
            const { error } = await supabase
                .rpc('record_product_download', {
                    p_product_id: productId,
                    p_format: 'glb'
                });

            if (error) throw error;

            // Get the download URL
            const { data: product } = await supabase
                .from('products')
                .select('model_path')
                .eq('id', productId)
                .single();

            if (product?.model_path) {
                // Trigger download
                window.open(product.model_path, '_blank');
            }

            // Refresh products to update counts
            fetchCommunityProducts();
        } catch (error) {
            console.error('Error recording download:', error);
        }
    };

    const handleProductSelect = (product: CommunityProduct) => {
        setSelectedProduct(product);
    };

    const handleFilterChange = (filter: SortFilter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
        fetchCommunityProducts(1, searchQuery, filter);
    };

    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <CommunityNavbar className="sticky top-0 z-50" />
            <main className="flex-grow p-4 md:p-8 pt-24 md:pt-24 overflow-y-auto">
                <div className="container mx-auto">
                    <div className="max-w-3xl mx-auto mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
                            {/* Left side - Title */}
                            <div className="md:col-span-4">
                                <div className="flex flex-col space-y-1 md:pl-4">
                                    <h1 className="text-xl font-semibold text-foreground">
                                        {t(currentLanguage, 'community.title')}
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        {t(currentLanguage, 'community.subtitle')}
                                    </p>
                                </div>
                            </div>

                            {/* Right side - Search */}
                            <div className="md:col-span-8">
                                <div className="relative md:pt-2 mt-2">
                                    <Search className="absolute left-3 top-[23%] md:top-[30%] transform -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="text"
                                        placeholder={t(currentLanguage, 'community.search.placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const query = e.target.value;
                                            setSearchQuery(query);
                                            debouncedSearch(query);
                                        }}
                                        className="w-full pl-9 h-9 text-xs rounded-none"
                                    />
                                    <div className="mt-2">
                                        <CommunityFilters
                                            activeFilter={activeFilter}
                                            onFilterChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid Section */}
                    <div className="flex-grow pb-8">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="bg-muted aspect-[4/3] mb-4" />
                                        <div className="h-4 bg-muted w-3/4 mb-2" />
                                        <div className="h-3 bg-muted w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-sm text-red-500 text-center py-8">
                                {error}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                {searchQuery ? t(currentLanguage, 'ui.community.noSearchResults') : t(currentLanguage, 'ui.community.noResults')}
                            </div>
                        ) : (
                            <>
                                <CommunityGrid
                                    products={products}
                                    onProductSelect={handleProductSelect}
                                    selectedProduct={selectedProduct}
                                    onLike={handleLike}
                                    onDownload={handleDownload}
                                    userLikes={userLikes}
                                />

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-8">
                                        <div className="text-sm text-muted-foreground">
                                            15 {t(currentLanguage, 'ui.community.perPage')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                                disabled={currentPage === 1}
                                                className="rounded-none"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm">
                                                {t(currentLanguage, 'ui.community.page')} {currentPage} {t(currentLanguage, 'ui.community.of')} {totalPages}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                disabled={currentPage === totalPages}
                                                className="rounded-none"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Product Viewer */}
                    {selectedProduct && (
                        <CommunityProductViewer
                            imagePath={selectedProduct.image_path}
                            modelUrl={selectedProduct.model_path}
                            isRotating={isRotating}
                            zoom={zoom}
                            isExpanded={true}
                            onClose={() => setSelectedProduct(null)}
                        />
                    )}
                </div>
            </main>
            <Footer className="sticky bottom-0" />
        </div>
    );
} 