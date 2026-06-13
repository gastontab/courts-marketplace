"use client"

import { useState, useMemo, useEffect } from "react"
import { GiTennisCourt } from "react-icons/gi"
import { CgSpinner } from "react-icons/cg"
import {
    useChainId,
    useWriteContract,
    useAccount,
    useWaitForTransactionReceipt,
    useReadContract,
} from "wagmi"
import { courtAbi, chainsToContracts } from "@/constants"
import { InputForm } from "./ui/InputField"

interface MintCourtProps {
    contractAddress?: `0x${string}`
}

export default function MintCourt({ contractAddress }: MintCourtProps) {
    const account = useAccount()
    const chainId = useChainId()

    // Resuelve la dirección del contrato de canchas
    const courtContractAddress = useMemo(() => {
        if (contractAddress) return contractAddress
        return (chainsToContracts[chainId]?.courtNft as `0x${string}`) || null
    }, [chainId, contractAddress])

    const [tokenId, setTokenId] = useState("")
    const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)
    const [lastMintedTokenId, setLastMintedTokenId] = useState<string | null>(null)

    // Contract writing for minting court NFT
    const {
        data: mintCourtHash,
        isPending: isMintPending,
        error: mintCourtError,
        writeContractAsync: writeMintCourtAsync,
    } = useWriteContract()

    // Transaction receipt for minting
    const {
        isLoading: isMintConfirming,
        isSuccess: isMintConfirmed,
        isError: isMintError,
        data: dataFromMintReceipt,
    } = useWaitForTransactionReceipt({
        confirmations: 1,
        hash: mintCourtHash,
    })

    // Read contract for tokenURI
    const {
        data: tokenURIData,
        isLoading: isTokenURILoading,
        error: tokenURIError,
    } = useReadContract({
        abi: courtAbi,
        address: courtContractAddress as `0x${string}`,
        functionName: "tokenURI", // Asumiendo que mantiene el estándar ERC721
        args: [tokenId ? BigInt(tokenId) : undefined],
        query: {
            enabled: !!tokenId,
        },
    })

    // Function to mint a Grand Slam Court NFT
    async function handleMintCourt() {
        try {
            const txHash = await writeMintCourtAsync({
                abi: courtAbi,
                address: courtContractAddress as `0x${string}`,
                functionName: "mintPlayer",
                args: [],
            })
        } catch (error) {
            console.error("Error minting court:", error)
        }
    }

    // Effect to process tokenURI metadata
    useEffect(() => {
        if (tokenURIData && !isTokenURILoading) {
            const fetchMetadata = async () => {
                try {
                    const url = tokenURIData as string
                    const response = await fetch(url)
                    const metadata = await response.json()

                    setNftImageUrl(metadata.image || null)
                } catch (error) {
                    console.error("Error fetching court metadata:", error)
                }
            }
            fetchMetadata()
        } else {
            setNftImageUrl(null)
        }
    }, [tokenURIData, isTokenURILoading])

    // Load saved Token ID from storage on mount
    useEffect(() => {
        const savedTokenId = localStorage.getItem("courtTokenId")
        if (savedTokenId) setTokenId(savedTokenId)
    }, [])

    // Save Token ID changes to storage
    useEffect(() => {
        localStorage.setItem("courtTokenId", tokenId)
    }, [tokenId])

    // Track the minted NFT extracting safely the TokenID from the Transfer log
    useEffect(() => {
        if (isMintConfirmed && dataFromMintReceipt) {
            try {
                // Buscamos el log que tenga indexados los topics típicos de Transfer (3 topics: Event, From, To)
                const transferLog = dataFromMintReceipt.logs.find(
                    log => log.topics.length === 4 || log.topics.length === 3
                )
                const hexTokenId = transferLog?.topics[3] || transferLog?.topics[2]

                if (hexTokenId) {
                    const intTokenId = parseInt(hexTokenId, 16)
                    setLastMintedTokenId(`Token ID: #${intTokenId}`)
                }
            } catch (e) {
                console.error("Failed to parse TokenID from logs", e)
            }
        }
    }, [isMintConfirmed, dataFromMintReceipt])

    // Helper function for interactive button states
    function getMintButtonContent() {
        if (isMintPending)
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Confirming in wallet...</span>
                </div>
            )
        if (isMintConfirming)
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Generating your Court NFT...</span>
                </div>
            )
        if (mintCourtError || isMintError) {
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span>Transaction failed. Try again.</span>
                </div>
            )
        }
        if (isMintConfirmed) {
            return "Court Minted Successfully!"
        }
        return (
            <div className="flex items-center justify-center gap-2">
                <GiTennisCourt size={22} />
                <span>Mint New Court NFT</span>
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto w-full p-6 flex flex-col gap-6 bg-white rounded-2xl border border-zinc-200 shadow-xl">
            {/* Header Form */}
            <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    Court Club House
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                    Acquire exclusive digital tennis arenas on-chain.
                </p>
            </div>

            <div className="space-y-6">
                {/* Section 1: Minting */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wider">
                        Minting Area
                    </h3>

                    <button
                        className="w-full py-3.5 rounded-xl text-white font-bold transition-all relative overflow-hidden bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none shadow-md cursor-pointer disabled:cursor-not-allowed"
                        onClick={handleMintCourt}
                        disabled={isMintPending || isMintConfirming}
                    >
                        {getMintButtonContent()}
                    </button>

                    {lastMintedTokenId && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col items-center justify-center animate-fade-in">
                            <p className="text-sm text-emerald-800 font-medium text-center">
                                🎉 Court successfully built!
                            </p>
                            <span className="text-xs bg-emerald-200/60 text-emerald-900 px-2.5 py-0.5 rounded-full mt-1.5 font-bold">
                                {lastMintedTokenId}
                            </span>
                        </div>
                    )}
                </div>

                {/* Section 2: View Court Metadata */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wider">
                        Inspect Court Address
                    </h3>

                    <div className="mb-4">
                        <InputForm
                            label="Token ID"
                            placeholder="e.g. 0, 1, 2"
                            value={tokenId}
                            onChange={e => setTokenId(e.target.value)}
                        />
                    </div>

                    {nftImageUrl && (
                        <div className="mt-4 border border-zinc-100 bg-zinc-50 rounded-xl p-3 flex flex-col items-center">
                            <div className="overflow-hidden rounded-lg bg-white border border-zinc-200 shadow-inner w-full max-h-72 flex justify-center items-center">
                                <img
                                    src={nftImageUrl}
                                    alt={`Court #${tokenId}`}
                                    className="w-full h-auto max-h-72 object-contain p-2"
                                />
                            </div>
                            <span className="text-xs font-bold text-zinc-600 tracking-wide mt-3 bg-zinc-200 px-3 py-1 rounded-full">
                                Grand Slam Court #{tokenId}
                            </span>
                        </div>
                    )}

                    {tokenURIError && tokenId && (
                        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                            <p className="text-xs text-rose-700 font-medium">
                                ❌ Error: This specific Court ID has not been generated yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
