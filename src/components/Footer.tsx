export default function Footer() {
    return (
        <footer className="bg-white border-t border-zinc-200 py-6 mt-12">
            <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                    © 2026 Grand Slam Courts · Created by Gaston Taborda
                </p>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>Built with</span>
                    <span className="font-medium text-zinc-600">Next.js</span>
                    <span>•</span>
                    <span className="font-medium text-zinc-600">Wagmi</span>
                    <span>•</span>
                    <span className="font-medium text-zinc-600">RainbowKit</span>
                </div>
            </div>
        </footer>
    )
}
