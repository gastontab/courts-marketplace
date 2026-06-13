"use client"

import { useAccount } from "wagmi"
import RecentlyListedNFTs from "@/components/RecentlyListed"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function Home() {
    const { isConnected } = useAccount()

    return (
        <main className="bg-zinc-50">
            {!isConnected ? (
                <div className="flex flex-col items-center justify-center py-32 px-4 text-center max-w-md mx-auto">
                    <span className="text-3xl mb-3">🎾</span>
                    <h2 className="text-xl font-bold text-zinc-900 mb-1">
                        Welcome to Grand Slam Market
                    </h2>
                    <p className="text-sm text-zinc-500 mb-6">
                        Connect your web3 cryptographic wallet to inspect live court listings and
                        active arena trading logs.
                    </p>
                    <ConnectButton />
                </div>
            ) : (
                <div className="w-full">
                    <RecentlyListedNFTs />
                </div>
            )}
        </main>
    )
}
