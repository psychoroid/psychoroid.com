'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase/supabase';
import { ProductViewer } from '@/components/3D/ProductViewer';
import { ProductControls } from '@/components/3D/ProductControls';
import { CommunityGrid } from '@/components/community/CommunityGrid';
import { Search } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import type { CommunityProduct, CommunityGridProps, ProductLike } from '@/types/community';

export default function CommunityPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<CommunityProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<CommunityProduct | null>(null);
    const [isRotating, setIsRotating] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchCommunityProducts();
        if (user?.id) {
            fetchUserLikes();
        }
    }, [searchQuery, user?.id]);

    const fetchCommunityProducts = async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_trending_products', { p_limit: 50, p_offset: 0 });

            if (error) throw error;
            setProducts(data as CommunityProduct[]);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchUserLikes = async () => {
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
    };

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

            // Refresh products to update counts
            fetchCommunityProducts();
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleDownload = async (productId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .rpc('record_product_download', { p_product_id: productId });

            if (error) throw error;

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
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto md:h-[calc(100vh-8rem)] md:overflow-hidden scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-[4.5rem] md:mt-16 md:h-full">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">Community Models</h1>
                                <p className="text-xs text-muted-foreground">
                                    Discover public assets created in realtime by the community
                                </p>
                            </div>
                        </div>

                        {/* Right side - Search */}
                        <div className="col-span-8">
                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

                    {/* Content Section */}
                    <div className="mt-6 md:mt-8">
                        <CommunityGrid
                            products={products}
                            onProductSelect={handleProductSelect}
                            selectedProduct={selectedProduct}
                            onLike={handleLike}
                            onDownload={handleDownload}
                            userLikes={userLikes}
                        />
                    </div>
                </div>
            </div>

            {/* Modal for 3D Preview - Mobile friendly */}
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

            <Footer />
        </div>
    );
} 