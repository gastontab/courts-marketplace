import { useState } from "react"
import { FiCopy, FiCheck } from "react-icons/fi"

type FaucetSuccessModalProps = {
    isOpen: boolean
    onClose: () => void
    tokenAddress: string
}

export default function FaucetSuccessModal({
    isOpen,
    onClose,
    tokenAddress,
}: FaucetSuccessModalProps) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = async () => {
        await navigator.clipboard.writeText(tokenAddress)

        setCopied(true)

        setTimeout(() => {
            setCopied(false)
        }, 2000)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[500px] max-w-[90vw]">
                <h2 className="font-bold text-lg">🎉 Faucet Claimed Successfully</h2>

                <p className="mt-2 text-zinc-600">100 Test USDC were minted to your wallet.</p>

                <div className="mt-4">
                    <p className="text-sm font-medium">Token Address</p>

                    <div className="flex gap-2 mt-1">
                        <input
                            readOnly
                            value={tokenAddress}
                            className="flex-1 border rounded px-3 py-2 text-xs"
                        />

                        <button
                            onClick={handleCopy}
                            className="p-2 border rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
                            title={copied ? "Copied!" : "Copy address"}
                        >
                            {copied ? (
                                <FiCheck className="h-4 w-4 text-emerald-600" />
                            ) : (
                                <FiCopy className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-400 cursor-pointer"
                >
                    Continue
                </button>
            </div>
        </div>
    )
}
