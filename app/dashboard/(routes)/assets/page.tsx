'use client'

import { useState, useEffect, useCallback } from 'react';
import { UserAssetsList } from '@/components/dashboard/UserAssetsList';
import { supabase } from '@/lib/supabase/supabase';
import { useUser } from '@/lib/contexts/UserContext';
import type { Asset } from '@/types/product';

export default function AssetsPage() {
    const { user } = useUser();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAssets = useCallback(async (page = 1, search = '') => {
        if (!user?.id) return;

        try {
            const from = (page - 1) * 15;
            const to = from + 14;

            // Parallel requests for better performance
            const [assetsResponse, countResponse] = await Promise.all([
                supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', user.id)
                    .not('model_path', 'is', null)
                    .not('model_path', 'eq', '')
                    .ilike('name', `%${search}%`)
                    .order('created_at', { ascending: false })
                    .range(from, to),

                supabase
                    .from('products')
                    .select('id', { count: 'exact' })
                    .eq('user_id', user.id)
                    .not('model_path', 'is', null)
                    .not('model_path', 'eq', '')
                    .ilike('name', `%${search}%`)
            ]);

            if (assetsResponse.error) throw assetsResponse.error;
            if (countResponse.error) throw countResponse.error;

            setAssets(assetsResponse.data || []);
            setTotalPages(Math.ceil((countResponse.count || 0) / 15));
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchAssets(currentPage);
    }, [fetchAssets, currentPage]);

    const handleSearch = useCallback((query: string) => {
        setCurrentPage(1);
        fetchAssets(1, query);
    }, [fetchAssets]);

    return (
        <UserAssetsList
            assets={assets}
            isLoading={isLoading}
            onSearch={handleSearch}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onAssetUpdate={() => fetchAssets(currentPage)}
        />
    );
} 