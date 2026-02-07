/*
 * Design: Social Betting Lounge
 * MarketCard: Social-media-style prediction card with probability bar, volume, participants
 * Colors: card bg, gold accent, teal YES, rose NO
 */
import { Link } from "wouter";
import { type Market } from "@/contexts/MarketsContext";
import { Clock, Users, BarChart3, Share2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

function formatTimeLeft(endDate: number): string {
  const diff = endDate - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 30) return `${Math.floor(days / 30)}mo left`;
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

const categoryColors: Record<string, string> = {
  crypto: "bg-amber-500/15 text-amber-400",
  politics: "bg-blue-500/15 text-blue-400",
  sports: "bg-green-500/15 text-green-400",
  tech: "bg-purple-500/15 text-purple-400",
  entertainment: "bg-pink-500/15 text-pink-400",
  other: "bg-gray-500/15 text-gray-400",
};

interface MarketCardProps {
  market: Market;
  index?: number;
  featured?: boolean;
}

export default function MarketCard({ market, index = 0, featured = false }: MarketCardProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/market/${market.id}`;
    const text = `🔮 "${market.question}" — Currently ${market.yesPrice}% YES. What do you think? Predict now on PharosBet!`;
    if (navigator.share) {
      navigator.share({ title: market.question, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/market/${market.id}`}>
        <div
          className={`group relative rounded-xl border border-border/60 bg-card hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5 overflow-hidden ${
            featured ? "p-6" : "p-5"
          }`}
        >
          {/* Category + Status */}
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${categoryColors[market.category]}`}>
              {market.category.charAt(0).toUpperCase() + market.category.slice(1)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {market.status === "resolved" ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${market.resolution === "yes" ? "bg-yes/20 text-yes" : "bg-no/20 text-no"}`}>
                  Resolved: {market.resolution?.toUpperCase()}
                </span>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimeLeft(market.endDate)}
                </>
              )}
            </div>
          </div>

          {/* Question */}
          <h3
            className={`font-bold leading-snug mb-4 group-hover:text-gold transition-colors ${
              featured ? "text-lg" : "text-base"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {market.question}
          </h3>

          {/* Probability Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-yes font-bold text-lg">{market.yesPrice}%</span>
                <span className="text-xs text-muted-foreground">Yes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">No</span>
                <span className="text-no font-bold text-lg">{market.noPrice}%</span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden flex">
              <motion.div
                className="h-full bg-gradient-to-r from-yes to-teal-400 rounded-l-full"
                initial={{ width: 0 }}
                animate={{ width: `${market.yesPrice}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 + 0.2, ease: "easeOut" }}
              />
              <motion.div
                className="h-full bg-gradient-to-r from-rose-400 to-no rounded-r-full"
                initial={{ width: 0 }}
                animate={{ width: `${market.noPrice}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 + 0.2, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{formatVolume(market.volume)} PHAR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{market.participants}</span>
              </div>
              {market.status === "active" && (
                <div className="flex items-center gap-1.5 text-yes">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Active</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-gold"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
