'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase/supabase';
import { ProductViewer } from '@/components/3D/ProductViewer';
import { ProductControls } from '@/components/3D/ProductControls';
import { CommunityGrid } from '@/components/community/CommunityGrid';
import { Search } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import type { CommunityProduct, ProductLike } from '@/types/community';

export default function CommunityPage() {
    const { user } = useUser();
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
            const cached = localStorage.getItem('community_products');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < 5 * 60 * 1000) {
                    setProducts(data);
                    setIsLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase
                .rpc('get_trending_products', { p_limit: 50, p_offset: 0 });

            if (error) throw error;

            localStorage.setItem('community_products', JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            setProducts(data as CommunityProduct[]);
        } catch (error) {
            console.error('Error fetching products:', error);
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
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCommunityProducts();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchCommunityProducts]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchCommunityProducts();
            }
        }, 10000); // Refresh every 10 seconds when visible

        return () => clearInterval(interval);
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
                .rpc('record_product_download', { p_product_id: productId });

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
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-grow p-4 md:p-8 pt-24 md:pt-24">
                <div className="px-0 md:px-4">
                    <div className="max-w-3xl mx-auto mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
                            {/* Left side - Title */}
                            <div className="md:col-span-4">
                                <div className="flex flex-col space-y-1 md:pl-4">
                                    <h1 className="text-xl font-semibold text-foreground">Discover models</h1>
                                    <p className="text-xs text-muted-foreground">
                                        Explore public assets created by our community
                                    </p>
                                </div>
                            </div>

                            {/* Right side - Search */}
                            <div className="md:col-span-8">
                                <div className="relative md:pr-4 md:pt-2 mt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-[25%] h-[14px] w-[14px] text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="text"
                                        placeholder="Search models, creators, or tags..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 h-9 text-xs rounded-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid Section - Now can extend full width */}
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

                    {/* Preview Modal remains the same */}
                    {selectedProduct && (
                        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                            <div className="fixed inset-2 md:inset-4 bg-background border rounded-lg shadow-lg p-4 md:p-6">
                                <div className="h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-sm font-medium text-foreground">{selectedProduct.name}</h2>
                                        <button
                                            onClick={() => setSelectedProduct(null)}
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="flex-grow relative">
                                        <ProductViewer
                                            imagePath={selectedProduct.image_path}
                                            modelUrl={selectedProduct.model_path}
                                            isRotating={isRotating}
                                            zoom={zoom}
                                            isExpanded={isExpanded}
                                            onClose={() => setIsExpanded(false)}
                                        />
                                        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2">
                                            <ProductControls
                                                isRotating={isRotating}
                                                onRotateToggle={() => setIsRotating(!isRotating)}
                                                onZoomIn={() => setZoom(z => z + 0.1)}
                                                onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.1))}
                                                onExpand={() => setIsExpanded(true)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
} 