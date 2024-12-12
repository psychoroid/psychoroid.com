'use client'

import { useUser } from '@/lib/contexts/UserContext'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { UserAssetsList } from '@/components/dashboard/UserAssetsList'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import debounce from 'lodash/debounce'

const ITEMS_PER_PAGE = 10
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache object to store previous results
const assetsCache = new Map()

export default function AssetsPage() {
    const { user } = useUser()
    const [assets, setAssets] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Create a cache key based on current filters
    const getCacheKey = useCallback((userId: string, search: string, page: number) => {
        return `${userId}-${search}-${page}`
    }, [])

    const fetchUserAssets = useCallback(async () => {
        if (!user?.id) return;

        const cacheKey = getCacheKey(user.id, searchQuery, currentPage)

        if (assetsCache.has(cacheKey)) {
            const cachedData = assetsCache.get(cacheKey)
            setAssets(cachedData.assets)
            setTotalCount(cachedData.totalCount)
            setIsLoading(false)
            return
        }

        try {
            const [countResult, assetsResult] = await Promise.all([
                supabase
                    .from('products')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .ilike('name', `%${searchQuery}%`),

                supabase.rpc('get_user_assets', {
                    p_user_id: user.id,
                    p_search: searchQuery,
                    p_limit: ITEMS_PER_PAGE,
                    p_offset: (currentPage - 1) * ITEMS_PER_PAGE
                })
            ])

            if (countResult.error) throw countResult.error
            if (assetsResult.error) throw assetsResult.error

            const count = countResult.count || 0
            const data = assetsResult.data || []

            assetsCache.set(cacheKey, {
                assets: data,
                totalCount: count,
                timestamp: Date.now()
            })

            setAssets(data)
            setTotalCount(count)
        } catch (error: any) {
            console.error('Error fetching assets:', error)
            setError(error.message)
            toast.error('Failed to load assets')
        } finally {
            setIsLoading(false)
        }
    }, [user?.id, searchQuery, currentPage, getCacheKey])

    const clearCache = useCallback(() => {
        const now = Date.now();
        for (const [key, value] of assetsCache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
                assetsCache.delete(key);
            }
        }
    }, []);

    // Update the useEffect for cache clearing
    useEffect(() => {
        clearCache();
        const interval = setInterval(clearCache, 60 * 1000); // Clear every minute
        return () => clearInterval(interval);
    }, [clearCache]);

    useEffect(() => {
        if (user?.id) {
            setIsLoading(true) // Set loading before fetch
            fetchUserAssets()
        }
    }, [fetchUserAssets, user?.id])

    const handlePageChange = (page: number) => {
        setIsLoading(true) // Show loading state immediately
        setCurrentPage(page)
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const handleAssetUpdate = useCallback(() => {
        // Clear the cache for the current page
        const cacheKey = getCacheKey(user?.id || '', searchQuery, currentPage);
        assetsCache.delete(cacheKey);

        // Refetch the assets
        setIsLoading(true);
        fetchUserAssets();
    }, [user?.id, searchQuery, currentPage, getCacheKey, fetchUserAssets]);

    return (
        <div>
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-xl font-semibold text-foreground">Your assets</h1>
                <p className="text-xs text-muted-foreground">
                    Manage your 3D generated assets
                </p>
            </div>

            <UserAssetsList
                assets={assets}
                onSearch={setSearchQuery}
                onPageChange={handlePageChange}
                currentPage={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
                onAssetUpdate={handleAssetUpdate}
            />
        </div>
    )
} 