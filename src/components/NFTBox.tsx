"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { courtAbi } from "../constants"
import { CgSpinner } from "react-icons/cg"
import { FaTag, FaTimesCircle, FaCheck, FaHourglassHalf } from "react-icons/fa"

export type NFTBoxAction = { type: "UPDATED"; newPrice: string } | { type: "CANCELED" }

interface NFTBoxProps {
    tokenId: string
    contractAddress: string
    price: string
    marketplaceAddress: string
    marketplaceAbi: any
    onActionSuccess?: (action: NFTBoxAction) => void
    showControls?: boolean
    isOwnedByUser?: boolean
    isListed?: boolean
    fromMyDashboard?: boolean
}

export default function NFTBox({
    tokenId,
    contractAddress,
    price,
    marketplaceAddress,
    marketplaceAbi,
    onActionSuccess,
    showControls = false,
    isOwnedByUser = false,
    isListed = false,
    fromMyDashboard = false,
}: NFTBoxProps) {
    const router = useRouter()
    const { address: connectedAddress } = useAccount()

    const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)
    const [isLoadingImage, setIsLoadingImage] = useState(false)
    const [imageError, setImageError] = useState(false)

    const [isEditingPrice, setIsEditingPrice] = useState(false)
    const [newPrice, setNewPrice] = useState("")
    const [pendingAction, setPendingAction] = useState<NFTBoxAction | null>(null)

    // 1. Read the TokenURI for the court metadata
    const { data: tokenURIData, isLoading: isTokenURILoading } = useReadContract({
        abi: courtAbi,
        address: contractAddress as `0x${string}`,
        functionName: "tokenURI",
        args: [tokenId ? BigInt(tokenId) : undefined],
        query: { enabled: !!tokenId && !!contractAddress },
    })

    // 2. See the actual owner of the NFT
    const { data: nftOwner } = useReadContract({
        abi: courtAbi,
        address: contractAddress as `0x${string}`,
        functionName: "ownerOf",
        args: [tokenId ? BigInt(tokenId) : undefined],
        query: { enabled: !!tokenId && !!contractAddress },
    })

    const isOwner = connectedAddress?.toLowerCase() === (nftOwner as string)?.toLowerCase()

    // 3. Hooks for mutations (Cancel & Update) with batch confirmation control
    const { writeContractAsync, data: txHash, isPending: isWalletWaiting } = useWriteContract()
    const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    })

    useEffect(() => {
        if (isTxSuccess) {
            setIsEditingPrice(false)
            setNewPrice("")

            if (onActionSuccess && pendingAction) {
                onActionSuccess(pendingAction)
                setPendingAction(null)
            } else if (!onActionSuccess) {
                setTimeout(() => {
                    router.refresh()
                }, 2500)
            }
        }
    }, [isTxSuccess, onActionSuccess, pendingAction, router])

    // Fetch metadata
    useEffect(() => {
        if (tokenURIData && !isTokenURILoading) {
            const fetchMetadata = async () => {
                setIsLoadingImage(true)
                try {
                    const response = await fetch(tokenURIData as string)
                    const metadata = await response.json()
                    setNftImageUrl(metadata.image || null)
                } catch (error) {
                    console.error("Error fetching court metadata:", error)
                    setImageError(true)
                } finally {
                    setIsLoadingImage(false)
                }
            }
            fetchMetadata()
        }
    }, [tokenURIData, isTokenURILoading])

    const handleCancelListing = async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            setPendingAction({ type: "CANCELED" })
            await writeContractAsync({
                abi: marketplaceAbi,
                address: marketplaceAddress as `0x${string}`,
                functionName: "cancelListing",
                args: [contractAddress, BigInt(tokenId)],
            })
        } catch (err) {
            console.error("Error canceling listing:", err)
            setPendingAction(null)
        }
    }

    const handleUpdatePrice = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) return

        try {
            const parsedPrice = BigInt(Number(newPrice) * 10 ** 6)
            setPendingAction({ type: "UPDATED", newPrice: parsedPrice.toString() })
            await writeContractAsync({
                abi: marketplaceAbi,
                address: marketplaceAddress as `0x${string}`,
                functionName: "updateListing",
                args: [contractAddress, BigInt(tokenId), parsedPrice],
            })
        } catch (err) {
            console.error("Error updating price:", err)
            setPendingAction(null)
        }
    }

    const handleCardClick = () => {
        if (!isOwner && !isTxConfirming && !isWalletWaiting) {
            router.push(`/buy-nft/${contractAddress}/${tokenId}`)
        }
    }

    const displayPrice = (rawPrice: string | number) => {
        if (rawPrice === undefined || rawPrice === null) return "0 USDC"

        const priceStr = rawPrice.toString().trim()

        try {
            const value = BigInt(priceStr)
            const ONE_MILLION = BigInt(1000000)

            const baseUnits = value / ONE_MILLION
            const remainder = value % ONE_MILLION

            if (remainder === BigInt(0)) {
                return `${baseUnits.toString()} USDC`
            } else {
                const decimals = remainder.toString().padStart(6, "0").replace(/0+$/, "")
                return `${baseUnits.toString()}.${decimals} USDC`
            }
        } catch (e) {
            return `${(Number(priceStr) / 10 ** 6).toFixed(2)} USDC`
        }
    }

    const isWorking = isWalletWaiting || isTxConfirming

    return (
        <div
            onClick={handleCardClick}
            className={`group bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative ${
                !isOwner && !isWorking ? "cursor-pointer hover:-translate-y-1" : ""
            } ${isWorking ? "opacity-75 pointer-events-none" : ""}`}
        >
            {isWorking && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-2 rounded-2xl animate-fade-in">
                    <CgSpinner className="animate-spin text-zinc-950" size={32} />
                    <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FaHourglassHalf className="animate-pulse text-amber-500" size={10} />
                        {isWalletWaiting ? "Awaiting Signature..." : "Syncing Block..."}
                    </p>
                </div>
            )}

            <div className="aspect-square relative bg-zinc-50 w-full overflow-hidden border-b border-zinc-100">
                {isOwner && isOwnedByUser && (
                    <span className="absolute top-3 left-3 z-10 bg-zinc-950/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
                        Your Court
                    </span>
                )}
                {fromMyDashboard && (
                    <div className="absolute top-3 left-3 z-10">
                        {isListed ? (
                            <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-400/20">
                                Listed
                            </span>
                        ) : (
                            <span className="bg-zinc-950/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
                                Owned
                            </span>
                        )}
                    </div>
                )}

                {isLoadingImage || isTokenURILoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
                        <CgSpinner className="animate-spin text-zinc-400" size={28} />
                    </div>
                ) : imageError || !nftImageUrl ? (
                    <Image
                        src="/placeholder.png"
                        alt="Court Preview Unavailable"
                        fill
                        className="object-cover p-6 opacity-40 grayscale"
                        priority
                    />
                ) : (
                    <Image
                        src={nftImageUrl}
                        alt={`Grand Slam Court #${tokenId}`}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
                        onError={() => setImageError(true)}
                    />
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-zinc-900 text-lg tracking-tight">
                            Court #{tokenId}
                        </h3>
                        {!isEditingPrice && isListed && price && (
                            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                                {displayPrice(price)}
                            </span>
                        )}
                    </div>
                    <p
                        className="text-xs text-zinc-400 font-mono truncate"
                        title={contractAddress}
                    >
                        {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                    </p>
                </div>

                <div className="pt-2 border-t border-zinc-100">
                    {showControls && (
                        <>
                            {!isOwner ? (
                                <button className="w-full text-center text-xs font-bold text-zinc-500 group-hover:text-zinc-950 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                    View details & purchase →
                                </button>
                            ) : isListed ? (
                                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                    {isEditingPrice ? (
                                        <form
                                            onSubmit={handleUpdatePrice}
                                            className="flex gap-2 items-center"
                                        >
                                            <input
                                                type="text"
                                                placeholder="New Price"
                                                value={newPrice}
                                                onChange={e => setNewPrice(e.target.value)}
                                                className="w-full text-sm px-3 py-1.5 border border-zinc-300 rounded-lg focus:outline-zinc-900"
                                                disabled={isWorking}
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={isWorking}
                                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                                            >
                                                <FaCheck size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingPrice(false)}
                                                className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <FaTimesCircle size={12} />
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setIsEditingPrice(true)}
                                                className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-2 px-3 rounded-xl transition-colors border border-zinc-200 cursor-pointer"
                                            >
                                                <FaTag size={10} />
                                                Update
                                            </button>
                                            <button
                                                onClick={handleCancelListing}
                                                className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 py-2 px-3 rounded-xl transition-colors border border-rose-100 cursor-pointer"
                                            >
                                                <FaTimesCircle size={10} />
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-8.5 flex items-center justify-center">
                                    <span className="text-xs font-bold text-zinc-400 relative top-1">
                                        Available to list
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
