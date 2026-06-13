"use client"

import { useState, useMemo } from "react"
import {
    useAccount,
    useChainId,
    useWriteContract,
    useReadContract,
    useWaitForTransactionReceipt,
} from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { request } from "graphql-request"
import { chainsToContracts, nftAbi, marketplaceAbi } from "@/constants"
import NFTBox from "@/components/NFTBox"
import WithdrawPanel from "@/components/WithdrawPanel"
import { addDecimalsToPrice } from "../utils/formatPrice"
import { CgSpinner } from "react-icons/cg"
import {
    FaLock,
    FaCheckCircle,
    FaChevronRight,
    FaArrowLeft,
    FaExclamationTriangle,
    FaStore,
} from "react-icons/fa"
import CourtsCarousel from "@/components/CourtsCarousel"
import MarketplaceActivityTable from "@/components/MarketplaceActivityTable"

const GET_SELLER_HISTORY = `
  query GetSellerHistory {

    allItemListeds {
      nodes {
        tokenId
        nftAddress
        price
        seller
        blockNumber
        txIndex
      }
    }

    allItemCanceleds {
      nodes {
        tokenId
        nftAddress
        seller
        blockNumber
        txIndex
      }
    }

    allItemBoughts {
      nodes {
        tokenId
        nftAddress
        buyer
        seller
        price
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

    allTransfers {
      nodes {
        from
        to
        tokenId
        blockNumber
        txIndex
      }
    }

  }
`

