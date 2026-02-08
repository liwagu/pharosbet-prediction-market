/**
 * PharosBet Deployment Script
 * Deploys all contracts to Pharos Testnet using Foundry artifacts
 *
 * Prerequisites:
 *   1. cd contracts && forge build
 *   2. Set PRIVATE_KEY env var
 *   3. Have PHAR tokens (faucet: https://faucet.pharosnetwork.xyz)
 *
 * Usage:
 *   PRIVATE_KEY=0x... node contracts/scripts/deploy.mjs
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHAROS_RPC = "https://atlantic.dplabs-internal.com";

function loadArtifact(name) {
  const p = path.join(__dirname, "..", "out", `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(p)) {
    console.error(`Artifact not found: ${p}`);
    console.error("Run: cd contracts && forge build");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Set PRIVATE_KEY env var");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(PHAROS_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} PHAR\n`);

  // 1. Deploy SimpleOracle (requiredConfirmations = 1)
  console.log("Deploying SimpleOracle...");
  const oracleArt = loadArtifact("SimpleOracle");
  const OracleFactory = new ethers.ContractFactory(oracleArt.abi, oracleArt.bytecode.object, wallet);
  const oracle = await OracleFactory.deploy(1);
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  console.log(`SimpleOracle deployed: ${oracleAddr}`);

  // 2. Deploy PredictionMarketFactory
  console.log("Deploying PredictionMarketFactory...");
  const factoryArt = loadArtifact("PredictionMarketFactory");
  const FactoryFactory = new ethers.ContractFactory(factoryArt.abi, factoryArt.bytecode.object, wallet);
  const factory = await FactoryFactory.deploy(oracleAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log(`PredictionMarketFactory deployed: ${factoryAddr}`);

  // 3. Create a sample market
  console.log("\nCreating sample market...");
  const endTime = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // 7 days
  const tx = await factory.createMarket(
    "Will BTC exceed $150,000 by end of 2026?",
    "Resolves YES if Bitcoin price exceeds $150,000 USD on any major exchange before Dec 31 2026.",
    "crypto",
    endTime
  );
  const receipt = await tx.wait();
  const marketEvent = receipt.logs.find((l) => {
    try {
      return factory.interface.parseLog(l)?.name === "MarketCreated";
    } catch {
      return false;
    }
  });
  const marketAddr = marketEvent
    ? factory.interface.parseLog(marketEvent).args.marketAddress
    : "check explorer";
  console.log(`Sample market created: ${marketAddr}`);

  // Summary
  console.log("\n========== DEPLOYMENT COMPLETE ==========");
  console.log(`ORACLE_ADDRESS=${oracleAddr}`);
  console.log(`FACTORY_ADDRESS=${factoryAddr}`);
  console.log(`SAMPLE_MARKET=${marketAddr}`);
  console.log("\nUpdate client/src/lib/contracts.ts with these addresses.");
}

main().catch(console.error);
