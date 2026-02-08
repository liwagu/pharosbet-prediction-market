/**
 * PharosBet Demo Simulator
 * Simulates multiple users trading YES/NO on a prediction market
 *
 * Usage:
 *   PRIVATE_KEY=0x... MARKET=0x... node scripts/simulate.mjs
 *
 * Optional env vars:
 *   USERS=15          Number of simulated users (default: 15)
 *   FUND_AMOUNT=2     PHAR to fund each user wallet (default: 2)
 *   MIN_BET=0.01      Minimum bet size in PHAR (default: 0.01)
 *   MAX_BET=0.5       Maximum bet size in PHAR (default: 0.5)
 *   DELAY_MS=2000     Delay between trades in ms (default: 2000)
 *   YES_BIAS=0.6      Probability of buying YES, 0-1 (default: 0.6)
 */

import { ethers } from "ethers";

const PHAROS_RPC = "https://atlantic.dplabs-internal.com";

const MARKET_ABI = [
  "function buyYes() external payable",
  "function buyNo() external payable",
  "function getYesPrice() external view returns (uint256)",
  "function getNoPrice() external view returns (uint256)",
  "function totalVolume() external view returns (uint256)",
  "function participantCount() external view returns (uint256)",
  "function question() external view returns (string)",
];

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const marketAddr = process.env.MARKET;
  if (!privateKey || !marketAddr) {
    console.error("Usage: PRIVATE_KEY=0x... MARKET=0x... node scripts/simulate.mjs");
    process.exit(1);
  }

  const numUsers = parseInt(process.env.USERS || "15");
  const fundAmount = ethers.parseEther(process.env.FUND_AMOUNT || "2");
  const minBet = parseFloat(process.env.MIN_BET || "0.01");
  const maxBet = parseFloat(process.env.MAX_BET || "0.5");
  const delayMs = parseInt(process.env.DELAY_MS || "2000");
  const yesBias = parseFloat(process.env.YES_BIAS || "0.6");

  const provider = new ethers.JsonRpcProvider(PHAROS_RPC);
  const deployer = new ethers.Wallet(privateKey, provider);

  const market = new ethers.Contract(marketAddr, MARKET_ABI, provider);
  const question = await market.question();
  console.log(`Market: "${question}"`);
  console.log(`Initial price — YES: ${await market.getYesPrice()}% | NO: ${await market.getNoPrice()}%\n`);

  // Step 1: Generate random wallets
  console.log(`Generating ${numUsers} simulated user wallets...`);
  const users = Array.from({ length: numUsers }, () => ethers.Wallet.createRandom(provider).connect(provider));

  // Step 2: Fund all wallets from deployer
  console.log(`Funding each wallet with ${ethers.formatEther(fundAmount)} PHAR...`);
  const fundNonce = await provider.getTransactionCount(deployer.address);
  const fundTxs = users.map((user, i) =>
    deployer.sendTransaction({
      to: user.address,
      value: fundAmount,
      nonce: fundNonce + i,
    })
  );
  const fundReceipts = await Promise.all(fundTxs);
  await Promise.all(fundReceipts.map((tx) => tx.wait()));
  console.log(`Funded ${numUsers} wallets.\n`);

  // Step 3: Simulate trades
  console.log("Starting simulated trades...\n");
  console.log("User # | Side | Amount (PHAR) | YES Price | NO Price");
  console.log("-------|------|---------------|-----------|--------");

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const isYes = Math.random() < yesBias;
    const amount = ethers.parseEther((minBet + Math.random() * (maxBet - minBet)).toFixed(4));
    const marketWithSigner = market.connect(user);

    try {
      const tx = isYes
        ? await marketWithSigner.buyYes({ value: amount })
        : await marketWithSigner.buyNo({ value: amount });
      await tx.wait();

      const yesPrice = await market.getYesPrice();
      const noPrice = await market.getNoPrice();
      const side = isYes ? "YES" : "NO ";
      console.log(
        `  ${String(i + 1).padStart(3)}   | ${side}  | ${ethers.formatEther(amount).padStart(13)} | ${String(yesPrice).padStart(8)}% | ${String(noPrice).padStart(6)}%`
      );
    } catch (e) {
      console.log(`  ${String(i + 1).padStart(3)}   | FAIL | ${e.message.slice(0, 40)}`);
    }

    if (i < users.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  // Summary
  const volume = await market.totalVolume();
  const participants = await market.participantCount();
  const yesPrice = await market.getYesPrice();
  const noPrice = await market.getNoPrice();

  console.log("\n========== SIMULATION COMPLETE ==========");
  console.log(`Total participants: ${participants}`);
  console.log(`Total volume: ${ethers.formatEther(volume)} PHAR`);
  console.log(`Final price — YES: ${yesPrice}% | NO: ${noPrice}%`);
}

main().catch(console.error);
