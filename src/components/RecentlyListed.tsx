"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useChainId } from "wagmi"
import NFTBox from "./NFTBox"
import Link from "next/link"
import { CgSpinner } from "react-icons/cg"
import { GiTennisCourt } from "react-icons/gi"
import { marketplaceAbi, chainsToContracts } from "@/constants"

const GET_MARKETPLACE_EVENTS = `
  query GetMarketplaceEvents {
    allItemListeds {
      nodes {
        rindexerId
        tokenId
        nftAddress
        price
        seller
        contractAddress
        txHash
        blockNumber
        txIndex
      }
    }
    allItemBoughts {
      nodes {
        tokenId
        nftAddress
        blockNumber
        txIndex
      }
    }
    allItemCanceleds {
      nodes {
        tokenId
        nftAddress
        blockNumber
        txIndex
      }
    }
    allItemUpdateds {
      nodes {
        tokenId
        nftAddress
        seller
        oldPrice
        newPrice
        blockNumber
        txIndex
      }
    }
  }
`

interface GraphQLResponse {
    data: {
        allItemListeds: {
            nodes: Array<{
                rindexerId: string
                tokenId: string
                nftAddress: string
                price: string
                seller: string
                contractAddress: string
                txHash: string
            }>
        }
        allItemBoughts: {
            nodes: Array<{ tokenId: string; nftAddress: string }>
        }
        allItemCanceleds: {
            nodes: Array<{ tokenId: string; nftAddress: string }>
        }
        allItemUpdateds: {
            nodes: Array<{
                tokenId: string
                nftAddress: string
                newPrice: string
                blockNumber: string
                txIndex: string
            }>
        }
    }
}

export default function RecentlyListedNFTs() {
    const chainId = useChainId()
    const queryClient = useQueryClient()

    const marketplaceAddress = useMemo(() => {
        return (chainsToContracts[chainId]?.nftMarketplace as `0x${string}`) || null
    }, [chainId])

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["marketplaceEvents"],
        queryFn: async () => {
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: GET_MARKETPLACE_EVENTS }),
            })

            if (!res.ok) throw new Error("Network response was not ok")
            const json: GraphQLResponse = await res.json()
            return json.data
        },
    })

    const activeListings = useMemo(() => {
        if (!data) return []

        const { allItemListeds, allItemUpdateds, allItemBoughts, allItemCanceleds } = data

        // 1. We create a single array containing ALL the market events combined
        const allEvents: any[] = []

        allItemListeds.nodes.forEach((item: any) => {
            allEvents.push({
                type: "LISTED",
                key: `${item.nftAddress.toLowerCase()}-${item.tokenId}`,
                block: Number(item.blockNumber || 0),
                index: Number(item.txIndex || 0),
                data: item,
            })
        })

        allItemCanceleds.nodes.forEach((item: any) => {
            allEvents.push({
                type: "CANCELED",
                key: `${item.nftAddress.toLowerCase()}-${item.tokenId}`,
                block: Number(item.blockNumber || 0),
                index: Number(item.txIndex || 0),
            })
        })

        allItemBoughts.nodes.forEach((item: any) => {
            allEvents.push({
                type: "BOUGHT",
                key: `${item.nftAddress.toLowerCase()}-${item.tokenId}`,
                block: Number(item.blockNumber || 0),
                index: Number(item.txIndex || 0),
            })
        })

        allItemUpdateds.nodes.forEach((item: any) => {
            allEvents.push({
                type: "UPDATED",
                key: `${item.nftAddress.toLowerCase()}-${item.tokenId}`,
                block: Number(item.blockNumber || 0),
                index: Number(item.txIndex || 0),
                data: item,
            })
        })

        // 2. Sort chronologically: first by block number, and if the block numbers are the same, by transaction ID
        allEvents.sort((a, b) => {
            if (a.block !== b.block) return a.block - b.block
            return a.index - b.index
        })

        // 3. Reconstruct the actual state of the market based on the historical timeline
        const listingsMap: Record<string, any> = {}

        allEvents.forEach(event => {
            if (event.type === "LISTED") {
                listingsMap[event.key] = event.data
            } else if (event.type === "UPDATED") {
                if (listingsMap[event.key]) {
                    listingsMap[event.key] = {
                        ...listingsMap[event.key],
                        price: event.data.newPrice,
                    }
                }
            } else if (event.type === "CANCELED" || event.type === "BOUGHT") {
                delete listingsMap[event.key]
            }
        })

        return Object.values(listingsMap)
    }, [data])

    const handleRefreshData = async () => {
        setTimeout(async () => {
            await queryClient.invalidateQueries({ queryKey: ["marketplaceEvents"] })
            refetch()
        }, 2500)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <CgSpinner className="animate-spin text-emerald-600" size={36} />
                <p className="text-zinc-500 font-medium text-sm tracking-wide">
                    Syncing Grand Slam Ledger...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-24 max-w-md mx-auto">
                <p className="text-rose-600 font-semibold mb-1">
                    Failed to query marketplace indexer
                </p>
                <p className="text-xs text-zinc-400">
                    Please verify your RPC endpoint or local node infrastructure status.
                </p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-10">
            {/* TOP BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-zinc-100">
                <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                        Active Arenas
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Showing {activeListings.length} court
                        {activeListings.length === 1 ? "" : "s"} currently open for open bidding.
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="w-full sm:w-auto py-2.5 px-5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
                >
                    Seller Dashboard
                </Link>
            </div>

            {/* GRID SECTIONS */}
            {activeListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 p-8">
                    <div className="p-3 bg-zinc-200/50 text-zinc-400 rounded-full mb-3">
                        <GiTennisCourt size={24} />
                    </div>
                    <h3 className="font-bold text-zinc-800 text-sm">No courts listed right now</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1">
                        Be the first to create and list an arena by visiting the Minting House!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {activeListings.map(nft => (
                        <NFTBox
                            key={`${nft.nftAddress}-${nft.tokenId}`}
                            tokenId={nft.tokenId}
                            contractAddress={nft.nftAddress}
                            price={nft.price}
                            marketplaceAddress={marketplaceAddress || ""}
                            marketplaceAbi={marketplaceAbi}
                            onActionSuccess={handleRefreshData}
                            showControls={true}
                            isOwnedByUser={true}
                            isListed={true}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
