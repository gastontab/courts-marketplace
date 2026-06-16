import { useState, useEffect, useMemo, useCallback } from "react"
import { NFTBoxAction } from "@/components/NFTBox"

type Listing = {
    tokenId: string
    nftAddress: string
    price: string
    [key: string]: any
}

type Override = { type: "REMOVED" } | { type: "PRICE_UPDATED"; price: string }

export function useOptimisticListings(baseListings: Listing[]) {
    const [overrides, setOverrides] = useState<Record<string, Override>>({})

    useEffect(() => {
        setOverrides(prev => {
            if (Object.keys(prev).length === 0) return prev
            const next = { ...prev }
            let changed = false

            for (const [key, override] of Object.entries(prev)) {
                if (override.type === "REMOVED") {
                    const stillPresent = baseListings.some(
                        l => `${l.nftAddress.toLowerCase()}-${l.tokenId}` === key
                    )
                    if (!stillPresent) {
                        delete next[key]
                        changed = true
                    }
                }
                if (override.type === "PRICE_UPDATED") {
                    const listing = baseListings.find(
                        l => `${l.nftAddress.toLowerCase()}-${l.tokenId}` === key
                    )
                    if (listing && listing.price === override.price) {
                        delete next[key]
                        changed = true
                    }
                }
            }

            return changed ? next : prev
        })
    }, [baseListings])

    const applyOptimisticUpdate = useCallback(
        (nftAddress: string, tokenId: string, action: NFTBoxAction) => {
            const key = `${nftAddress.toLowerCase()}-${tokenId}`

            setOverrides(prev => ({
                ...prev,
                [key]:
                    action.type === "CANCELED"
                        ? { type: "REMOVED" }
                        : { type: "PRICE_UPDATED", price: action.newPrice },
            }))

            setTimeout(() => {
                setOverrides(prev => {
                    const { [key]: _drop, ...rest } = prev
                    return rest
                })
            }, 90_000)
        },
        []
    )

    const displayListings = useMemo(() => {
        if (Object.keys(overrides).length === 0) return baseListings

        return baseListings
            .filter(l => {
                const key = `${l.nftAddress.toLowerCase()}-${l.tokenId}`
                return overrides[key]?.type !== "REMOVED"
            })
            .map(l => {
                const key = `${l.nftAddress.toLowerCase()}-${l.tokenId}`
                const override = overrides[key]
                if (override?.type === "PRICE_UPDATED") {
                    return { ...l, price: override.price }
                }
                return l
            })
    }, [baseListings, overrides])

    return { displayListings, applyOptimisticUpdate }
}
