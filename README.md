# PharosBet — Decentralized Prediction Market

A Polymarket-style decentralized prediction market built on **Pharos Network** for the Pharos Hackathon. Users can create binary prediction markets, trade YES/NO outcome shares via an automated market maker (AMM), and earn rewards when their predictions are correct.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Market   │  │  Trading │  │  Create  │  │  Social ││
│  │  Feed     │  │  Panel   │  │  Market  │  │  Share  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                    │ ethers.js                           │
├────────────────────┼────────────────────────────────────┤
│              Pharos Network (L1)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PredictionMarketFactory                          │  │
│  │  ├── createMarket()                               │  │
│  │  ├── getMarkets()                                 │  │
│  │  └── Registry of all deployed markets             │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  PredictionMarket (per market)                    │  │
│  │  ├── buyYes() / buyNo()     ← CPMM AMM           │  │
│  │  ├── sellYes() / sellNo()                         │  │
│  │  ├── claimWinnings()                              │  │
│  │  └── getYesPrice() / getNoPrice()                 │  │
│  ├──────────────────────────────────────────────────┤  │
│  │  SimpleOracle                                     │  │
│  │  ├── reportOutcome()                              │  │
│  │  ├── finalizeResolution()                         │  │
│  │  └── Multi-sig + dispute period                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite + TailwindCSS 4 | Web2-level UX with dark theme |
| Blockchain | Solidity ^0.8.20 | Smart contracts for market logic |
| Network | Pharos Testnet (Chain ID: 688888) | High-performance L1 with sub-second finality |
| Wallet | ethers.js v6 + MetaMask | Wallet connection and transaction signing |
| AMM | Constant Product Market Maker (CPMM) | Automated pricing: x * y = k |
| Oracle | SimpleOracle (multi-sig) | Market resolution with dispute period |
| Tooling | Foundry | Smart contract compilation and deployment |

## Project Structure

```
prediction-market/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Market feed + hero + trending sidebar
│   │   │   ├── MarketDetail.tsx # Trading interface + market info
│   │   │   └── CreateMarket.tsx # Market creation form
│   │   ├── components/
│   │   │   ├── Navbar.tsx     # Navigation + wallet connection
│   │   │   ├── MarketCard.tsx # Prediction card with probability bar
│   │   │   ├── ShareModal.tsx # Social sharing dialog
│   │   │   └── Footer.tsx     # Site footer
│   │   ├── contexts/
│   │   │   ├── Web3Context.tsx    # Wallet + blockchain state
│   │   │   └── MarketsContext.tsx  # Market data management
│   │   └── lib/
│   │       ├── contracts.ts   # ABIs + contract addresses
│   │       └── social.ts      # Social sharing utilities
│   └── index.html
├── contracts/                 # Solidity smart contracts
│   ├── src/
│   │   ├── PredictionMarket.sol       # Core market with CPMM AMM
│   │   ├── PredictionMarketFactory.sol # Factory + registry
│   │   └── SimpleOracle.sol           # Oracle for resolution
│   ├── scripts/
│   │   ├── Deploy.s.sol       # Foundry deploy script
│   │   └── deploy.mjs         # ethers.js deploy script
│   └── foundry.toml           # Foundry configuration
└── README.md
```

## Smart Contract Design

### PredictionMarketFactory
The factory contract serves as the entry point for the protocol. It deploys individual `PredictionMarket` contracts and maintains a registry of all markets. Anyone can create a market permissionlessly.

### PredictionMarket (with CPMM AMM)
Each market is an independent contract with a built-in Constant Product Market Maker. The AMM uses the formula `x * y = k` where `x` and `y` represent the YES and NO token pools respectively. This ensures continuous liquidity and automatic price discovery based on supply and demand.

Key trading mechanics:
- **Buy YES**: Send PHAR to receive YES shares. Price increases as more YES shares are bought.
- **Buy NO**: Send PHAR to receive NO shares. Price increases as more NO shares are bought.
- **Sell**: Return shares to the AMM and receive PHAR back.
- **Claim**: After resolution, winning share holders redeem from the prize pool.
- **Fee**: 2% trading fee on each transaction.

