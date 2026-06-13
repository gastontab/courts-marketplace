import NFTBox from "@/components/NFTBox"
import { marketplaceAbi } from "@/constants"

interface Props {
    inventory: any[]
    nftContractAddress: `0x${string}`
    marketplaceAddress: `0x${string}`
    refetchSellerHistory: () => void
}

export default function CourtsCarousel({
    inventory,
    nftContractAddress,
    marketplaceAddress,
    refetchSellerHistory,
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
                                onActionSuccess={() => refetchSellerHistory()}
                                showControls={true}
                                isOwnedByUser={false}
                                isListed={item.isListed}
                                fromMyDashboard={true}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
