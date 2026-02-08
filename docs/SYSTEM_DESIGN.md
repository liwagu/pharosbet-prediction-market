# Prediction Market: System Design

## 1. High-Level Architecture

The decentralized prediction market will be a web-based application that interacts with a set of smart contracts deployed on the Pharos blockchain. The architecture is designed to be modular and extensible, allowing for future improvements and the addition of new features.

```mermaid
graph TD
    subgraph Frontend
        A[React App] --> B{ethers.js};
    end

    subgraph Blockchain (Pharos)
        C[PredictionMarketFactory] --> D[PredictionMarket];
        D --> E[ConditionalTokens];
        D --> F[AMM];
        G[Oracle] --> D;
    end

    B --> C;
    B --> D;
    B --> G;

    H[User] --> A;
```

## 2. Core Components

### 2.1. Smart Contracts

The backend logic of the prediction market will be implemented as a set of Solidity smart contracts. These contracts will be deployed to the Pharos testnet.

| Contract | Description |
| :--- | :--- |
| **`PredictionMarketFactory`** | A factory contract responsible for creating and deploying new `PredictionMarket` contracts. This contract will serve as a registry for all prediction markets on the platform. |
| **`PredictionMarket`** | The main contract for each individual prediction market. It will manage the market's lifecycle, including trading, liquidity provision, and settlement. It will hold the collateral and interact with the `AMM` and `Oracle` contracts. |
| **`ConditionalTokens`** | A simplified implementation of conditional tokens. For each market, two new ERC20 tokens will be created: one representing a "YES" outcome and another representing a "NO" outcome. These tokens will be minted against a collateral (e.g., USDC) and will be redeemable for the collateral if the corresponding outcome is the winning one. |
| **`AMM`** | An Automated Market Maker contract that provides liquidity for the conditional tokens. For the MVP, a simple constant product AMM (similar to Uniswap v1) will be used. This will allow users to trade the "YES" and "NO" tokens without needing a direct counterparty. |
| **`Oracle`** | A simple oracle contract that will be used to report the outcome of a prediction market. For the hackathon MVP, this will be a centralized oracle where a designated admin account can set the outcome. The contract will be designed to be upgradeable to support decentralized oracles in the future. |

### 2.2. Frontend

The frontend will be a single-page application (SPA) built using the following technologies:

*   **React:** A popular JavaScript library for building user interfaces.
*   **Vite:** A fast and modern build tool for web development.
*   **TypeScript:** A typed superset of JavaScript that enhances code quality and maintainability.
*   **TailwindCSS:** A utility-first CSS framework for rapid UI development.
*   **ethers.js:** A JavaScript library for interacting with the Ethereum blockchain and smart contracts.

## 3. Extensibility and Future Features

The initial implementation will focus on the core features required for the hackathon. However, the system is designed with extensibility in mind. The following are some potential future enhancements:

*   **Decentralized Oracles:** Replace the centralized oracle with a more secure and trustless solution like Chainlink or UMA.
*   **Advanced AMMs:** Implement more sophisticated AMM models to improve liquidity and reduce slippage.
*   **Governance:** Introduce a decentralized autonomous organization (DAO) to allow the community to govern the platform.
*   **Social Integrations:** Enhance the social sharing features with deeper integrations with social media platforms.
