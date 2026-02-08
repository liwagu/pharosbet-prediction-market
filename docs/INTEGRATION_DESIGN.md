# PharosBet Integration Design: Arbiter-Free Resolution Mechanism

**Author:** Manus AI | **Date:** February 8, 2026  
**GitHub:** [github.com/liwagu/pharosbet-prediction-market](https://github.com/liwagu/pharosbet-prediction-market)

---

## 1. Executive Summary

This document specifies how to integrate the arbiter-free resolution mechanism from Bentov et al. [1] into the existing PharosBet prediction market. The integration introduces three new settlement pathways — **Market Consensus Resolution**, **Outcome-Force (forced redemption)**, and **Outcome-Combine (pair redemption)** — alongside the existing Oracle-based resolution. A key design constraint is that the UI must remain **simple and intuitive** ("Web2-level UX"), hiding the complexity of these mechanisms behind clear visual states and one-click actions.

The current system resolves markets exclusively through a single `resolve()` function callable only by the Oracle address. The new design introduces a **multi-path resolution state machine** where the market can be settled through any of four pathways, with the UI guiding users to the optimal action based on their position and the current market state.

---

## 2. Current System Architecture

The existing `PredictionMarket.sol` contract follows a linear lifecycle:

```
Active → (Oracle calls resolve()) → Resolved → (Users call claimWinnings())
```

The current data model in the frontend (`MarketsContext.tsx`) tracks markets with a `status` field that can be `"active"`, `"resolved"`, or `"expired"`, and a `resolution` field that stores `"yes"` or `"no"` after oracle settlement. The `MarketDetail.tsx` page shows either a trading panel (when active) or a static "resolved" badge (when settled).

The following table summarizes what exists today versus what needs to be added:

| Component | Current State | After Integration |
|---|---|---|
| **Market Status** | `Active → Resolved` (2 states) | `Active → Ended → ConsensusForming → Resolved` (4 states) |
| **Resolution Method** | Oracle-only (`resolve()`) | Oracle + Market Consensus + Outcome-Force + Outcome-Combine |
| **User Actions Post-Expiry** | Wait for oracle, then `claimWinnings()` | Choose from 4 settlement paths with guided UI |
| **Share Tracking** | `yesShares[addr]`, `noShares[addr]` | Same, plus `encumberedCoins[addr]` for outcome-force |
| **Frontend Resolution UI** | Static "Resolved: YES/NO" badge | Interactive resolution dashboard with progress indicators |

---

## 3. Smart Contract Changes

### 3.1 New State Machine

The market lifecycle expands from 2 to 4 states. The transition rules are as follows:

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
  Active ──(endTime)──► Ended ──(consensus OR oracle)──► Resolved
                          │                                  ▲
                          │                                  │
                          └──(price > 95% for N blocks)──────┘
                          │         (auto-resolve)
                          │
                          └──(outcome-force by any user)─► Partial Settlement
                                                           (encumbered coins)
```

### 3.2 New Contract: `PredictionMarketV2.sol`

The following additions are made to the existing `PredictionMarket.sol`:

```solidity
// ============ New State Variables ============

// Market Consensus Resolution
uint256 public constant CONSENSUS_THRESHOLD = 9500; // 95.00% in BPS
uint256 public constant CONSENSUS_BLOCKS = 50;      // ~50 blocks on Pharos (~25s)
uint256 public consensusStartBlock;
uint256 public consensusDirection;                   // 1 = YES leading, 2 = NO leading

// Outcome-Force Tracking
mapping(address => uint256) public encumberedCoins;  // coins with history tag
mapping(address => uint256) public encumberedHistory; // which outcome they forced
uint256 public totalForced;                          // total forced redemptions

// Outcome-Combine Tracking  
uint256 public totalCombined;                        // total pair redemptions

// Enhanced Status
enum MarketStatus { Active, Ended, ConsensusForming, Resolved }

// ============ New Events ============

event ConsensusCheckpoint(uint256 yesPrice, uint256 blockNumber, uint256 blocksRemaining);
event MarketAutoResolved(Outcome outcome, uint256 consensusBlocks);
event OutcomeForced(address indexed user, uint256 shares, Outcome claimedOutcome);
event OutcomeCombined(address indexed user, uint256 amount);
```

### 3.3 New Functions

**Function 1: `checkConsensus()`** — Anyone can call this after the market ends. It checks whether the AMM price has been above the threshold for enough consecutive blocks. If so, the market auto-resolves without any oracle intervention.

```solidity
function checkConsensus() external {
    require(status == MarketStatus.Ended || status == MarketStatus.ConsensusForming, 
            "Market not in settlement phase");
    
    uint256 yesPrice = getYesPrice(); // Returns 0-10000 (BPS)
    bool strongConsensus = yesPrice >= CONSENSUS_THRESHOLD || 
                           yesPrice <= (BPS - CONSENSUS_THRESHOLD);
    
    if (strongConsensus) {
        uint256 direction = yesPrice >= CONSENSUS_THRESHOLD ? 1 : 2;
        
        if (consensusStartBlock == 0 || consensusDirection != direction) {
            // Start or restart consensus tracking
            consensusStartBlock = block.number;
            consensusDirection = direction;
            status = MarketStatus.ConsensusForming;
            
            emit ConsensusCheckpoint(yesPrice, block.number, CONSENSUS_BLOCKS);
        } else if (block.number >= consensusStartBlock + CONSENSUS_BLOCKS) {
            // Consensus achieved — auto-resolve
            Outcome result = direction == 1 ? Outcome.Yes : Outcome.No;
            resolvedOutcome = result;
            status = MarketStatus.Resolved;
            
            emit MarketAutoResolved(result, block.number - consensusStartBlock);
        } else {
            emit ConsensusCheckpoint(yesPrice, block.number, 
                consensusStartBlock + CONSENSUS_BLOCKS - block.number);
        }
    } else {
        // Price dropped below threshold — reset
        consensusStartBlock = 0;
        consensusDirection = 0;
        status = MarketStatus.Ended;
    }
}
```

**Function 2: `outcomeForce(Outcome _claimed, uint256 _shares)`** — The key innovation from the paper. A user can force-convert their shares to coins with an encumbered history, without waiting for oracle or consensus.

```solidity
function outcomeForce(Outcome _claimed, uint256 _shares) external {
    require(block.timestamp >= endTime, "Market not ended");
    require(_claimed == Outcome.Yes || _claimed == Outcome.No, "Invalid outcome");
    
    if (_claimed == Outcome.Yes) {
        require(yesShares[msg.sender] >= _shares, "Insufficient YES shares");
        yesShares[msg.sender] -= _shares;
    } else {
        require(noShares[msg.sender] >= _shares, "Insufficient NO shares");
        noShares[msg.sender] -= _shares;
    }
    
    // Convert shares to encumbered coins (with a discount factor)
    // The discount reflects the risk that the claimed outcome may be wrong
    uint256 discountBps = _getForceDiscount();  // e.g., 500 = 5% discount
    uint256 payout = (_shares * (BPS - discountBps)) / BPS;
    
    encumberedCoins[msg.sender] += payout;
    encumberedHistory[msg.sender] = uint256(_claimed);
    totalForced += _shares;
    
    // Transfer the discounted amount
    payable(msg.sender).transfer(payout);
    
    emit OutcomeForced(msg.sender, _shares, _claimed);
}

function _getForceDiscount() internal view returns (uint256) {
    // Higher discount when consensus is weak, lower when strong
    uint256 yesPrice = getYesPrice();
    uint256 dominantPrice = yesPrice > 5000 ? yesPrice : BPS - yesPrice;
    
    if (dominantPrice >= 9500) return 200;   // 2% discount — very strong consensus
    if (dominantPrice >= 9000) return 500;   // 5% discount — strong consensus
    if (dominantPrice >= 8000) return 1000;  // 10% discount — moderate consensus
    return 2000;                              // 20% discount — weak consensus
}
```

**Function 3: `outcomeCombine(uint256 _amount)`** — Redeem a matched YES+NO pair back to clean coins. This is the preferred path when a user holds both sides.

```solidity
function outcomeCombine(uint256 _amount) external {
    require(yesShares[msg.sender] >= _amount, "Insufficient YES shares");
    require(noShares[msg.sender] >= _amount, "Insufficient NO shares");
    
    yesShares[msg.sender] -= _amount;
    noShares[msg.sender] -= _amount;
    totalCombined += _amount;
    
    // Return full amount — no discount, no encumbrance
    payable(msg.sender).transfer(_amount);
    
    emit OutcomeCombined(msg.sender, _amount);
}
```

### 3.4 Modified `claimWinnings()`

The existing `claimWinnings()` function is updated to work with all resolution methods:

```solidity
function claimWinnings() external {
    require(status == MarketStatus.Resolved, "Not resolved");
    require(!hasClaimed[msg.sender], "Already claimed");
    
    uint256 winningShares;
    if (resolvedOutcome == Outcome.Yes) {
        winningShares = yesShares[msg.sender];
    } else {
        winningShares = noShares[msg.sender];
    }
    require(winningShares > 0, "No winning shares");
    
    hasClaimed[msg.sender] = true;
    
    // Payout from remaining pool (after forced redemptions)
    uint256 totalPool = address(this).balance;
    uint256 totalWinning = resolvedOutcome == Outcome.Yes ? 
        totalMintedYes - totalForced : totalMintedNo - totalForced;
    
    uint256 payout = (totalPool * winningShares) / totalWinning;
    payable(msg.sender).transfer(payout);
    
    emit WinningsClaimed(msg.sender, payout);
}
```

---

## 4. Frontend Data Model Changes

### 4.1 Updated Market Interface

The `Market` interface in `MarketsContext.tsx` needs the following additions:

```typescript
export type MarketStatus = "active" | "ended" | "consensus_forming" | "resolved";
export type ResolutionMethod = "oracle" | "consensus" | "pending";

export interface Market {
  // ... existing fields ...
  
  // New resolution fields
  resolutionMethod?: ResolutionMethod;
  consensusProgress?: number;        // 0-100, blocks confirmed / blocks needed
  consensusDirection?: "yes" | "no"; // which side is forming consensus
  
  // User position (per-wallet)
  userYesShares?: number;
  userNoShares?: number;
  userEncumberedCoins?: number;
  userHasClaimed?: boolean;
  
  // Settlement stats
  totalForced?: number;
  totalCombined?: number;
  forceDiscountPercent?: number;     // current discount for outcome-force
}
```

### 4.2 New Context Actions

```typescript
interface MarketsContextType {
  // ... existing actions ...
  
  // New settlement actions
  checkConsensus: (marketId: string) => void;
  outcomeForce: (marketId: string, outcome: "yes" | "no", shares: number) => void;
  outcomeCombine: (marketId: string, amount: number) => void;
  claimWinnings: (marketId: string) => void;
}
```

---

## 5. UI Design: Resolution Dashboard

The most significant UI change is transforming the current static "Resolved" badge into an interactive **Resolution Dashboard** that appears on the `MarketDetail` page when a market has ended. The design principle is: **show the user exactly what they can do, with one primary action button**.

### 5.1 Market Status Banner

When a market ends, a full-width banner replaces the trading panel. The banner adapts to the current resolution state:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⏰ MARKET ENDED — Settlement in Progress                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Market Consensus: YES leading at 96.2%                   │   │
│  │  ████████████████████████████████████░░░░  38/50 blocks   │   │
│  │                                                           │   │
│  │  ⚡ Auto-resolution in ~12 blocks (~6 seconds)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Your Position: 150 YES shares · 0 NO shares                    │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │  ⏳ Wait for Auto    │  │  ⚡ Force Redeem Now │               │
│  │     Resolution      │  │     (2% discount)    │               │
│  │   (recommended)     │  │                      │               │
│  └─────────────────────┘  └─────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Settlement Options Panel

After the market ends, the right-side trading panel transforms into a **Settlement Options Panel**. The panel shows different options depending on the user's position:

**Scenario A: User holds only winning-side shares (most common)**

```
┌──────────────────────────────────────┐
│  🎯 Settlement Options               │
│                                       │
│  Your Position                        │
│  ┌────────────────────────────────┐  │
│  │  150 YES shares                │  │
│  │  Current value: ~150 PHAR      │  │
│  └────────────────────────────────┘  │
│                                       │
│  ── Recommended ──────────────────── │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  ⏳ Wait for Resolution         │  │
│  │  Auto-consensus: 76% complete  │  │
│  │  Oracle fallback available     │  │
│  │                                │  │
│  │  Payout: 150.00 PHAR (100%)   │  │
│  │                                │  │
│  │  [Wait — No Action Needed]     │  │
│  └────────────────────────────────┘  │
│                                       │
│  ── Or settle immediately ────────── │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  ⚡ Force Redeem (outcome-force)│  │
│  │  Get coins now with history tag│  │
│  │                                │  │
│  │  Payout: 147.00 PHAR (98%)    │  │
│  │  Discount: 2% (strong signal) │  │
│  │                                │  │
│  │  [Force Redeem 150 Shares]     │  │
│  └────────────────────────────────┘  │
│                                       │
│  ℹ️ Force Redeem lets you settle     │
│  instantly without waiting for an    │
│  oracle. A small discount applies    │
│  based on current market consensus.  │
└──────────────────────────────────────┘
```

**Scenario B: User holds both YES and NO shares**

```
┌──────────────────────────────────────┐
│  🎯 Settlement Options               │
│                                       │
│  Your Position                        │
│  ┌────────────────────────────────┐  │
│  │  150 YES  ·  80 NO             │  │
│  │  80 pairs available to combine │  │
│  └────────────────────────────────┘  │
│                                       │
│  ── Best Option ─────────────────── │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  🔄 Pair Redeem (combine)      │  │
│  │  Match 80 YES + 80 NO → 80 ETH│  │
│  │  Clean coins, no discount!     │  │
│  │                                │  │
│  │  [Combine 80 Pairs → 80 PHAR] │  │
│  └────────────────────────────────┘  │
│                                       │
│  Remaining: 70 YES shares            │
│  → Wait for resolution or force      │
│    redeem the remaining shares       │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  ⚡ Force Redeem Remaining      │  │
│  │  70 YES → 68.6 PHAR (98%)     │  │
│  │                                │  │
│  │  [Force Redeem 70 Shares]      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Scenario C: User holds only losing-side shares**

```
┌──────────────────────────────────────┐
│  🎯 Settlement Options               │
│                                       │
│  Your Position                        │
│  ┌────────────────────────────────┐  │
│  │  200 NO shares                 │  │
│  │  Market consensus: YES (96%)   │  │
│  │  ⚠️ Your shares are likely     │  │
│  │  on the losing side            │  │
│  └────────────────────────────────┘  │
│                                       │
│  ── Options ─────────────────────── │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  💱 Sell on Market              │  │
│  │  Current price: ~4¢ per share  │  │
│  │  Est. return: ~8 PHAR          │  │
│  │                                │  │
│  │  [Sell 200 NO Shares]          │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  🎲 Hold & Hope                │  │
│  │  If oracle rules NO, you win!  │  │
│  │  Potential: 200 PHAR           │  │
│  │                                │  │
│  │  [Keep Holding]                │  │
│  └────────────────────────────────┘  │
│                                       │
│  ℹ️ If the market auto-resolves via  │
│  consensus, your shares will be      │
│  worth 0. Consider selling now.      │
└──────────────────────────────────────┘
```

### 5.3 Consensus Progress Indicator

A real-time progress bar shows how close the market is to auto-resolving. This is the most important visual element because it creates urgency and transparency:

```
┌──────────────────────────────────────────────────────┐
│  📊 Market Consensus Tracker                          │
│                                                       │
│  YES: 96.2%  ████████████████████████████████████░░  │
│                                                       │
│  Consensus Progress:                                  │
│  ██████████████████████████████████████░░░░░░  76%    │
│  38 of 50 blocks confirmed                            │
│                                                       │
│  ⚡ Estimated auto-resolution: ~6 seconds              │
│                                                       │
│  If price drops below 95%, counter resets to 0.       │
└──────────────────────────────────────────────────────┘
```

### 5.4 Resolution History Badge

After resolution, the market card and detail page show how the market was resolved:

```
┌─────────────────────────────────────┐
│  ✅ Resolved: YES                    │
│  Method: 🤝 Market Consensus        │  ← or 🔮 Oracle  or ⚡ Forced
│  Resolved at: Feb 8, 2026 14:32     │
│  Consensus blocks: 50/50            │
│  Total paid out: 45,230 PHAR        │
│  Force-redeemed: 12,400 PHAR (27%)  │
│  Pair-redeemed: 8,200 PHAR (18%)    │
└─────────────────────────────────────┘
```

---

## 6. UI Component Architecture

### 6.1 New Components to Create

| Component | Location | Purpose |
|---|---|---|
| `ResolutionDashboard.tsx` | `components/` | Main container that renders the correct settlement UI based on market state and user position |
| `ConsensusTracker.tsx` | `components/` | Real-time progress bar for consensus formation with block countdown |
| `SettlementOptions.tsx` | `components/` | Card-based layout showing available settlement actions with payout estimates |
| `OutcomeForceModal.tsx` | `components/` | Confirmation dialog for force-redeem with discount explanation |
| `OutcomeCombineModal.tsx` | `components/` | Confirmation dialog for pair-redeem showing matched pairs |
| `ResolutionBadge.tsx` | `components/` | Small badge showing resolution method (consensus/oracle/forced) |

### 6.2 Modified Components

| Component | Changes |
|---|---|
| `MarketDetail.tsx` | Replace the static "Resolved" section (lines 311-321) with `<ResolutionDashboard />`. Add new state for settlement flow. |
| `MarketCard.tsx` | Add `<ResolutionBadge />` for resolved markets. Show consensus progress bar for ended markets. |
| `MarketsContext.tsx` | Add new status types, settlement actions, and user position tracking. |
| `Navbar.tsx` | Add notification indicator when user has markets pending settlement. |

### 6.3 Component Rendering Logic

The `ResolutionDashboard` component uses a decision tree to render the appropriate UI:

```typescript
function ResolutionDashboard({ market }: { market: Market }) {
  const { userYesShares, userNoShares } = useUserPosition(market.id);
  
  // State 1: Market still active
  if (market.status === "active") return null;
  
  // State 2: Market ended, consensus forming
  if (market.status === "ended" || market.status === "consensus_forming") {
    return (
      <div>
        <ConsensusTracker market={market} />
        <SettlementOptions 
          market={market}
          yesShares={userYesShares}
          noShares={userNoShares}
        />
      </div>
    );
  }
  
  // State 3: Market resolved, user can claim
  if (market.status === "resolved" && !market.userHasClaimed) {
    return <ClaimWinningsPanel market={market} />;
  }
  
  // State 4: Market resolved, user already claimed
  return <ResolutionSummary market={market} />;
}
```

---

## 7. User Flow Walkthrough

### 7.1 Happy Path: Market Consensus Resolution

This is the most common and most desirable flow. The user does nothing special — the market resolves itself.

**Step 1.** Market ends (endTime reached). The trading panel grays out and shows "Market Ended — Settlement in Progress." The consensus tracker appears, showing the current price and block progress.

**Step 2.** As traders continue to trade post-expiry (selling losing shares, buying winning shares), the price converges toward 95%+ on one side. The consensus tracker fills up in real-time.

**Step 3.** After 50 consecutive blocks above 95%, the market auto-resolves. A celebratory animation plays, and the "Claim Winnings" button appears for winning-side holders.

**Step 4.** User clicks "Claim Winnings" and receives their full payout with no discount.

### 7.2 Impatient Winner: Outcome-Force

The user holds winning shares but does not want to wait for consensus or oracle.

**Step 1.** Market ends. User sees the Settlement Options panel with their position.

**Step 2.** User clicks "Force Redeem Now." A modal appears explaining: "You will receive 147 PHAR (98% of face value). The 2% discount reflects the current market consensus strength. Your coins will carry a history tag indicating you claimed YES won."

**Step 3.** User confirms. Transaction executes. Coins are transferred immediately.

**Step 4.** The "Force Redeem" option disappears for the redeemed shares. If the user has remaining shares, they can force-redeem those too or wait for full resolution.

### 7.3 Savvy Trader: Outcome-Combine

The user holds both YES and NO shares (e.g., they provided liquidity or bought both sides at different times).

**Step 1.** Market ends. The Settlement Options panel highlights "Pair Redeem" as the best option because it has zero discount.

**Step 2.** User clicks "Combine Pairs." A modal shows: "You have 80 YES and 80 NO shares. Combining 80 pairs will return 80 PHAR with no discount and no history tag."

**Step 3.** User confirms. 80 PHAR returned. Remaining unmatched shares can be force-redeemed or held for oracle resolution.

### 7.4 Losing Side: Rational Exit

The user holds shares on the losing side (e.g., NO shares when YES is at 96%).

**Step 1.** Market ends. The Settlement Options panel shows a warning: "Your shares are likely on the losing side."

**Step 2.** Two options are presented: "Sell on Market" (get ~4% of face value now) or "Hold & Hope" (wait for oracle — if oracle disagrees with consensus, they win big).

**Step 3.** Most rational users will sell. The proceeds go to winning-side holders who want to do outcome-combine.

---

## 8. Visual Design Specifications

### 8.1 Color Coding for Settlement States

| State | Color | CSS Variable | Usage |
|---|---|---|---|
| Market Ended | Amber/Warning | `--color-amber-500` (#F59E0B) | Banner background, status badge |
| Consensus Forming | Cyan/Info | `--color-cyan-500` (#06B6D4) | Progress bar, tracker |
| Resolved via Consensus | Green/Success | `--color-emerald-500` (#10B981) | Resolution badge, claim button |
| Resolved via Oracle | Blue/Neutral | `--color-blue-500` (#3B82F6) | Resolution badge |
| Force Redeemed | Orange/Action | `--color-orange-500` (#F97316) | Force button, encumbered badge |
| Pair Redeemed | Teal/Clean | `--color-teal-500` (#14B8A6) | Combine button |

### 8.2 Animation Guidelines

The consensus tracker should use a **pulsing glow** animation on the progress bar to convey liveness — the market is actively being settled by the community. When consensus is achieved, a **burst** animation (expanding ring) celebrates the resolution. The force-redeem button should have a subtle **lightning bolt shimmer** to convey speed and urgency.

```css
/* Consensus progress bar pulse */
@keyframes consensus-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
  50% { box-shadow: 0 0 12px 4px rgba(6, 182, 212, 0.2); }
}

/* Resolution celebration burst */
@keyframes resolve-burst {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
```

### 8.3 Mobile Responsiveness

On mobile screens (< 768px), the Settlement Options panel moves below the market info (instead of the right sidebar). The consensus tracker becomes a compact horizontal bar at the top of the screen, similar to a download progress indicator. Settlement option cards stack vertically with the recommended option expanded by default and others collapsed.

---

## 9. Implementation Roadmap

The integration should be implemented in the following order, with each phase producing a testable increment:

| Phase | Scope | Estimated Effort | Deliverable |
|---|---|---|---|
| **Phase 1** | Smart contract: Add `checkConsensus()`, `outcomeForce()`, `outcomeCombine()` to `PredictionMarketV2.sol` | 4-6 hours | Deployable contract with new functions |
| **Phase 2** | Frontend data model: Update `MarketsContext.tsx` with new status types, settlement actions, mock data for ended/consensus states | 2-3 hours | Updated context with settlement simulation |
| **Phase 3** | UI: Build `ConsensusTracker.tsx` and `ResolutionDashboard.tsx` | 3-4 hours | Visual consensus progress and settlement options |
| **Phase 4** | UI: Build `OutcomeForceModal.tsx`, `OutcomeCombineModal.tsx`, and `SettlementOptions.tsx` | 3-4 hours | Interactive settlement flows |
| **Phase 5** | Integration: Wire frontend to contract ABIs, add event listeners for real-time consensus updates | 2-3 hours | End-to-end working flow |
| **Phase 6** | Polish: Animations, mobile responsiveness, edge case handling | 2-3 hours | Production-ready UI |

**Total estimated effort: 16-23 hours**

---

## 10. Edge Cases and Safety Considerations

**What if the consensus price oscillates around 95%?** The counter resets every time the price drops below the threshold. The UI shows this clearly: "Consensus reset — price dropped to 93.2%." This prevents premature resolution on volatile markets.

**What if the oracle and consensus disagree?** The contract should implement a priority system: if the oracle resolves the market before consensus is achieved, the oracle result is final. If consensus resolves first, the oracle can no longer override it. This is enforced by the `MarketStatus.Resolved` check in both functions.

**What if the contract runs out of ETH due to force-redemptions?** The discount mechanism ensures the contract always retains a buffer. Even at the minimum 2% discount, the contract keeps 2% of every force-redeemed amount. Additionally, the `claimWinnings()` function distributes proportionally from the remaining balance, so it can never pay out more than what is available.

**What if nobody calls `checkConsensus()`?** Since it is a public function, anyone can call it — including a simple keeper bot. On Pharos with sub-second finality, the gas cost is negligible. The UI can also auto-call it when a user visits an ended market page.

---

## 11. Hackathon Differentiation

This integration gives PharosBet three significant advantages over Polymarket for the Pharos hackathon judging:

**First**, the arbiter-free resolution mechanism demonstrates true decentralization. Polymarket relies on UMA's optimistic oracle, which still requires human voters and has a 2-hour dispute window. PharosBet's market consensus resolution can settle in under 30 seconds on Pharos, with zero human intervention.

**Second**, the outcome-force mechanism provides instant liquidity for winners. On Polymarket, winners must wait for the oracle dispute period to end (up to 48 hours in contested cases). On PharosBet, winners can force-redeem immediately at a small discount, or wait for the full amount.

**Third**, the multi-path resolution system showcases Pharos's low-latency advantage. The 50-block consensus window translates to approximately 25 seconds on Pharos, compared to minutes or hours on Ethereum L1. This makes the consensus tracker a visually compelling real-time experience that judges can watch in action during a demo.

---

## References

[1]: Bentov, I., Mizrahi, A., Rosenfeld, M. (2017). "Decentralized Prediction Market Without Arbiters." In: FC 2017 Workshops, LNCS 10323, pp. 199-217. https://doi.org/10.1007/978-3-319-70278-0_13

[2]: Polymarket CTF Exchange. GitHub. https://github.com/polymarket/ctf-exchange

[3]: Pharos Network Developer Guide. https://docs.pharosnetwork.xyz/developer-guide/getting-started
