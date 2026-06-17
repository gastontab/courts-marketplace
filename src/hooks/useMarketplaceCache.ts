import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

export type ListingOverride = {
    isListed: boolean
    price: string | null
}

export type ActivityOverrideItem = {
    type: string
    tokenId: string
    nftAddress: string
    price?: string | null
    oldPrice?: string | null
    newPrice?: string | null
    seller?: string
    buyer?: string
    pending: boolean
    timestamp: number
}

type OverridesCache = {
    listings: Record<string, ListingOverride>
    activity: ActivityOverrideItem[]
}

const CACHE_KEY_LOCAL = "grand_slam_marketplace_overrides"

const getLocalOverrides = (): OverridesCache => {
    if (typeof window === "undefined") return { listings: {}, activity: [] }
    const stored = localStorage.getItem(CACHE_KEY_LOCAL)
    if (!stored) return { listings: {}, activity: [] }

    try {
        const parsed = JSON.parse(stored)
        const now = Date.now()
        const cleanActivity = (parsed.activity || []).filter(
            (a: any) => now - (a.timestamp || 0) < 90_000
        )
        return { listings: parsed.listings || {}, activity: cleanActivity }
    } catch {
        return { listings: {}, activity: [] }
    }
}

const setLocalOverrides = (data: OverridesCache) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY_LOCAL, JSON.stringify(data))
    }
}

export function useMarketplaceCache() {
    const queryClient = useQueryClient()
    const queryKey = ["marketplaceOverrides"]

    const { data } = useQuery<OverridesCache>({
        queryKey,
        queryFn: () => getLocalOverrides(),
        staleTime: Infinity,
        gcTime: Infinity,
    })

    const currentOverrides = data || { listings: {}, activity: [] }

    const applyOptimisticUpdate = useCallback(
        (
            nftAddress: string,
            tokenId: string,
            override: ListingOverride,
            activityEntry?: Omit<ActivityOverrideItem, "pending" | "timestamp">
        ) => {
            const key = `${nftAddress.toLowerCase()}-${tokenId}`
            const now = Date.now()

            queryClient.setQueryData<OverridesCache>(queryKey, old => {
                const prev = old || { listings: {}, activity: [] }
                const nextListings = { ...prev.listings, [key]: override }
                let nextActivity = [...prev.activity]

                if (activityEntry) {
                    nextActivity = [
                        { ...activityEntry, pending: true, timestamp: now },
                        ...nextActivity,
                    ]
                }

                const nextState = { listings: nextListings, activity: nextActivity }
                setLocalOverrides(nextState)
                return nextState
            })

            setTimeout(() => {
                queryClient.setQueryData<OverridesCache>(queryKey, old => {
                    if (!old) return { listings: {}, activity: [] }
                    const { [key]: _drop, ...restListings } = old.listings
                    const nextState = { ...old, listings: restListings }
                    setLocalOverrides(nextState)
                    return nextState
                })
            }, 90_000)
        },
        [queryClient]
    )

    const syncWithRealData = useCallback(
        (realInventory: any[], realActivity: any[]) => {
            queryClient.setQueryData<OverridesCache>(queryKey, old => {
                if (
                    !old ||
                    (Object.keys(old.listings).length === 0 && old.activity.length === 0)
                ) {
                    return old || { listings: {}, activity: [] }
                }

                const nextListings = { ...old.listings }
                let changed = false

                for (const [key, override] of Object.entries(old.listings)) {
                    const realItem = realInventory.find(
                        i => `${(i.nftAddress || "").toLowerCase()}-${i.tokenId}` === key
                    )
                    if (realItem) {
                        const realPrice = realItem.price != null ? realItem.price.toString() : null
                        if (
                            realItem.isListed === override.isListed &&
                            realPrice === override.price
                        ) {
                            delete nextListings[key]
                            changed = true
                        }
                    }
                }

                const nextActivity = old.activity.filter(
                    p =>
                        !realActivity.some(
                            a =>
                                a.type === p.type &&
                                String(a.tokenId) === String(p.tokenId) &&
                                String(a.price ?? a.newPrice ?? "") ===
                                    String(p.price ?? p.newPrice ?? "")
                        )
                )

                if (nextActivity.length !== old.activity.length) changed = true

                if (changed) {
                    const nextState = { listings: nextListings, activity: nextActivity }
                    setLocalOverrides(nextState)
                    return nextState
                }

                return old
            })
        },
        [queryClient]
    )

    return {
        overrides: currentOverrides,
        applyOptimisticUpdate,
        syncWithRealData,
    }
}
