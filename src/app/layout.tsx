import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { type ReactNode } from "react"
import { Providers } from "./providers"

export const metadata: Metadata = {
    title: "NftMarketplace",
    description: "A non-custodial marketplace for NFTs",
}

export default function RootLayout(props: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/nft-marketplace.png" sizes="any" />
            </head>
            <body className="bg-zinc-50">
                <Providers>
                    <div className="min-h-screen flex flex-col">
                        <Header />
                        <main className="flex-1">{props.children}</main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    )
}