### SimpleOracle
A multi-signature oracle system where designated reporters vote on market outcomes. Features include a dispute period (1 hour) before finalization, and an emergency resolution function for the admin.

## Pharos Network Integration

PharosBet is specifically designed for Pharos Network to leverage:

| Feature | Benefit for Prediction Markets |
|---------|-------------------------------|
| Sub-second finality | Instant trade confirmation — feels like Web2 |
| High throughput | Handle many concurrent trades without congestion |
| Low gas costs | Micro-trades become economically viable |
| EVM compatibility | Standard Solidity tooling (Foundry, ethers.js) |

**Network Configuration:**
- Chain ID: `688888`
- RPC: `https://testnet.dplabs-internal.com`
- Explorer: `https://testnet.pharosscan.xyz`
- Faucet: `https://faucet.pharosnetwork.xyz`

## Social Sharing (Viral Growth)

The social sharing system is designed for viral growth and user acquisition:

1. **Prediction Posters**: Canvas-based image generation creates shareable prediction cards with market data, probability bars, and branding. Users can download and share these on any platform.

2. **One-Click Social Sharing**: Native integration with Twitter/X, Telegram, and WhatsApp with pre-formatted messages that include market question, current odds, and a direct link.

3. **Web Share API**: On mobile devices, uses the native share sheet for maximum reach across all installed apps.

4. **Referral Links**: Each share includes a referral parameter that tracks user acquisition for potential reward programs.

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask wallet
- PHAR tokens from [Pharos Faucet](https://faucet.pharosnetwork.xyz)

### Frontend Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Smart Contract Development
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile contracts
cd contracts
forge build

# Deploy to Pharos Testnet
forge script scripts/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet.dplabs-internal.com \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### Add Pharos Testnet to MetaMask
1. Open MetaMask → Settings → Networks → Add Network
2. Network Name: `Pharos Testnet`
3. RPC URL: `https://testnet.dplabs-internal.com`
4. Chain ID: `688888`
5. Currency Symbol: `PHAR`
6. Explorer: `https://testnet.pharosscan.xyz`

## Functional Requirements

| Requirement | Status | Description |
|------------|--------|-------------|
| Market Creation | ✅ | Users create YES/NO prediction markets with end date and resolution criteria |
| Trading (AMM) | ✅ | Buy/sell YES and NO shares via Constant Product Market Maker |
| Settlement | ✅ | Oracle resolves markets; winners claim from prize pool |
| Oracle Integration | ✅ | Multi-sig oracle with dispute period |
| Social Sharing | ✅ | Poster generation, Twitter/Telegram/WhatsApp sharing |
| Wallet Connection | ✅ | MetaMask integration with Pharos Network |

## Non-Functional Requirements

| Requirement | Approach |
|------------|----------|
| Web2-level UX | Dark theme, instant feedback, animated transitions, mobile-first |
| Scalability | Factory pattern — each market is independent contract |
| Security | 2% fee, dispute period, admin emergency controls |
| Performance | Leverages Pharos sub-second finality for instant trades |

## Extension Roadmap

The following features are designed for future expansion:

1. **Conditional Token Framework (CTF)**: ERC-1155 based outcome tokens for composability with DeFi
2. **Order Book Hybrid**: Combine AMM with limit orders for better price discovery on high-volume markets
3. **Multi-Outcome Markets**: Support 3+ outcomes (e.g., "Which team wins the World Cup?")
4. **Liquidity Mining**: Reward LPs who provide liquidity to market AMMs
5. **Governance Token**: DAO governance for protocol parameters and oracle disputes
6. **Cross-Chain Oracle**: Integrate Chainlink/Pyth for automated resolution
7. **AI-Powered Market Suggestions**: Use LLMs to suggest trending topics for new markets
8. **Leaderboard & Reputation**: Track prediction accuracy for social proof

## License

MIT
