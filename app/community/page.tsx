'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/design/Navbar';
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

    const fetchCommunityProducts = useCallback(async () => {
        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .rpc('get_trending_products', {
                    p_limit: 50,
                    p_offset: 0
                });

            if (error) throw error;

            if (data && Array.isArray(data)) {
                // Store with timestamp for cache validation
                localStorage.setItem('community_products', JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));

                setProducts(data.map(product => ({
                    ...product,
                    views_count: product.views_count || 0  // Ensure views_count is initialized
                })));
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCommunityProducts();
        if (user?.id) {
            fetchUserLikes();
        }
    }, [searchQuery, user?.id, fetchUserLikes, fetchCommunityProducts]);

    useEffect(() => {
        // Set up auto-refresh interval
        const interval = setInterval(() => {
            fetchCommunityProducts();
        }, 5 * 60 * 1000); // Refreshes every 5 minutes

        // Also refresh when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCommunityProducts();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchCommunityProducts]);

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

    return (
        <div className="h-svh flex flex-col bg-background">
            <Navbar />
            <main className="flex-grow p-4 md:p-8 pt-24 md:pt-24 overflow-auto">
                <div className="px-0 md:px-4">
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
                                <div className="relative md:pr-4 md:pt-2 mt-2">
                                    <Search className="absolute left-3 top-1/2 md:top-[60%] transform -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="text"
                                        placeholder={t(currentLanguage, 'community.search.placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 h-9 text-xs rounded-none"
                                    />
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
                        ) : (
                            <CommunityGrid
                                products={products}
                                onProductSelect={handleProductSelect}
                                selectedProduct={selectedProduct}
                                onLike={handleLike}
                                onDownload={handleDownload}
                                userLikes={userLikes}
                            />
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
            <Footer />
        </div>
    );
} 