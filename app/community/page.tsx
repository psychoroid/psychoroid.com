'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase/supabase';
import { ProductViewer } from '@/components/3D/ProductViewer';
import { ProductControls } from '@/components/3D/ProductControls';

type CommunityProduct = {
    id: string;
    name: string;
    description: string;
    image_path: string;
    model_path: string;
    created_at: string;
    user_id: string;
};

export default function CommunityPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<CommunityProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<CommunityProduct | null>(null);
    const [isRotating, setIsRotating] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchCommunityProducts();
    }, [searchQuery]);

    const fetchCommunityProducts = async () => {
        try {
            let query = supabase
                .from('products')
                .select('*')
                .eq('is_visible', true)
                .order('created_at', { ascending: false });

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setProducts(data as CommunityProduct[]);
            if (!selectedProduct && data && data.length > 0) {
                setSelectedProduct(data[0] as CommunityProduct);
            }
        } catch (error) {
            console.error('Error fetching community products:', error);
        }
    };

    const handleProductSelect = (product: CommunityProduct) => {
        setSelectedProduct(product);
    };

    const handleReset = () => {
        setIsRotating(true);
        setZoom(1);
    };

    const handleZoomIn = () => {
        setZoom(prevZoom => prevZoom + 0.1);
    };

    const handleZoomOut = () => {
        setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.1));
    };

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const handleClose = () => {
        setIsExpanded(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-grow p-8 pt-24">
                <div className="max-w-7xl mx-auto">
                    {/* Search Section */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-foreground mb-4">Community Creations</h1>
                        <Input
                            type="text"
                            placeholder="Search community models..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Product List */}
                        <div className="lg:col-span-1 space-y-4">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductSelect(product)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedProduct?.id === product.id
                                            ? 'border-primary bg-accent'
                                            : 'border-border hover:border-primary'
                                        }`}
                                >
                                    <img
                                        src={product.image_path}
                                        alt={product.name}
                                        className="w-full h-48 object-cover rounded-md mb-2"
                                    />
                                    <h3 className="font-medium text-foreground">{product.name}</h3>
                                    <p className="text-sm text-muted-foreground">{product.description}</p>
                                </div>
                            ))}
                        </div>

                        {/* 3D Viewer */}
                        {selectedProduct && (
                            <div className="lg:col-span-2 rounded-lg p-6 border border-border">
                                <h2 className="text-xl font-semibold text-foreground mb-4">3D Preview</h2>
                                <div className="relative h-[600px] flex gap-4">
                                    <div className="flex-grow">
                                        <ProductViewer
                                            imagePath={selectedProduct.image_path}
                                            modelUrl={selectedProduct.model_path}
                                            isRotating={isRotating}
                                            zoom={zoom}
                                            isExpanded={isExpanded}
                                            onClose={handleClose}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center space-y-2">
                                        <ProductControls
                                            isRotating={isRotating}
                                            onRotateToggle={() => setIsRotating(!isRotating)}
                                            onZoomIn={handleZoomIn}
                                            onZoomOut={handleZoomOut}
                                            onExpand={handleExpand}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
} 