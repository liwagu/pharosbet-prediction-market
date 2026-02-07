import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type MarketStatus = "active" | "resolved" | "expired";
export type MarketCategory = "crypto" | "politics" | "sports" | "tech" | "entertainment" | "other";

export interface Market {
  id: string;
  question: string;
  description: string;
  category: MarketCategory;
  imageUrl?: string;
  creator: string;
  createdAt: number;
  endDate: number;
  yesPrice: number; // 0-100 representing probability percentage
  noPrice: number;
  volume: number; // total volume traded in PHAR
  liquidity: number;
  status: MarketStatus;
  resolution?: "yes" | "no";
  totalYesShares: number;
  totalNoShares: number;
  participants: number;
  tags: string[];
}

interface MarketsContextType {
  markets: Market[];
  featuredMarkets: Market[];
  trendingMarkets: Market[];
  getMarket: (id: string) => Market | undefined;
  createMarket: (market: Omit<Market, "id" | "createdAt" | "yesPrice" | "noPrice" | "volume" | "liquidity" | "status" | "totalYesShares" | "totalNoShares" | "participants">) => Market;
  buyShares: (marketId: string, outcome: "yes" | "no", amount: number) => void;
  categories: MarketCategory[];
  filterByCategory: (category: MarketCategory | "all") => Market[];
}

const MOCK_MARKETS: Market[] = [
  {
    id: "1",
    question: "Will Bitcoin exceed $150,000 by end of 2026?",
    description: "This market resolves YES if the price of Bitcoin (BTC) reaches or exceeds $150,000 USD on any major exchange before December 31, 2026 23:59 UTC.",
    category: "crypto",
    creator: "0x1234...abcd",
    createdAt: Date.now() - 86400000 * 3,
    endDate: Date.now() + 86400000 * 300,
    yesPrice: 42,
    noPrice: 58,
    volume: 125000,
    liquidity: 45000,
    status: "active",
    totalYesShares: 52000,
    totalNoShares: 73000,
    participants: 342,
    tags: ["bitcoin", "crypto", "price"],
  },
  {
    id: "2",
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
  },
  {
    id: "3",
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
  },
  {
    id: "4",
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
  },
  {
    id: "5",
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
  },
  {
    id: "6",
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
  },
  {
    id: "7",
    question: "Will Apple release AR glasses in 2026?",
    description: "Resolves YES if Apple officially announces and begins selling augmented reality glasses (not Vision Pro) before December 31, 2026.",
    category: "tech",
    creator: "0x5555...6666",
    createdAt: Date.now() - 86400000 * 10,
    endDate: Date.now() + 86400000 * 300,
    yesPrice: 22,
    noPrice: 78,
    volume: 156000,
    liquidity: 55000,
    status: "active",
    totalYesShares: 34320,
    totalNoShares: 121680,
    participants: 634,
    tags: ["apple", "ar", "hardware"],
  },
  {
    id: "8",
    question: "Will GTA 6 release before October 2025?",
    description: "Resolves YES if Grand Theft Auto VI is officially released and available for purchase before October 1, 2025.",
    category: "entertainment",
    creator: "0x7777...8888",
    createdAt: Date.now() - 86400000 * 30,
    endDate: Date.now() - 86400000 * 5,
    yesPrice: 8,
    noPrice: 92,
    volume: 520000,
    liquidity: 0,
    status: "resolved",
    resolution: "no",
    totalYesShares: 41600,
    totalNoShares: 478400,
    participants: 2341,
    tags: ["gta6", "gaming", "rockstar"],
  },
];

const MarketsContext = createContext<MarketsContextType | null>(null);

export function MarketsProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);

  const categories: MarketCategory[] = ["crypto", "politics", "sports", "tech", "entertainment", "other"];

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
        "id" | "createdAt" | "yesPrice" | "noPrice" | "volume" | "liquidity" | "status" | "totalYesShares" | "totalNoShares" | "participants"
      >
    ) => {
      const newMarket: Market = {
        ...marketData,
        id: String(Date.now()),
        createdAt: Date.now(),
        yesPrice: 50,
        noPrice: 50,
        volume: 0,
        liquidity: 0,
        status: "active",
        totalYesShares: 0,
        totalNoShares: 0,
        participants: 0,
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
