"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    useAccount,
    useChainId,
    useWriteContract,
    useReadContract,
    useWaitForTransactionReceipt,
} from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { chainsToContracts, erc20Abi, marketplaceAbi } from "@/constants"
import NFTBox from "@/components/NFTBox"
import { CgSpinner } from "react-icons/cg"
import { FaTicketAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa"
import { useMarketplaceCache } from "@/hooks/useMarketplaceCache"

interface Listing {
    price: bigint
    seller: string
}

export default function BuyNftPage() {
    const router = useRouter()
    const { contractAddress, tokenId } = useParams() as {
        contractAddress: string
        tokenId: string
    }
    const { address } = useAccount()
    const chainId = useChainId()

    const { applyOptimisticUpdate } = useMarketplaceCache()

    const marketplaceAddress =
        (chainsToContracts[chainId]?.nftMarketplace as `0x${string}`) || "0x"
    const usdcAddress = (chainsToContracts[chainId]?.usdc as `0x${string}`) || "0x"

    const [step, setStep] = useState(1) // 1: Preview, 2: Approval, 3: Purchase

    // 1. Get the listing details from marketplace
    const { data: listingData, isLoading: isListingLoading } = useReadContract({
        abi: marketplaceAbi,
        address: marketplaceAddress,
        functionName: "getListing",
        args: [contractAddress as `0x${string}`, BigInt(tokenId)],
    })

    const listing = listingData as Listing | undefined
    const price = listing ? listing.price.toString() : "0"
    const seller = listing ? listing.seller : undefined

    const { data: usdcBalanceData, isLoading: isBalanceLoading } = useReadContract({
        abi: erc20Abi,
        address: usdcAddress,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && usdcAddress !== "0x",
        },
    })

    const usdcBalance = (usdcBalanceData as bigint) || BigInt(0)
    const listingPrice = BigInt(price)

    const hasInsufficientBalance = usdcBalance < listingPrice

    // 2. Contracts interaction Hooks
    const {
        data: approvalHash,
        isPending: isApprovalPending,
        writeContractAsync: approveToken,
        error: approvalError,
    } = useWriteContract()
    const {
        data: purchaseHash,
        isPending: isPurchasePending,
        writeContractAsync: buyNft,
        error: purchaseError,
    } = useWriteContract()

    // 3. Confirmations and receipts listeners
    const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } =
        useWaitForTransactionReceipt({ hash: approvalHash })
    const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseSuccess } =
        useWaitForTransactionReceipt({ hash: purchaseHash })

    const isListed = price && BigInt(price) > BigInt(0)
    const isSeller = seller?.toLowerCase() === address?.toLowerCase()
    const isChainSupported =
        chainId in chainsToContracts && chainsToContracts[chainId]?.nftMarketplace !== undefined

    // Handle ERC20 token spending approval
    const handleApprove = async () => {
        if (!price) return
        try {
            await approveToken({
                abi: erc20Abi,
                address: usdcAddress,
                functionName: "approve",
                args: [marketplaceAddress, BigInt(price)],
            })
            setStep(2)
        } catch (error) {
            console.error("Token allowance approval failed:", error)
        }
    }

    // Handle atomic purchase call
    const handleBuy = async () => {
        try {
            await buyNft({
                abi: marketplaceAbi,
                address: marketplaceAddress,
                functionName: "buyItem",
                args: [contractAddress as `0x${string}`, BigInt(tokenId)],
            })
            setStep(3)
        } catch (error) {
            console.error("Item purchase atomic route failed:", error)
        }
    }

    // Automatic redirect loop upon completion
    useEffect(() => {
        if (step === 3 && isPurchaseSuccess) {
            applyOptimisticUpdate(
                contractAddress,
                tokenId,
                { isListed: false, price: null },
                {
                    type: "PURCHASED",
                    tokenId: tokenId,
                    nftAddress: contractAddress,
                    buyer: address || "0x",
                    seller: seller || "0x",
                    price: price,
                }
            )

            const timer = setTimeout(() => {
                router.push("/")
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [
        step,
        isPurchaseSuccess,
        router,
        contractAddress,
        tokenId,
        address,
        seller,
        price,
        applyOptimisticUpdate,
    ])

    return (
        <div className="min-h-[calc(100vh-75px)] bg-zinc-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* GLOBAL RESTRICTION DISPATCHER */}
                {!address ? (
                    <div className="p-8 bg-white rounded-2xl shadow-xl border border-zinc-200 text-center flex flex-col items-center max-w-md mx-auto">
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">Secure Checkout</h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            Connect your decentralized signature provider to access the trade
                            clearing engine.
                        </p>
                        <ConnectButton />
                    </div>
                ) : !isChainSupported ? (
                    <div className="p-8 bg-white rounded-2xl shadow-xl border border-rose-200 text-center flex flex-col items-center max-w-md mx-auto">
                        <h2 className="text-xl font-bold text-rose-900 mb-2">
                            Unsupported Settlement Layer
                        </h2>
                        <p className="text-sm text-rose-600/80 mb-6">
                            Your wallet is currently anchored to an inactive testnet. Switch
                            networks to proceed.
                        </p>
                        <ConnectButton />
                    </div>
                ) : isListingLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <CgSpinner className="animate-spin text-zinc-900" size={32} />
                        <p className="text-sm text-zinc-400 font-medium">
                            Validating court ownership states...
                        </p>
                    </div>
                ) : !isListed ? (
                    <div className="p-8 bg-white rounded-2xl shadow-xl border border-zinc-200 text-center flex flex-col items-center max-w-md mx-auto">
                        <FaExclamationTriangle className="text-zinc-400 mb-3" size={28} />
                        <h2 className="text-lg font-bold text-zinc-900 mb-1">Arena Unlisted</h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            This standard Grand Slam Court token is not currently configured for
                            open trade operations.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm transition-colors"
                        >
                            Return to Marketplace
                        </button>
                    </div>
                ) : isSeller ? (
                    <div className="p-8 bg-white rounded-2xl shadow-xl border border-zinc-200 text-center flex flex-col items-center max-w-md mx-auto">
                        <div className="p-3 bg-zinc-100 rounded-full text-zinc-800 mb-3 text-sm font-bold">
                            YOUR PROPERTY
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900 mb-1">
                            Self-Purchase Blocked
                        </h2>
                        <p className="text-sm text-zinc-500 mb-6">
                            You are listed as the legal custodian of this arena asset. To change
                            configurations, use your Seller Dashboard.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm transition-colors"
                        >
                            Return to Marketplace
                        </button>
                    </div>
                ) : (
                    /* STEPPING LOGIC WIDGET */
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
                        {/* STEP 1: PREVIEW AND APPROVE STAGE */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="border-b border-zinc-100 pb-3">
                                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                                        Acquisition Settlement
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        Approve the decentralized smart contract logic to process
                                        your transaction escrow allocation.
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                    <div className="w-64 flex-shrink-0">
                                        <NFTBox
                                            tokenId={tokenId}
                                            contractAddress={contractAddress}
                                            price={price}
                                            marketplaceAddress={marketplaceAddress}
                                            marketplaceAbi={marketplaceAbi}
                                            showControls={false}
                                            isOwnedByUser={false}
                                        />
                                    </div>

                                    <div className="flex-1 w-full space-y-4">
                                        <div className="grid grid-cols-1 gap-3 bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm">
                                            <div>
                                                <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                                    Asset Contract Address
                                                </span>
                                                <span className="font-mono text-zinc-800 break-all">
                                                    {contractAddress}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                                    On-chain Token ID
                                                </span>
                                                <span className="font-semibold text-zinc-900">
                                                    Grand Slam Court Token #{tokenId}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                                    Seller Signer Key
                                                </span>
                                                <span className="font-mono text-zinc-600 break-all">
                                                    {seller}
                                                </span>
                                            </div>
                                        </div>

                                        {!isListingLoading &&
                                            !isBalanceLoading &&
                                            hasInsufficientBalance && (
                                                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium flex items-center gap-2">
                                                    <FaExclamationTriangle className="flex-shrink-0 text-amber-600" />
                                                    <span>
                                                        Insufficient USDC balance. You need{" "}
                                                        {Number(listingPrice) / 1e6} USDC but only
                                                        have {Number(usdcBalance) / 1e6} USDC.
                                                    </span>
                                                </div>
                                            )}

                                        <button
                                            onClick={handleApprove}
                                            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                                            disabled={
                                                isApprovalPending ||
                                                isApprovalConfirming ||
                                                hasInsufficientBalance ||
                                                isBalanceLoading
                                            }
                                        >
                                            {isApprovalPending || isApprovalConfirming ? (
                                                <>
                                                    <CgSpinner
                                                        className="animate-spin"
                                                        size={16}
                                                    />
                                                    <span>
                                                        Awaiting Ledger Allowance Approval...
                                                    </span>
                                                </>
                                            ) : hasInsufficientBalance ? (
                                                <span>Insufficient Balance</span> // 🔥 Mensaje dinámico
                                            ) : (
                                                <>
                                                    <FaTicketAlt size={12} />
                                                    <span>Authorize Purchase Value</span>
                                                </>
                                            )}
                                        </button>

                                        {approvalError && (
                                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-mono rounded-xl max-h-24 overflow-y-auto">
                                                {approvalError.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: CLEARING HOUSE MUTATION */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-zinc-900 tracking-tight border-b border-zinc-100 pb-3">
                                    Execute Vault Transfer
                                </h2>

                                {isApprovalConfirming ? (
                                    <div className="py-10 flex flex-col items-center justify-center gap-3">
                                        <CgSpinner
                                            className="animate-spin text-zinc-900"
                                            size={32}
                                        />
                                        <p className="text-sm text-zinc-500 font-medium">
                                            Indexing state change logs inside the settlement
                                            contract pool...
                                        </p>
                                    </div>
                                ) : isApprovalSuccess || !isApprovalPending ? (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
                                            <FaCheckCircle className="flex-shrink-0" /> Allowance
                                            cleared. The contract pool is ready to process the
                                            atomic swap.
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                            <div className="w-64 flex-shrink-0">
                                                <NFTBox
                                                    tokenId={tokenId}
                                                    contractAddress={contractAddress}
                                                    price={price}
                                                    marketplaceAddress={marketplaceAddress}
                                                    marketplaceAbi={marketplaceAbi}
                                                    showControls={false}
                                                    isOwnedByUser={false}
                                                />
                                            </div>

                                            <div className="flex-1 w-full space-y-4">
                                                {hasInsufficientBalance && (
                                                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium flex items-center gap-2">
                                                        <FaExclamationTriangle className="flex-shrink-0 text-amber-600" />
                                                        <span>
                                                            Your USDC balance dropped. Allocation
                                                            swap cannot proceed.
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleBuy}
                                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                                                    disabled={
                                                        isPurchasePending ||
                                                        isPurchaseConfirming ||
                                                        hasInsufficientBalance
                                                    }
                                                >
                                                    {isPurchasePending || isPurchaseConfirming ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <CgSpinner
                                                                className="animate-spin"
                                                                size={16}
                                                            />
                                                            <span>
                                                                Clearing Atomic Settlement Swap...
                                                            </span>
                                                        </div>
                                                    ) : hasInsufficientBalance ? (
                                                        "Insufficient Balance" // 🔥 Mensaje dinámico
                                                    ) : (
                                                        "Confirm Settlement Order"
                                                    )}
                                                </button>

                                                {purchaseError && (
                                                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-mono rounded-xl max-h-24 overflow-y-auto">
                                                        {purchaseError.message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* STEP 3: FINAL SYNCHRONIZATION ATOMIC SUCCESS */}
                        {step === 3 && (
                            <div className="space-y-6 text-center py-4">
                                <h2 className="text-xl font-bold text-zinc-900 tracking-tight text-left border-b border-zinc-100 pb-3">
                                    Transaction Receipts
                                </h2>

                                {isPurchaseConfirming ? (
                                    <div className="py-10 flex flex-col items-center justify-center gap-3">
                                        <CgSpinner
                                            className="animate-spin text-emerald-600"
                                            size={32}
                                        />
                                        <p className="text-sm text-zinc-500 font-medium">
                                            Broadcasting final transaction cryptographic blocks...
                                        </p>
                                    </div>
                                ) : isPurchaseSuccess ? (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-sm font-medium inline-flex flex-col items-center gap-1.5 w-full">
                                            <span className="text-2xl">🎉</span>
                                            <span className="font-extrabold">
                                                Asset Transfer Successfully Inscribed!
                                            </span>
                                            <span className="text-xs text-emerald-700/80">
                                                You are now the authorized owner of Grand Slam
                                                Court #{tokenId}. Redirecting to open board...
                                            </span>
                                        </div>

                                        <div className="w-56 mx-auto">
                                            <NFTBox
                                                tokenId={tokenId}
                                                contractAddress={contractAddress}
                                                price={price}
                                                marketplaceAddress={marketplaceAddress}
                                                marketplaceAbi={marketplaceAbi}
                                                showControls={false}
                                                isOwnedByUser={false}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
