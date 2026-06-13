"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaGithub } from "react-icons/fa"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { useState } from "react"

export default function Header() {
    const pathname = usePathname()

    const linkStyle = (path: string) =>
        `text-sm font-medium transition-colors hover:text-zinc-900 ${
            pathname === path ? "text-zinc-900 font-semibold" : "text-zinc-500"
        }`

    return (
        <nav className="w-full bg-white border-b border-zinc-200 px-6 py-4 flex flex-row justify-between items-center min-h-[75px] sticky top-0 z-50 shadow-sm">
            {/* BRANDING & GITHUB */}
            <div className="flex items-center gap-6">
                <Link
                    href="/"
                    className="flex items-center gap-2.5 text-zinc-900 hover:opacity-90 transition-opacity"
                >
                    <Image
                        src="/tennis-ball.png"
                        alt="Grand Slam Courts Logo"
                        width={32}
                        height={32}
                    />
                    <h1 className="font-extrabold text-xl tracking-tight hidden sm:block">
                        GrandSlam<span className="text-emerald-600">Courts</span>
                    </h1>
                </Link>

                <a
                    href="https://github.com/gastontab/courts-marketplace"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors border border-zinc-200 hidden md:block"
                    title="View Source Code"
                >
                    <FaGithub className="h-4 w-4" />
                </a>
            </div>

            {/* NAVIGATION LINKS */}
            <div className="hidden md:flex items-center gap-6">
                <Link href="/" className={linkStyle("/")}>
                    Marketplace
                </Link>
                <Link href="/mint-court" className={linkStyle("/mint-court")}>
                    Mint Court
                </Link>
                <Link href="/dashboard" className={linkStyle("/dashboard")}>
                    Seller Dashboard
                </Link>
            </div>

            {/* WALLET CONNECTION */}
            <div className="flex items-center gap-4">
                <div className="md:hidden flex items-center gap-3 mr-2">
                    <Link
                        href="/mint-court"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-md font-medium transition-colors"
                    >
                        Mint
                    </Link>
                    <Link href="/dashboard" className="text-xs text-zinc-600 font-medium">
                        Dashboard
                    </Link>
                </div>

                <ConnectButton chainStatus="icon" showBalance={false} />
            </div>
        </nav>
    )
}
