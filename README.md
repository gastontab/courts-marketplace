# 🚀 Full-Stack Web3 NFT Marketplace

This is a production-ready, full-stack decentralized NFT Marketplace. It bridges on-chain smart contracts with a high-performance indexing layer and a modern React frontend.

Originally inspired by the Cyfrin Web3 course, this repository has been re-architected into a **pnpm hybrid monorepo** to optimize development, local testing, and real-world cloud deployment.

---

# 🏗️ Architecture & Project Structure

The project is structured with Next.js dominating the root directory, while backend services and smart contracts are isolated in dedicated subfolders:

```text
.
├── foundry/                  # Smart Contracts (Foundry framework)
├── marketplaceIndexer/       # Blockchain Indexing Layer (Rindexer)
├── src/                      # Next.js 15 Frontend Source Code
├── public/                   # Frontend static assets
├── package.json              # Main project dependencies & workspace configuration
├── pnpm-workspace.yaml       # Monorepo orchestration matrix
```

## Key Stack Components

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Web3 Connectors:** RainbowKit & Wagmi v2 (WalletConnect)
- **Smart Contracts:** Solidity, Foundry (Anvil for local node testing)
- **Indexing Layer:** Rindexer (Rust-powered framework) utilizing PostgreSQL

---

# ⚙️ Prerequisites & Installation

Make sure you have the following installed on your machine:

- Node.js (v18+ or v22+ recommended)
- pnpm (v9+)
- Foundry / Anvil
- Docker Desktop (for running local PostgreSQL and Rindexer)

## Setup

Clone the repository and install all workspace dependencies:

```bash
git clone <your-repository-url>
cd ts-nft-marketplace-cu
pnpm install
```

---

# 🔧 Environment Variables Configuration

## 1. Frontend Configuration (`/.env.local`)

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_INDEXER_URL=http://localhost:3001/graphql
```

### Variables

- **NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID**  
  Obtain from WalletConnect Cloud. Required for production builds.

- **NEXT_PUBLIC_INDEXER_URL**  
  Points to your indexing API (localhost during development, Railway URL in production).

---

## 2. Indexer Configuration (`/marketplaceIndexer/.env`)

Create a `.env` file inside the `marketplaceIndexer` directory:

```env
DATABASE_URL=postgresql://postgres:rindexer@localhost:5440/postgres
POSTGRES_PASSWORD=rindexer
```

---

# 💻 Local Development Workflow

To run the full-stack ecosystem locally, you need three processes running in parallel.

## 1. Start the Local Ethereum Node (Anvil)

Spins up a local testnet pre-loaded with test accounts and contracts.

```bash
pnpm anvil
```

---

## 2. Launch PostgreSQL & Rindexer

Starts the Docker container containing PostgreSQL and launches Rindexer.

```bash
pnpm indexer
```

To completely reset the indexer and database state:

```bash
pnpm run reset-indexer
```

---

## 3. Run the Next.js Frontend

```bash
pnpm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🚀 Production Deployment Strategy

This project is designed around a decoupled cloud architecture.

## 🌐 Frontend (Vercel)

Deploy the Next.js application to Vercel.

### Configuration

- **Root Directory:** `.`
- **Build Command:** `next build`

### Required Environment Variables

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
NEXT_PUBLIC_INDEXER_URL=https://your-railway-domain.up.railway.app/graphql
```

---

## 🎛️ Indexing Backend (Railway)

The indexing service runs continuously on Railway and listens to Sepolia events.

### Railway Setup

- **Root Directory:** `marketplaceIndexer`
- PostgreSQL provisioned through Railway
- Rindexer connected to Railway PostgreSQL
- GraphQL endpoint exposed through Railway Networking

### GraphQL Endpoint Example

```text
https://your-railway-domain.up.railway.app/graphql
```

---

# 💎 Features Implemented

## Real-Time Event Indexing

Rindexer aggregates smart contract events and stores marketplace activity in PostgreSQL.

## NFT Minting & Trading

Full NFT lifecycle support:

- Minting
- Listing
- Buying
- Cancelling listings
- Updating listings


## Dynamic Wallet Connectivity

Supports:

- MetaMask
- Rainbow Wallet
- WalletConnect-compatible wallets

---

# 🛠️ Technology Stack

| Layer | Technology |
|---------|------------|
| Frontend | Next.js 15 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Smart Contracts | Solidity |
| Framework | Foundry |
| Wallets | RainbowKit + Wagmi |
| Indexer | Rindexer |
| Database | PostgreSQL |
| Hosting | Vercel + Railway |
| Network | Sepolia |

---

# 📄 License

This project is provided for educational and portfolio purposes.