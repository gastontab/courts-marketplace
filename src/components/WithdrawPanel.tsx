// src/components/WithdrawPanel.tsx
"use client"

import { useState, useEffect } from "react"
import { FaCoins, FaCheckCircle } from "react-icons/fa"
import { CgSpinner } from "react-icons/cg"

interface WithdrawPanelProps {
    proceeds: string
    handleWithdraw: () => void
    isWithdrawPending: boolean
    isWithdrawConfirming: boolean
    isWithdrawSuccess: boolean
}

export default function WithdrawPanel({
    proceeds,
    handleWithdraw,
    isWithdrawPending,
    isWithdrawConfirming,
    isWithdrawSuccess,
}: WithdrawPanelProps) {
    const [showSuccessMessage, setShowSuccessMessage] = useState(false)

    useEffect(() => {
        if (isWithdrawSuccess) {
            setShowSuccessMessage(true)
            const timer = setTimeout(() => setShowSuccessMessage(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [isWithdrawSuccess])

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm h-fit flex flex-col justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 text-zinc-950 font-bold mb-1">
                    <FaCoins className="text-emerald-600" />
                    <h2 className="text-lg tracking-tight">Escrow Balance</h2>
                </div>
                <p className="text-xs text-zinc-400">
                    Funds collected from your court sales available for immediate claim.
                </p>
            </div>

            <div className="my-2 bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Withdrawable Funds
                </span>
                <span className="text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
                    {proceeds} <span className="text-sm font-bold text-zinc-500">USDC</span>
                </span>
            </div>

            {showSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <FaCheckCircle className="flex-shrink-0 text-emerald-600" size={14} />
                    <span>Your earnings have been transferred to your wallet!</span>
                </div>
            )}

            <button
                onClick={handleWithdraw}
                disabled={Number(proceeds) <= 0 || isWithdrawPending || isWithdrawConfirming}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
                {isWithdrawPending || isWithdrawConfirming ? (
                    <>
                        <CgSpinner className="animate-spin" size={16} />
                        <span>Claiming Proceeds...</span>
                    </>
                ) : (
                    <span>Withdraw Earnings</span>
                )}
            </button>
        </div>
    )
}
