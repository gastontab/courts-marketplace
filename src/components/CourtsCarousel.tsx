import NFTBox from "@/components/NFTBox"
import { marketplaceAbi } from "@/constants"

type ListingOverride = { isListed: boolean; price: string | null }
type ActivityEntry = {
    type: string
    tokenId: string
    nftAddress?: string
    price?: string | null
    oldPrice?: string | null
    newPrice?: string | null
}

interface Props {
    inventory: any[]
    nftContractAddress: `0x${string}`
    marketplaceAddress: `0x${string}`
    refetchSellerHistory: () => void
    onOptimisticUpdate: (
        tokenId: string,
        override: ListingOverride,
        activityEntry?: ActivityEntry
    ) => void
}

export default function CourtsCarousel({
    inventory,
    nftContractAddress,
    marketplaceAddress,
    refetchSellerHistory,
    onOptimisticUpdate,
}: Props) {
    return (
        <div>
            <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-3">
                Court Inventory ({inventory.length})
            </h3>
            {inventory.length === 0 ? (
                <p className="text-sm text-zinc-400 bg-zinc-50 rounded-xl p-4 text-center border border-dashed border-zinc-200">
                    You don't have any courts actively listed right now.
                </p>
            ) : (
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-thin scrollbar-thumb-zinc-200">
                    {inventory.map((item: any, idx: number) => (
                        <div key={idx} className="w-52 flex-shrink-0 snap-start">
                            <NFTBox
                                tokenId={item.tokenId}
                                price={item.price}
                                contractAddress={nftContractAddress}
                                marketplaceAddress={marketplaceAddress}
                                marketplaceAbi={marketplaceAbi}
                                showControls={true}
                                isOwnedByUser={false}
                                isListed={item.isListed}
                                fromMyDashboard={true}
                                onActionSuccess={(action: {
                                    type: "UPDATED" | "CANCELED"
                                    newPrice?: string
                                }) => {
                                    refetchSellerHistory()

                                    if (action.type === "CANCELED") {
                                        onOptimisticUpdate(
                                            item.tokenId,
                                            { isListed: false, price: null },
                                            {
                                                type: "CANCELED",
                                                tokenId: item.tokenId,
                                                nftAddress: nftContractAddress,
                                            }
                                        )
                                    }

                                    if (action.type === "UPDATED" && action.newPrice) {
                                        onOptimisticUpdate(
                                            item.tokenId,
                                            { isListed: true, price: action.newPrice },
                                            {
                                                type: "UPDATED",
                                                tokenId: item.tokenId,
                                                nftAddress: nftContractAddress,
                                                oldPrice: item.price,
                                                newPrice: action.newPrice,
                                            }
                                        )
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