export default function SellerDashboard() {
    const { address } = useAccount()
    const chainId = useChainId()

    const marketplaceAddress =
        (chainsToContracts[chainId]?.nftMarketplace as `0x${string}`) || "0x"

    const nftContractAddress = (chainsToContracts[chainId]?.courtNft as `0x${string}`) || "0x"

    const [nftAddress, setNftAddress] = useState("")
    const [tokenId, setTokenId] = useState("")
    const [price, setPrice] = useState("")
    const [step, setStep] = useState(1) // 1: Form Input, 2: Preview, 3: Approval, 4: Listing

    /*//////////////////////////////////////////////////////////////
                        MARKETPLACE READS & WRITES
    //////////////////////////////////////////////////////////////*/

    // 1. View the seller's total proceeds
    const { data: rawProceeds, refetch: refetchProceeds } = useReadContract({
        abi: marketplaceAbi,
        address: marketplaceAddress,
        functionName: "getProceeds",
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    })

    const proceeds = useMemo(() => {
        if (!rawProceeds) return "0"
        return (Number(rawProceeds) / 10 ** 6).toString()
    }, [rawProceeds])

    // 2. Read the owner of the NFT submitted for pre-validation
    const { data: ownerData } = useReadContract({
        abi: nftAbi,
        address: nftAddress as `0x${string}`,
        functionName: "ownerOf",
        args: tokenId ? [BigInt(tokenId)] : undefined,
        query: { enabled: !!tokenId && nftAddress.startsWith("0x") },
    })

    const isOwner = (ownerData as string)?.toLowerCase() === address?.toLowerCase()

    // VALIDATION: Check whether the item is already listed on the Marketplace
    const { data: existingListing } = useReadContract({
        abi: marketplaceAbi,
        address: marketplaceAddress,
        functionName: "getListing",
        args:
            nftAddress.startsWith("0x") && tokenId
                ? [nftAddress as `0x${string}`, BigInt(tokenId)]
                : undefined,
        query: { enabled: !!tokenId && nftAddress.startsWith("0x") },
    })

    // If the price of the list item is greater than 0, it means it has already been published
    const isAlreadyListed = useMemo(() => {
        if (!existingListing) return false
        const listedPrice = Array.isArray(existingListing)
            ? existingListing[0]
            : (existingListing as any)?.price
        return listedPrice && BigInt(listedPrice) > BigInt(0)
    }, [existingListing])

    // 3. Retrieve the complete history to set up the user's courts (Carousel)
    const { data: rindexerData, refetch: refetchSellerHistory } = useQuery({
        queryKey: ["sellerHistory", address],
        queryFn: async () => request("http://localhost:3001/graphql", GET_SELLER_HISTORY),
        enabled: !!address,
    })

    const myCartsState = useMemo(() => {
        if (!rindexerData || !address) {
            return {
                activity: [],
                inventory: [],
            }
        }

        const { allItemListeds, allItemUpdateds, allItemCanceleds, allItemBoughts, allTransfers } =
            rindexerData as any

        const userAddressLower = address.toLowerCase()

        const ownershipMap: Record<string, string> = {}

        const listedTokens = new Map<
            string,
            {
                price: string
            }
        >()

        const transfers = [...allTransfers.nodes].sort((a: any, b: any) =>
            Number(a.blockNumber) !== Number(b.blockNumber)
                ? Number(a.blockNumber) - Number(b.blockNumber)
                : Number(a.txIndex) - Number(b.txIndex)
        )

        transfers.forEach((transfer: any) => {
            ownershipMap[transfer.tokenId] = transfer.to.toLowerCase()
        })

        const listingEvents: any[] = []

        allItemListeds.nodes.forEach((item: any) => {
            listingEvents.push({
                type: "LISTED",
                tokenId: item.tokenId,
                price: item.price,
                block: Number(item.blockNumber),
                index: Number(item.txIndex),
            })
        })

        allItemUpdateds.nodes.forEach((item: any) => {
            listingEvents.push({
                type: "UPDATED",
                tokenId: item.tokenId,
                price: item.newPrice,
                block: Number(item.blockNumber),
                index: Number(item.txIndex),
            })
        })

        allItemCanceleds.nodes.forEach((item: any) => {
            listingEvents.push({
                type: "CANCELED",
                tokenId: item.tokenId,
                block: Number(item.blockNumber),
                index: Number(item.txIndex),
            })
        })

        allItemBoughts.nodes.forEach((item: any) => {
            listingEvents.push({
                type: "SOLD",
                tokenId: item.tokenId,
                block: Number(item.blockNumber),
                index: Number(item.txIndex),
            })
        })

        listingEvents.sort((a, b) =>
            Number(a.block) !== Number(b.block)
                ? Number(a.block) - Number(b.block)
                : Number(a.index) - Number(b.index)
        )

        listingEvents.forEach(event => {
            const tokenId = event.tokenId.toString()

            if (event.type === "LISTED") {
                listedTokens.set(tokenId, {
                    price: event.price,
                })
            }

            if (event.type === "UPDATED") {
                const current = listedTokens.get(tokenId)

                if (current) {
                    listedTokens.set(tokenId, {
                        price: event.price,
                    })
                }
            }

            if (event.type === "CANCELED" || event.type === "SOLD") {
                listedTokens.delete(tokenId)
            }
        })

        const inventory = Object.entries(ownershipMap)
            .filter(([_, owner]) => owner === userAddressLower)
            .map(([tokenId]) => ({
                tokenId,
                isListed: listedTokens.has(tokenId),
                price: listedTokens.get(tokenId)?.price ?? null,
            }))

        const activity: any[] = []

        // LISTED
        allItemListeds.nodes.forEach((item: any) => {
            if (item.seller.toLowerCase() === userAddressLower) {
                activity.push({
                    type: "LISTED",
                    tokenId: item.tokenId,
                    nftAddress: item.nftAddress,
                    price: item.price,
                    block: Number(item.blockNumber),
                    index: Number(item.txIndex),
                })
            }
        })

        // UPDATED
        allItemUpdateds.nodes.forEach((item: any) => {
            if (item.seller.toLowerCase() === userAddressLower) {
                activity.push({
                    type: "UPDATED",
                    tokenId: item.tokenId,
                    nftAddress: item.nftAddress,
                    oldPrice: item.oldPrice,
                    newPrice: item.newPrice,
                    block: Number(item.blockNumber),
                    index: Number(item.txIndex),
                })
            }
        })

        // CANCELED
        allItemCanceleds.nodes.forEach((item: any) => {
            if (item.seller.toLowerCase() === userAddressLower) {
                activity.push({
                    type: "CANCELED",
                    tokenId: item.tokenId,
                    nftAddress: item.nftAddress,
                    block: Number(item.blockNumber),
                    index: Number(item.txIndex),
                })
            }
        })

        // SOLD + PURCHASED
        allItemBoughts.nodes.forEach((item: any) => {
            if (item.seller.toLowerCase() === userAddressLower) {
                activity.push({
                    type: "SOLD",
                    tokenId: item.tokenId,
                    nftAddress: item.nftAddress,
                    buyer: item.buyer,
                    price: item.price,
                    block: Number(item.blockNumber),
                    index: Number(item.txIndex),
                })
            }

            if (item.buyer.toLowerCase() === userAddressLower) {
                activity.push({
                    type: "PURCHASED",
                    tokenId: item.tokenId,
                    nftAddress: item.nftAddress,
                    seller: item.seller,
                    price: item.price,
                    block: Number(item.blockNumber),
                    index: Number(item.txIndex),
                })
            }
        })

        activity.sort((a, b) => (a.block !== b.block ? b.block - a.block : b.index - a.index))

        return {
            inventory,
            activity,
        }
    }, [rindexerData, address])

    // 4. Executions (Approve, List, Withdraw)
    const {
        data: approvalHash,
        isPending: isApprovalPending,
        writeContractAsync: approveNft,
        error: approvalError,
    } = useWriteContract()
    const {
        data: listingHash,
        isPending: isListingPending,
        writeContractAsync: listNft,
        error: listingError,
    } = useWriteContract()
    const {
        data: withdrawHash,
        isPending: isWithdrawPending,
        writeContractAsync: withdrawProceeds,
    } = useWriteContract()

    // 5. Confirmation of Transaction Receipts
    const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } =
        useWaitForTransactionReceipt({ hash: approvalHash })
    const { isLoading: isListingConfirming, isSuccess: isListingSuccess } =
        useWaitForTransactionReceipt({ hash: listingHash })
    const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
        useWaitForTransactionReceipt({
            hash: withdrawHash,
            query: { enabled: !!withdrawHash },
        })

    /*//////////////////////////////////////////////////////////////
                             HANDLERS
    //////////////////////////////////////////////////////////////*/

    const handlePreview = (e: React.FormEvent) => {
        e.preventDefault()
        if (nftAddress && tokenId && price && !isAlreadyListed) {
            setStep(2)
        }
    }

    const handleApprove = async () => {
        if (!nftAddress || !tokenId) return
        try {
            await approveNft({
                abi: nftAbi,
                address: nftAddress as `0x${string}`,
                functionName: "approve",
                args: [marketplaceAddress, BigInt(tokenId)],
            })
            setStep(3)
        } catch (error) {
            console.error("Approval rejected:", error)
        }
    }

    const handleList = async () => {
        if (!nftAddress || !tokenId || !price) return
        try {
            const formattedPrice = addDecimalsToPrice(price)
            await listNft({
                abi: marketplaceAbi,
                address: marketplaceAddress,
                functionName: "listItem",
                args: [nftAddress as `0x${string}`, BigInt(tokenId), formattedPrice],
            })
            setStep(4)
            setTimeout(() => refetchSellerHistory(), 2500)
        } catch (error) {
            console.error("Listing rejected:", error)
        }
    }

    const handleWithdraw = async () => {
        try {
            await withdrawProceeds({
                abi: marketplaceAbi,
                address: marketplaceAddress,
                functionName: "withdrawProceeds",
                args: [],
            })
            setTimeout(() => refetchProceeds(), 3000)
        } catch (error) {
            console.error("Withdrawal failed:", error)
        }
    }

    return (
        <div className="space-y-8 container mx-auto px-4 py-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <WithdrawPanel
                    proceeds={proceeds}
                    handleWithdraw={handleWithdraw}
                    isWithdrawPending={isWithdrawPending}
                    isWithdrawConfirming={isWithdrawConfirming}
                    isWithdrawSuccess={isWithdrawSuccess}
                />

                {/* PANEL DERECHO: FORMULARIO PASO A PASO (LIST NFT) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                    {step === 1 && (
                        <form onSubmit={handlePreview} className="space-y-5">
                            <div className="border-b border-zinc-100 pb-3">
                                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                                    Open Court Listing
                                </h2>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Fill out the legal parameters required to list an arena on the
                                    market.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                                        Court NFT Address
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-950 text-sm text-zinc-900 font-mono"
                                        placeholder="0x..."
                                        value={nftAddress}
                                        onChange={e => setNftAddress(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                                            Token ID
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-950 text-sm text-zinc-900"
                                            placeholder="e.g. 0"
                                            value={tokenId}
                                            onChange={e => setTokenId(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                                            Listing Price (USDC)
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-950 text-sm text-zinc-900"
                                            placeholder="e.g. 10"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 🔥 ALERTA: Validación de Ítem ya listado */}
                            {!!isAlreadyListed && (
                                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <FaExclamationTriangle className="flex-shrink-0" />
                                    <span>
                                        This Token ID is already listed in the marketplace. Cancel
                                        or update its price from the main grid instead.
                                    </span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isAlreadyListed}
                                className="w-full mt-4 py-3 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <span>Preview Listing</span>
                                <FaChevronRight size={10} />
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold text-zinc-900 tracking-tight border-b border-zinc-100 pb-3">
                                Preview Structural Specifications
                            </h2>
                            {!isOwner && ownerData ? (
                                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
                                    ⚠️ Ownership Verification Failed. You do not own this Token ID
                                    inside the provided contract.
                                </div>
                            ) : (
                                <>
                                    <div className="w-56 mx-auto">
                                        <NFTBox
                                            tokenId={tokenId}
                                            contractAddress={nftAddress}
                                            price={addDecimalsToPrice(price)}
                                            marketplaceAddress={marketplaceAddress}
                                            marketplaceAbi={marketplaceAbi}
                                            showControls={false}
                                            isOwnedByUser={true}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <FaArrowLeft size={10} /> Back
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            disabled={isApprovalPending}
                                        >
                                            {isApprovalPending ? (
                                                <CgSpinner className="animate-spin" size={16} />
                                            ) : (
                                                <FaLock size={12} />
                                            )}
                                            <span>Approve Court</span>
                                        </button>
                                    </div>
                                    {approvalError && (
                                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-mono max-h-24 overflow-y-auto">
                                            {approvalError.message}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5 text-center">
                            <h2 className="text-xl font-bold text-zinc-900 tracking-tight border-b border-zinc-100 pb-3 text-left">
                                Deploy Listing Contract
                            </h2>
                            {isApprovalConfirming ? (
                                <div className="py-8 flex flex-col items-center gap-3">
                                    <CgSpinner className="animate-spin text-zinc-900" size={32} />
                                    <p className="text-sm text-zinc-500 font-medium">
                                        Confirming allowance in execution pool...
                                    </p>
                                </div>
                            ) : isApprovalSuccess || !isApprovalPending ? (
                                <>
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                                        <FaCheckCircle /> Access Rights Approved Successfully!
                                        Ready to Broadcast Sale.
                                    </div>
                                    <div className="w-56 mx-auto">
                                        <NFTBox
                                            tokenId={tokenId}
                                            contractAddress={nftAddress}
                                            price={addDecimalsToPrice(price)}
                                            marketplaceAddress={marketplaceAddress}
                                            marketplaceAbi={marketplaceAbi}
                                            showControls={false}
                                            isOwnedByUser={true}
                                        />
                                    </div>
                                    <button
                                        onClick={handleList}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                                        disabled={isListingPending || isListingConfirming}
                                    >
                                        {isListingPending || isListingConfirming ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <CgSpinner className="animate-spin" size={16} />
                                                <span>Broadcasting Ledger Update...</span>
                                            </div>
                                        ) : (
                                            "Confirm Marketplace Listing"
                                        )}
                                    </button>
                                    {listingError && (
                                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-mono max-h-24 overflow-y-auto text-left">
                                            {listingError.message}
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center">
                            <h2 className="text-xl font-bold text-zinc-900 tracking-tight border-b border-zinc-100 pb-3 text-left">
                                Listing Executed
                            </h2>
                            {isListingConfirming ? (
                                <div className="py-8 flex flex-col items-center gap-3">
                                    <CgSpinner
                                        className="animate-spin text-emerald-600"
                                        size={32}
                                    />
                                    <p className="text-sm text-zinc-500 font-medium">
                                        Validating atomic storage logs on-chain...
                                    </p>
                                </div>
                            ) : isListingSuccess ? (
                                <>
                                    <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-sm font-medium inline-flex flex-col items-center gap-2 w-full">
                                        <span className="text-2xl">🎾</span>
                                        <span className="font-bold">
                                            Grand Slam Court Is Now Live for Bidding!
                                        </span>
                                    </div>
                                    <div className="w-56 mx-auto">
                                        <NFTBox
                                            tokenId={tokenId}
                                            contractAddress={nftAddress}
                                            price={addDecimalsToPrice(price)}
                                            marketplaceAddress={marketplaceAddress}
                                            marketplaceAbi={marketplaceAbi}
                                            showControls={false}
                                            isOwnedByUser={true}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNftAddress("")
                                            setTokenId("")
                                            setPrice("")
                                            setStep(1)
                                        }}
                                        className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                                    >
                                        List Another Arena
                                    </button>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <FaStore className="text-zinc-800" />
                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                        My Management Area
                    </h2>
                </div>

                <CourtsCarousel
                    inventory={myCartsState.inventory}
                    nftContractAddress={nftContractAddress}
                    marketplaceAddress={marketplaceAddress}
                    refetchSellerHistory={refetchSellerHistory}
                />

                <MarketplaceActivityTable activity={myCartsState.activity} />
            </div>
        </div>
    )
}
