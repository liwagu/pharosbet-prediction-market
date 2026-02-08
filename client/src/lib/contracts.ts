/**
 * Smart Contract ABIs and addresses for PharosBet
 * 
 * Contract Architecture:
 * - PredictionMarketFactory: Deploys and tracks all markets
 * - PredictionMarket: Individual market with built-in CPMM AMM
 * - SimpleOracle: Multi-sig oracle for market resolution
 * 
 * Network: Pharos Testnet (Chain ID: 688888)
 */

// Pharos Testnet Configuration
export const PHAROS_CHAIN_ID = 688689;
export const PHAROS_RPC = "https://atlantic.dplabs-internal.com";
export const PHAROS_EXPLORER = "https://atlantic.pharosscan.xyz";

// Contract Addresses (to be updated after deployment)
export const FACTORY_ADDRESS = "0x438D2864035e9FBec492762b0D01121E843073c5";
export const ORACLE_ADDRESS = "0x2A079770f114a0D99799Dc81b172670a28a5c094";

// ============ ABIs ============

export const FACTORY_ABI = [
  // Market Creation
  "function createMarket(string _question, string _description, string _category, uint256 _endTime) external returns (address)",
  
  // View Functions
  "function getMarketCount() external view returns (uint256)",
  "function getMarkets(uint256 offset, uint256 limit) external view returns (address[])",
  "function getUserMarkets(address user) external view returns (address[])",
  "function allMarkets(uint256 index) external view returns (address)",
  "function isMarket(address) external view returns (bool)",
  "function totalMarketsCreated() external view returns (uint256)",
  
  // Admin
  "function admin() external view returns (address)",
  "function defaultOracle() external view returns (address)",
  
  // Events
  "event MarketCreated(address indexed marketAddress, address indexed creator, string question, string category, uint256 endTime, uint256 marketIndex)",
] as const;

export const MARKET_ABI = [
  // Trading
  "function buyYes() external payable",
  "function buyNo() external payable",
  "function sellYes(uint256 sharesToSell) external",
  "function sellNo(uint256 sharesToSell) external",
  
  // Resolution
  "function claimWinnings() external",
  
  // View Functions
  "function question() external view returns (string)",
  "function description() external view returns (string)",
  "function category() external view returns (string)",
  "function creator() external view returns (address)",
  "function endTime() external view returns (uint256)",
  "function createdAt() external view returns (uint256)",
  "function getYesPrice() external view returns (uint256)",
  "function getNoPrice() external view returns (uint256)",
  "function totalVolume() external view returns (uint256)",
  "function participantCount() external view returns (uint256)",
  "function yesShares(address) external view returns (uint256)",
  "function noShares(address) external view returns (uint256)",
  "function status() external view returns (uint8)",
  "function resolvedOutcome() external view returns (uint8)",
  "function yesPool() external view returns (uint256)",
  "function noPool() external view returns (uint256)",
  "function estimateBuyYes(uint256 amount) external view returns (uint256)",
  "function estimateBuyNo(uint256 amount) external view returns (uint256)",
  "function getMarketInfo() external view returns (string, string, string, address, uint256, uint256, uint256, uint256, uint256, uint8, uint8)",
  
  // Events
  "event SharesBought(address indexed buyer, bool isYes, uint256 amount, uint256 shares, uint256 newYesPrice, uint256 newNoPrice)",
  "event SharesSold(address indexed seller, bool isYes, uint256 shares, uint256 payout, uint256 newYesPrice, uint256 newNoPrice)",
  "event MarketResolved(uint8 outcome, uint256 timestamp)",
  "event WinningsClaimed(address indexed user, uint256 amount)",
] as const;

export const ORACLE_ABI = [
  "function reportOutcome(address _market, uint8 _outcome) external",
  "function finalizeResolution(address _market) external",
  "function emergencyResolve(address _market, uint8 _outcome) external",
  "function getResolutionStatus(address _market) external view returns (uint256, uint256, bool, uint256)",
  "function isReporter(address) external view returns (bool)",
  "function addReporter(address _reporter) external",
  
  "event OutcomeReported(address indexed market, address indexed reporter, uint8 outcome)",
  "event MarketFinalized(address indexed market, uint8 outcome)",
] as const;
