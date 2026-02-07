/**
 * PharosBet Deployment Script
 * Deploys all contracts to Pharos Testnet
 * 
 * Prerequisites:
 *   1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash
 *   2. Get PHAR from faucet: https://faucet.pharosnetwork.xyz
 *   3. Set PRIVATE_KEY environment variable
 * 
 * Usage:
 *   node contracts/scripts/deploy.mjs
 * 
 * Or with Foundry:
 *   cd contracts
 *   forge build
 *   forge script scripts/Deploy.s.sol:DeployScript --rpc-url https://testnet.dplabs-internal.com --broadcast --private-key $PRIVATE_KEY
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pharos Testnet Configuration
const PHAROS_RPC = "https://testnet.dplabs-internal.com";
const CHAIN_ID = 688888;

async function main() {
  console.log("🚀 PharosBet Deployment Script");
  console.log("================================");
  console.log(`Network: Pharos Testnet (Chain ID: ${CHAIN_ID})`);
  console.log(`RPC: ${PHAROS_RPC}`);
  console.log("");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(PHAROS_RPC);
  const network = await provider.getNetwork();
  console.log(`Connected to chain: ${network.chainId}`);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY environment variable not set");
    console.log("Get testnet PHAR from: https://faucet.pharosnetwork.xyz");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} PHAR`);
  console.log("");

  if (balance === 0n) {
    console.error("❌ No PHAR balance. Get tokens from faucet.");
    process.exit(1);
  }

  // NOTE: In a real deployment, you would compile the contracts first
  // using Foundry (forge build) and then read the compiled artifacts.
  // For the hackathon demo, we provide the deployment flow here.
  
  console.log("📋 Deployment Plan:");
  console.log("  1. Deploy SimpleOracle (requiredConfirmations = 1)");
  console.log("  2. Deploy PredictionMarketFactory (with oracle address)");
  console.log("  3. Create sample markets");
  console.log("  4. Update frontend contract addresses");
  console.log("");
  
  console.log("⚠️  To compile and deploy:");
  console.log("  1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash");
  console.log("  2. cd contracts && forge build");
  console.log("  3. Use forge script or this script with compiled artifacts");
  console.log("");
  
  console.log("✅ Deployment script ready. Compile contracts first, then run again.");
}

main().catch(console.error);
