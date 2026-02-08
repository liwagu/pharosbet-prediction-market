# Paper Analysis: "Decentralized Prediction Market Without Arbiters" and Integration Plan for PharosBet

**Author:** Manus AI | **Date:** February 8, 2026

---

## 1. What the Paper Is About

The paper, authored by Iddo Bentov, Alex Mizrahi, and Meni Rosenfeld and published at the WTSC 2017 workshop (part of Financial Cryptography 2017) [1], presents a **fully decentralized prediction market that eliminates the need for trusted arbiters** to resolve event outcomes. This stands in contrast to existing approaches such as Augur (which uses reputation-based voting) and Polymarket (which relies on UMA's optimistic oracle), both of which still depend on some form of human arbitration.

The central insight of the paper is that **market forces alone can determine the outcome of an event**, provided the protocol supports a mechanism called **outcome-force** — a transaction type that allows holders of winning shares to convert them into spendable coins with an "encumbered history" tag, rather than waiting for an arbiter to declare a winner. The paper then uses cooperative game theory (specifically the **Shapley value** from glove games) to prove that this mechanism creates the correct economic incentives for honest price discovery.

---

## 2. The Three Core Mechanisms

The paper's prediction market is built on a Colored Coins variant where every asset takes the form **(amount, bet, history)**. Three special transaction types form the backbone of the entire system:

| Transaction | Operation | Purpose |
|---|---|---|
| **outcome-split** | `(amount, ⊥, h)` → `{(amount, Yes:eid, h), (amount, No:eid, h)}` | Create a prediction pair from collateral. Anyone can do this permissionlessly. |
| **outcome-combine** | `(amount, Yes:eid, h1)` + `(amount, No:eid, h2)` → `(amount, ⊥, h1∪h2)` | Redeem a matched YES+NO pair back to collateral. This enforces the conservation law: YES + NO always equals the original collateral. |
| **outcome-force** | `(amount, Yes:eid, h)` → `(amount, ⊥, h∪{Yes:eid})` | Force-convert winning shares to coins with an encumbered history tag. This is the key innovation that removes the need for arbiters. |

The **outcome-force** mechanism works as a deterrent. After an event resolves in the real world, holders of losing shares have two rational options: sell their now-worthless shares cheaply (allowing winners to do outcome-combine for clean coins), or hold out and demand unreasonable prices. The outcome-force option means winners can always bypass holdouts, creating strong pressure for losing-side holders to sell at fair prices.

> "The intuitive reason for supporting an outcome-force operation is that it serves as a deterrent against traders who would demand an excessive price for their losing shares, by offering an alternative that removes the dependence on such misbehaving traders." — Bentov et al. [1]

---

## 3. Game-Theoretic Analysis (Shapley Value)

The paper models the post-event settlement as a **cooperative glove game**, where YES shares are "left gloves" and NO shares are "right gloves." A complete pair (one left + one right) is worth 1 unit. The **Shapley value** determines the fair distribution of value among all players.

The key parameter is **p**, which represents the probability that encumbered coins (produced via outcome-force) will be accepted as payment by merchants and other participants. When p is close to 1, winning shares are worth nearly their full face value regardless of what losing-side holders do. When p is close to 0, the outcome-force option is weak, and losing-side holders have more bargaining power.

The paper also discovers a counterintuitive phenomenon: a player who holds a large concentrated position can sometimes **increase their total value by publicly burning some of their shares**, because the reduced supply increases the Shapley value of each remaining share. This has important implications for AMM design — it means concentrated liquidity positions can be strategically manipulated.

The practical conclusion is that **popular events with many distributed participants work best** in a fully decentralized PM, while obscure events with few participants may still benefit from semi-decentralized arbitration.

---

## 4. Extensions Proposed in the Paper

Beyond the core binary YES/NO mechanism, the paper proposes several extensions that significantly expand the types of financial instruments a prediction market can support:

| Extension | Description | Example |
|---|---|---|
| **Continuous Outcomes** (§4.1) | Events with percentage or numerical results, where shares are priced proportionally to the actual outcome. | "What % of votes will be in favor of staying in the EU?" — If 45% vote yes, Yes shares are worth 0.45 and No shares are worth 0.55. |
| **Non-binary Outcomes** (§4.2) | `outcome-split(N)` creates N outcome shares instead of just 2. Supports multi-way predictions. | "Which genre will dominate American Idol top 24: band, girl, boy, or other?" — 4-way split. |
| **Capped CFDs** (§4.3) | Contracts for Difference that let users bet on the future value of an asset, with capped risk. Uses vector CFDs with multiple price predictions. | "BTC will be at $75K, $100K, or $125K in 6 months" — each prediction gets weighted shares. |
| **Semi-decentralized Order Book** (Appendix A) | Real-time trading via a trusted third party using multisig + timelock, with periodic on-chain settlement. The TTP can prevent trades but cannot steal funds. | High-frequency trading on prediction shares with off-chain matching and on-chain settlement. |

---

## 5. How to Integrate These Features into PharosBet

The following table maps each paper concept to a concrete feature we can add to our PharosBet project, along with the implementation approach for Pharos Network (an EVM-compatible chain):

| Paper Concept | PharosBet Feature | Implementation on Pharos |
|---|---|---|
| **outcome-split / outcome-combine** | Already implemented as our CPMM AMM's `buyYes()` / `buyNo()` and `claimWinnings()`. The conservation law (YES + NO = collateral) is inherent in our AMM pool design. | No change needed — our existing `PredictionMarket.sol` already enforces this. |
| **outcome-force (arbiter-free resolution)** | **Decentralized Resolution via Market Consensus**: Add a new resolution mode where, after the event end time, if the price of one outcome is above a threshold (e.g., 95%) for a sustained period, the market auto-resolves without any oracle call. | Add a `marketResolve()` function that checks if the YES price has been above 0.95 (or below 0.05) for N consecutive blocks. If so, auto-resolve. This leverages Pharos's sub-second finality for rapid consensus. |
| **Non-binary Outcomes (N-way split)** | **Multi-Outcome Markets**: Support markets with 3+ outcomes (e.g., "Who will win the 2026 World Cup: Brazil, Germany, France, or Other?"). | Create a new `MultiOutcomeMarket.sol` contract with N outcome pools. Use a generalized CPMM where all N pools share a constant product invariant. Each outcome gets its own ERC-20 share token. |
| **Continuous Outcomes / CFDs** | **Scalar Markets**: Support numerical predictions (e.g., "What will BTC price be on Dec 31, 2026?") with a range [low, high]. Payout is proportional to where the actual value falls in the range. | Create a `ScalarMarket.sol` where shares represent positions on a numerical range. Long shares pay proportionally to how high the outcome is; Short shares pay inversely. Resolution requires an oracle to report the numerical value. |
| **Share burning game theory** | **Anti-manipulation safeguards**: Implement position limits or progressive fees for concentrated holders to prevent the Shapley value manipulation described in the paper. | Add a `maxPositionPerAddress` parameter and/or implement a progressive fee curve where larger trades pay higher fees. This discourages the concentrated-holder burning attack. |
| **Semi-decentralized Order Book** | **Hybrid AMM + Limit Orders**: Complement our CPMM with a limit order book for better price discovery on high-volume markets. | Add an `OrderBook.sol` contract that sits alongside the AMM. Users can place limit orders; when a market order comes in, it checks both the AMM price and the order book to find the best execution. Pharos's low latency makes this viable. |

---

## 6. Recommended Implementation Priority

Given the hackathon context and the goal of impressing judges with innovation, the following priority order is recommended:

**Priority 1 — Decentralized Resolution (outcome-force concept)**. This is the paper's most novel contribution and directly addresses the hackathon requirement for oracle integration. By implementing a market-consensus resolution mechanism alongside our existing SimpleOracle, we demonstrate that PharosBet can resolve markets **without any trusted third party** when market consensus is strong enough. This is a significant differentiator from Polymarket.

**Priority 2 — Multi-Outcome Markets (N-way split)**. This dramatically expands the types of predictions users can make. Sports events, elections with multiple candidates, and categorical predictions all become possible. This directly addresses the hackathon's "more complex prediction logic" bonus criterion.

**Priority 3 — Scalar/Continuous Markets (CFDs)**. This enables numerical predictions like "What will ETH price be?" and is a natural extension of multi-outcome markets. It showcases Pharos's ability to handle more complex on-chain computation.

**Priority 4 — Hybrid Order Book**. This is the most complex to implement but would demonstrate Pharos's low-latency advantage most clearly. It could be presented as a "future roadmap" item with a basic proof-of-concept.

---

## 7. Concrete Smart Contract Sketch: Market-Consensus Resolution

The following is a conceptual sketch of how the outcome-force concept translates to a Solidity function on Pharos:

```solidity
// In PredictionMarket.sol — add alongside existing oracle resolution

uint256 public constant CONSENSUS_THRESHOLD = 95; // 95% price threshold
uint256 public constant CONSENSUS_BLOCKS = 100;   // ~100 blocks sustained
uint256 public consensusStartBlock;
bool public consensusResolutionEnabled;

/**
 * @notice Check if market can self-resolve via price consensus
 * @dev If YES price > 95% for 100 consecutive blocks, resolve as YES
 *      If NO price > 95% for 100 consecutive blocks, resolve as NO
 *      This implements the "outcome-force" concept from Bentov et al.
 */
function checkMarketConsensus() external {
    require(block.timestamp >= endTime, "Market not ended");
    require(status == Status.Active, "Already resolved");
    
    uint256 yesPrice = getYesPrice(); // Returns 0-100
    
    if (yesPrice >= CONSENSUS_THRESHOLD || yesPrice <= (100 - CONSENSUS_THRESHOLD)) {
        if (consensusStartBlock == 0) {
            consensusStartBlock = block.number;
        } else if (block.number >= consensusStartBlock + CONSENSUS_BLOCKS) {
            // Consensus achieved — auto-resolve
            Outcome result = yesPrice >= CONSENSUS_THRESHOLD ? Outcome.Yes : Outcome.No;
            _resolve(result);
            consensusResolutionEnabled = true;
        }
    } else {
        consensusStartBlock = 0; // Reset if price drops below threshold
    }
}
```

This mechanism works because after an event's real-world outcome becomes known, rational traders will buy the winning side and sell the losing side, pushing the price to an extreme. If the price stays extreme for long enough, the market self-resolves. The oracle is only needed as a fallback for cases where market consensus is ambiguous.

---

## 8. Summary

The Bentov et al. paper provides a rigorous theoretical foundation for building prediction markets that are **more decentralized than Polymarket**. Its key innovation — the outcome-force mechanism that enables arbiter-free resolution through market consensus — can be adapted to our EVM-based PharosBet project as a complementary resolution mechanism alongside our existing oracle. The paper's extensions to multi-outcome markets, continuous outcomes, and CFDs provide a clear roadmap for expanding PharosBet's capabilities beyond simple binary YES/NO predictions, which directly addresses the Pharos hackathon's bonus criterion of "more complex prediction logic."

---

## References

[1]: Bentov, I., Mizrahi, A., Rosenfeld, M. (2017). "Decentralized Prediction Market Without Arbiters." In: Brenner, M., et al. (Eds.) Financial Cryptography and Data Security. FC 2017 Workshops, LNCS 10323, pp. 199–217. Springer. https://doi.org/10.1007/978-3-319-70278-0_13
