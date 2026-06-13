"use client"

import MintCourtForm from "@/components/MintCourt"
import { useAccount, useChainId } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { GiTennisCourt } from "react-icons/gi"
import { chainsToContracts } from "@/constants"

export default function MintCourtPage() {
    const account = useAccount()
    const chainId = useChainId()

    const isChainSupported =
        chainId in chainsToContracts && chainsToContracts[chainId]?.courtNft !== undefined

    return (
        <div className="min-h-[calc(100vh-75px)] bg-zinc-50 flex flex-col justify-between">
            <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
                <div className="max-w-xl w-full">
                    {/* CASE 1: WALLET NOT CONNECTED */}
                    {!account.isConnected ? (
                        <div className="p-8 bg-white rounded-2xl shadow-xl border border-zinc-200 text-center flex flex-col items-center">
                            <div className="p-4 bg-zinc-100 rounded-full text-zinc-700 mb-4">
                                <GiTennisCourt size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-2">
                                Access the Club House
                            </h2>
                            <p className="text-sm text-zinc-500 max-w-sm mb-6">
                                Connect your decentralized wallet to build, view, and manage your
                                Grand Slam Court NFTs.
                            </p>
                            <ConnectButton data-testid="connect-button" />
                        </div>
                    ) : /* CASE 2: UNSUPPORTED NETWORK */
                    !isChainSupported ? (
                        <div className="p-8 bg-white rounded-2xl shadow-xl border border-rose-200 text-center flex flex-col items-center">
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-full mb-4">
                                ⚠️
                            </div>
                            <h2 className="text-xl font-bold text-rose-900 mb-2">
                                Unsupported Network
                            </h2>
                            <p className="text-sm text-rose-600/80 max-w-sm mb-6">
                                Your wallet is on a network not currently serving our courts.
                                Please switch via your provider.
                            </p>
                            <ConnectButton />
                        </div>
                    ) : (
                        /* CASE 3: ALL GOOD - SHOW MINT FORM */
                        <MintCourtForm />
                    )}
                </div>
            </main>
        </div>
    )
}
