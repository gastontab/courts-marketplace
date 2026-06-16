import { useState, useEffect, useMemo, useCallback } from "react"

type CartItem = { tokenId: string; isListed: boolean; price: string | null }
type ActivityItem = {
  type: string
  tokenId: string
  nftAddress?: string
  price?: string | null
  oldPrice?: string | null
  newPrice?: string | null
  seller?: string
  buyer?: string
  block?: number
  index?: number
  pending?: boolean
}
type CartsState = { inventory: CartItem[]; activity: ActivityItem[] }
type ListingOverride = { isListed: boolean; price: string | null }

export function useOptimisticCartState(baseState: CartsState) {
  const [overrides, setOverrides] = useState<Record<string, ListingOverride>>({})
  const [pendingActivity, setPendingActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    setOverrides(prev => {
      if (Object.keys(prev).length === 0) return prev
      const next = { ...prev }
      let changed = false
      for (const [tokenId, override] of Object.entries(prev)) {
        const real = baseState.inventory.find(i => i.tokenId === tokenId)
        const realIsListed = real?.isListed ?? false
        const realPrice = real?.price != null ? real.price.toString() : null
        if (realIsListed === override.isListed && realPrice === override.price) {
          delete next[tokenId]
          changed = true
        }
      }
      return changed ? next : prev
    })

    setPendingActivity(prev =>
      prev.filter(
        p =>
          !baseState.activity.some(
            a =>
              a.type === p.type &&
              a.tokenId === p.tokenId &&
              String(a.price ?? a.newPrice ?? "") === String(p.price ?? p.newPrice ?? "")
          )
      )
    )
  }, [baseState])

  const applyOptimisticUpdate = useCallback(
    (
      tokenId: string,
      override: ListingOverride,
      activityEntry?: Omit<ActivityItem, "block" | "index" | "pending">
    ) => {
      setOverrides(prev => ({ ...prev, [tokenId]: override }))
      if (activityEntry) {
        setPendingActivity(prev => [{ ...activityEntry, pending: true }, ...prev])
      }
      setTimeout(() => {
        setOverrides(prev => {
          const { [tokenId]: _drop, ...rest } = prev
          return rest
        })
      }, 90_000)
    },
    []
  )

  const displayState = useMemo(() => {
    const inventory = baseState.inventory.map(item => {
      const o = overrides[item.tokenId]
      return o ? { ...item, isListed: o.isListed, price: o.price } : item
    })
    return { inventory, activity: [...pendingActivity, ...baseState.activity] }
  }, [baseState, overrides, pendingActivity])

  return { displayState, applyOptimisticUpdate }
}