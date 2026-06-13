"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { anvil, sepolia } from "wagmi/chains"

export default getDefaultConfig({
    appName: "NFT Marketplace",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [anvil, sepolia],
    ssr: true,
})
