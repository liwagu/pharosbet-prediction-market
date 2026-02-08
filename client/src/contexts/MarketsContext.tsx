import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { ethers } from "ethers";
import { PHAROS_RPC, FACTORY_ADDRESS, FACTORY_ABI, MARKET_ABI } from "@/lib/contracts";

export type MarketStatus = "active" | "resolved" | "expired";
export type MarketCategory = "crypto" | "politics" | "sports" | "tech" | "entertainment" | "other";

export interface Market {
  id: string;
  address: string; // on-chain contract address
  question: string;
  description: string;
  category: MarketCategory;
  imageUrl?: string;
  creator: string;
  createdAt: number;
  endDate: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  status: MarketStatus;
  resolution?: "yes" | "no";
  totalYesShares: number;
  totalNoShares: number;
  participants: number;
  tags: string[];
  isOnChain: boolean;
}

interface MarketsContextType {
  markets: Market[];
  featuredMarkets: Market[];
  trendingMarkets: Market[];
  getMarket: (id: string) => Market | undefined;
  createMarket: (market: Omit<Market, "id" | "address" | "createdAt" | "yesPrice" | "noPrice" | "volume" | "liquidity" | "status" | "totalYesShares" | "totalNoShares" | "participants" | "isOnChain">) => Market;
  buyShares: (marketId: string, outcome: "yes" | "no", amount: number) => void;
  categories: MarketCategory[];
  filterByCategory: (category: MarketCategory | "all") => Market[];
  refreshMarkets: () => Promise<void>;
  isLoading: boolean;
}

// Mock markets for demo variety (these show alongside on-chain markets)
const DEMO_MARKETS: Market[] = [
  {
    id: "demo-2",
    address: "",
    question: "Will Ethereum ETF inflows exceed $50B in 2026?",
    description: "Resolves YES if total net inflows into all US-listed Ethereum spot ETFs exceed $50 billion USD by December 31, 2026.",
    category: "crypto",
    creator: "0x5678...efgh",
    createdAt: Date.now() - 86400000 * 7,
    endDate: Date.now() + 86400000 * 250,
    yesPrice: 35,
    noPrice: 65,
    volume: 89000,
    liquidity: 32000,
    status: "active",
    totalYesShares: 31000,
    totalNoShares: 58000,
    participants: 218,
    tags: ["ethereum", "etf", "institutional"],
    isOnChain: false,
  },
  {
    id: "demo-3",
    address: "",
    question: "Will AI replace 10% of software engineering jobs by 2027?",
    description: "This market resolves YES if credible industry reports indicate that AI tools have directly replaced at least 10% of software engineering positions globally by January 1, 2027.",
    category: "tech",
    creator: "0x9abc...ijkl",
    createdAt: Date.now() - 86400000 * 14,
    endDate: Date.now() + 86400000 * 600,
    yesPrice: 28,
    noPrice: 72,
    volume: 210000,
    liquidity: 78000,
    status: "active",
    totalYesShares: 59000,
    totalNoShares: 151000,
    participants: 567,
    tags: ["ai", "jobs", "technology"],
    isOnChain: false,
  },
  {
    id: "demo-4",
    address: "",
    question: "Will the US Federal Reserve cut rates before July 2026?",
    description: "Resolves YES if the Federal Reserve announces at least one interest rate cut before July 1, 2026.",
    category: "politics",
    creator: "0xdef0...mnop",
    createdAt: Date.now() - 86400000 * 2,
    endDate: Date.now() + 86400000 * 120,
    yesPrice: 67,
    noPrice: 33,
    volume: 340000,
    liquidity: 120000,
    status: "active",
    totalYesShares: 228000,
    totalNoShares: 112000,
    participants: 891,
    tags: ["fed", "rates", "economy"],
    isOnChain: false,
  },
  {
    id: "demo-5",
    address: "",
    question: "Will a Pharos-based DeFi protocol reach $1B TVL?",
    description: "Resolves YES if any DeFi protocol built on Pharos Network achieves $1 billion or more in Total Value Locked before December 31, 2026.",
    category: "crypto",
    creator: "0x1111...2222",
    createdAt: Date.now() - 86400000 * 1,
    endDate: Date.now() + 86400000 * 365,
    yesPrice: 15,
    noPrice: 85,
    volume: 45000,
    liquidity: 18000,
    status: "active",
    totalYesShares: 6750,
    totalNoShares: 38250,
    participants: 156,
    tags: ["pharos", "defi", "tvl"],
    isOnChain: false,
  },
  {
    id: "demo-6",
    address: "",
    question: "Will the next FIFA World Cup final have over 3 goals?",
    description: "Resolves YES if the 2026 FIFA World Cup final match ends with a combined total of more than 3 goals (excluding penalty shootout).",
    category: "sports",
    creator: "0x3333...4444",
    createdAt: Date.now() - 86400000 * 5,
    endDate: Date.now() + 86400000 * 180,
    yesPrice: 38,
    noPrice: 62,
    volume: 67000,
    liquidity: 25000,
    status: "active",
    totalYesShares: 25460,
    totalNoShares: 41540,
    participants: 423,
    tags: ["fifa", "worldcup", "football"],
    isOnChain: false,
  },
];

const MarketsContext = createContext<MarketsContextType | null>(null);

