import formatPrice from "../utils/formatPrice"

interface MarketplaceActivityTableProps {
    activity: any[]
}

export default function MarketplaceActivityTable({ activity }: MarketplaceActivityTableProps) {
    return (
        <div className="pt-2">
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-3">
                Marketplace Activity Ledger ({activity.length})
            </h3>
            {activity.length === 0 ? (
                <p className="text-sm text-zinc-400 bg-zinc-50 rounded-xl p-4 text-center border border-dashed border-zinc-200">
                    No deactivated or sold court logs registered.
                </p>
            ) : (
                <div className="overflow-x-auto border border-zinc-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Event</th>
                                <th className="py-3 px-4">Token ID</th>
                                <th className="py-3 px-4">Court Address</th>
                                <th className="py-3 px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-sm">
                            {activity.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                    {/* COLUMN 1: EVENT WITH ICON */}
                                    <td className="py-3 px-4 font-medium">
                                        {item.type === "LISTED" && (
                                            <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-semibold">
                                                🏷️ Listed
                                            </span>
                                        )}

                                        {item.type === "UPDATED" && (
                                            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-semibold">
                                                ✏️ Updated
                                            </span>
                                        )}

                                        {item.type === "CANCELED" && (
                                            <span className="inline-flex items-center gap-1.5 text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md text-xs font-semibold">
                                                ❌ Canceled
                                            </span>
                                        )}

                                        {item.type === "SOLD" && (
                                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-semibold">
                                                💰 Sold
                                            </span>
                                        )}

                                        {item.type === "PURCHASED" && (
                                            <span className="inline-flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-xs font-semibold">
                                                🛒 Bought
                                            </span>
                                        )}
                                    </td>

                                    {/* COLUMN 2: TOKEN ID */}
                                    <td className="py-3 px-4 text-zinc-900 font-mono font-semibold">
                                        #{item.tokenId}
                                    </td>

                                    {/* COLUMN 3: CONTRACT (ABRIDGED) */}
                                    <td className="py-3 px-4 text-zinc-500 font-mono text-xs">
                                        {item.nftAddress.slice(0, 6)}...
                                        {item.nftAddress.slice(-4)}
                                    </td>

                                    {/* COLUMN 4: SUPPLEMENTARY STATEMENT */}
                                    <td className="py-3 px-4 text-right text-xs text-zinc-500 font-medium">
                                        {item.type === "LISTED" &&
                                            `Listed for ${formatPrice(item.price)}`}

                                        {item.type === "UPDATED" &&
                                            `Updated to ${formatPrice(item.newPrice)}`}

                                        {item.type === "CANCELED" && "Listing canceled"}

                                        {item.type === "SOLD" &&
                                            `Sold to ${item.buyer.slice(0, 6)}...${item.buyer.slice(-4)}`}

                                        {item.type === "PURCHASED" &&
                                            `Bought from ${item.seller.slice(0, 6)}...${item.seller.slice(-4)}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
