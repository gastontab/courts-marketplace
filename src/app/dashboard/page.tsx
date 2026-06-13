"use client"

import SellerDashboard from "@/components/ListNftForm"

export default function DashboardPage() {
    return (
        <div className="min-h-[calc(100vh-75px)] bg-zinc-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl mb-6">
                <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                    Seller Dashboard
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Manage your active listings, parameters setup, and protocol earnings withdraw
                    allocations.
                </p>
            </div>
            <SellerDashboard />
        </div>
    )
}