// Helper: fetch a single market's data from chain
async function fetchMarketFromChain(
  marketAddress: string,
  index: number,
  provider: ethers.JsonRpcProvider
): Promise<Market | null> {
  try {
    const contract = new ethers.Contract(marketAddress, MARKET_ABI, provider);
    const info = await contract.getMarketInfo();
    const [question, description, category, creator, endTime, yesPrice, noPrice, totalVolume, participantCount, statusNum, outcomeNum] = info;

    let status: MarketStatus = "active";
    if (Number(statusNum) === 2) status = "resolved";
    else if (Number(endTime) * 1000 < Date.now()) status = "expired";

    let resolution: "yes" | "no" | undefined;
    if (Number(outcomeNum) === 1) resolution = "yes";
    else if (Number(outcomeNum) === 2) resolution = "no";

    const validCategories: MarketCategory[] = ["crypto", "politics", "sports", "tech", "entertainment", "other"];
    const cat = validCategories.includes(category as MarketCategory) ? (category as MarketCategory) : "other";

    return {
      id: `chain-${index}`,
      address: marketAddress,
      question,
      description,
      category: cat,
      creator,
      createdAt: Number(endTime) * 1000 - 86400000 * 7, // approximate
      endDate: Number(endTime) * 1000,
      yesPrice: Number(yesPrice),
      noPrice: Number(noPrice),
      volume: Number(ethers.formatEther(totalVolume)),
      liquidity: 0,
      status,
      resolution,
      totalYesShares: 0,
      totalNoShares: 0,
      participants: Number(participantCount),
      tags: [cat],
      isOnChain: true,
    };
  } catch (err) {
    console.error(`Failed to fetch market ${marketAddress}:`, err);
    return null;
  }
}

export function MarketsProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(DEMO_MARKETS);
  const [isLoading, setIsLoading] = useState(true);

  const categories: MarketCategory[] = ["crypto", "politics", "sports", "tech", "entertainment", "other"];

  // Fetch on-chain markets
  const refreshMarkets = useCallback(async () => {
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(PHAROS_RPC);
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const count = await factory.getMarketCount();
      const numMarkets = Number(count);

      if (numMarkets > 0) {
        const addresses = await factory.getMarkets(0, Math.min(numMarkets, 50));
        const chainMarkets = await Promise.all(
          addresses.map((addr: string, i: number) => fetchMarketFromChain(addr, i, provider))
        );
        const validChainMarkets = chainMarkets.filter((m): m is Market => m !== null);

        // Merge: on-chain markets first, then demo markets
        setMarkets([...validChainMarkets, ...DEMO_MARKETS]);
      } else {
        setMarkets(DEMO_MARKETS);
      }
    } catch (err) {
      console.error("Failed to fetch on-chain markets:", err);
      setMarkets(DEMO_MARKETS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMarkets();
  }, [refreshMarkets]);

  const featuredMarkets = markets
    .filter((m) => m.status === "active")
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3);

  const trendingMarkets = markets
    .filter((m) => m.status === "active")
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5);

  const getMarket = useCallback(
    (id: string) => markets.find((m) => m.id === id),
    [markets]
  );

  const createMarket = useCallback(
    (
      marketData: Omit<
        Market,
        "id" | "address" | "createdAt" | "yesPrice" | "noPrice" | "volume" | "liquidity" | "status" | "totalYesShares" | "totalNoShares" | "participants" | "isOnChain"
      >
    ) => {
      const newMarket: Market = {
        ...marketData,
        id: String(Date.now()),
        address: "",
        createdAt: Date.now(),
        yesPrice: 50,
        noPrice: 50,
        volume: 0,
        liquidity: 0,
        status: "active",
        totalYesShares: 0,
        totalNoShares: 0,
        participants: 0,
        isOnChain: false,
      };
      setMarkets((prev) => [newMarket, ...prev]);
      return newMarket;
    },
    []
  );

  const buyShares = useCallback(
    (marketId: string, outcome: "yes" | "no", amount: number) => {
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.id !== marketId) return m;
          const totalShares = m.totalYesShares + m.totalNoShares + amount;
          const newYesShares = outcome === "yes" ? m.totalYesShares + amount : m.totalYesShares;
          const newNoShares = outcome === "no" ? m.totalNoShares + amount : m.totalNoShares;
          return {
            ...m,
            totalYesShares: newYesShares,
            totalNoShares: newNoShares,
            yesPrice: Math.round((newYesShares / totalShares) * 100),
            noPrice: Math.round((newNoShares / totalShares) * 100),
            volume: m.volume + amount,
            participants: m.participants + 1,
          };
        })
      );
    },
    []
  );

  const filterByCategory = useCallback(
    (category: MarketCategory | "all") => {
      if (category === "all") return markets.filter((m) => m.status === "active");
      return markets.filter((m) => m.category === category && m.status === "active");
    },
    [markets]
  );

  return (
    <MarketsContext.Provider
      value={{
        markets,
        featuredMarkets,
        trendingMarkets,
        getMarket,
        createMarket,
        buyShares,
        categories,
        filterByCategory,
        refreshMarkets,
        isLoading,
      }}
    >
      {children}
    </MarketsContext.Provider>
  );
}

export function useMarkets() {
  const context = useContext(MarketsContext);
  if (!context) throw new Error("useMarkets must be used within a MarketsProvider");
  return context;
}
