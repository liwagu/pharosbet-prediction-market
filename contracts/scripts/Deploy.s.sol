// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Deploy Script for PharosBet Prediction Market
 * @notice Deploy to Pharos Testnet using Foundry
 * 
 * Usage:
 *   forge script contracts/scripts/Deploy.s.sol:DeployScript \
 *     --rpc-url https://testnet.dplabs-internal.com \
 *     --broadcast \
 *     --private-key $PRIVATE_KEY
 * 
 * Pharos Testnet:
 *   Chain ID: 688888
 *   RPC: https://testnet.dplabs-internal.com
 *   Explorer: https://testnet.pharosscan.xyz
 *   Faucet: https://faucet.pharosnetwork.xyz
 */

import "../src/PredictionMarketFactory.sol";
import "../src/SimpleOracle.sol";

// Note: This uses Foundry's Script base. 
// If not using Foundry, deploy via Hardhat or manual ethers.js script.

/*
 * Manual deployment steps (using ethers.js):
 * 
 * 1. Deploy SimpleOracle with requiredConfirmations = 1
 * 2. Deploy PredictionMarketFactory with oracle address
 * 3. Verify contracts on Pharos explorer
 * 
 * See deploy.mjs for the ethers.js deployment script
 */
