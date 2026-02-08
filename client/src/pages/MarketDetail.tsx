/*
 * Design: Social Betting Lounge
 * MarketDetail: Full market view with trading panel, probability chart, social sharing
 */
import Navbar from "@/components/Navbar";
import { useMarkets } from "@/contexts/MarketsContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Users,
  BarChart3,
  Share2,
  ExternalLink,
  TrendingUp,
  Copy,
  Twitter,
  MessageCircle,
} from "lucide-react";

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeLeft(endDate: number): string {
  const diff = endDate - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 30) return `${Math.floor(days / 30)} months left`;
  if (days > 0) return `${days} days, ${hours} hours left`;
  return `${hours} hours left`;
}

export default function MarketDetail() {
  const [, params] = useRoute("/market/:id");
  const { getMarket, buyShares } = useMarkets();
  const { isConnected, connectWallet } = useWeb3();
  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);

  const market = getMarket(params?.id || "");

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Market Not Found
          </h2>
          <p className="text-muted-foreground mb-6">This prediction market doesn't exist or has been removed.</p>
          <Link href="/">
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Markets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleTrade = () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    buyShares(market.id, selectedOutcome, numAmount);
    toast.success(
      `Successfully bought ${numAmount} ${selectedOutcome.toUpperCase()} shares!`,
      { description: "Transaction confirmed on Pharos Network" }
    );
    setAmount("");
  };

  const shareUrl = `${window.location.origin}/market/${market.id}`;
  const shareText = `🔮 "${market.question}" — Currently ${market.yesPrice}% YES. What do you think? Predict now on PharosBet!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Link copied to clipboard!");
    } catch {
      // Fallback for environments where clipboard API is not available
      const textArea = document.createElement("textarea");
      textArea.value = `${shareText}\n${shareUrl}`;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard!");
    }
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
    setShowShareMenu(false);
  };

  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
    setShowShareMenu(false);
  };

  const estimatedShares = amount
    ? (parseFloat(amount) / (selectedOutcome === "yes" ? market.yesPrice / 100 : market.noPrice / 100)).toFixed(2)
    : "0";

  const potentialPayout = amount ? (parseFloat(amount) / (selectedOutcome === "yes" ? market.yesPrice / 100 : market.noPrice / 100)).toFixed(2) : "0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Back button */}
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Markets
          </button>
        </Link>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Market Header */}
            <div className="rounded-xl border border-border/60 bg-card p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gold/15 text-gold">
                  {market.category.charAt(0).toUpperCase() + market.category.slice(1)}
                </span>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-gold"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-popover p-2 shadow-xl z-50"
                    >
                      <button
                        onClick={handleShareTwitter}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        Share on X
                      </button>
                      <button
                        onClick={handleShareTelegram}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Share on Telegram
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              <h1
                className="text-2xl md:text-3xl font-black leading-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {market.question}
              </h1>

              <p className="text-muted-foreground leading-relaxed mb-6">{market.description}</p>

              {/* Probability Display */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-yes">{market.yesPrice}%</span>
                    <span className="text-sm text-muted-foreground">Yes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">No</span>
                    <span className="text-3xl font-black text-no">{market.noPrice}%</span>
                  </div>
                </div>
                <div className="h-4 rounded-full bg-secondary overflow-hidden flex">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yes to-teal-400 rounded-l-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${market.yesPrice}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <motion.div
                    className="h-full bg-gradient-to-r from-rose-400 to-no rounded-r-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${market.noPrice}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: BarChart3, label: "Volume", value: `${formatVolume(market.volume)} PHAR` },
                  { icon: Users, label: "Participants", value: market.participants.toString() },
                  { icon: Clock, label: "Ends", value: formatTimeLeft(market.endDate) },
                  { icon: TrendingUp, label: "Liquidity", value: `${formatVolume(market.liquidity)} PHAR` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <stat.icon className="w-3.5 h-3.5" />
                      <span className="text-xs">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Details */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Market Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="font-mono text-xs">{market.creator}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(market.createdAt)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Resolution Date</span>
                  <span>{formatDate(market.endDate)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Status</span>
                  <span className={market.status === "active" ? "text-yes" : "text-muted-foreground"}>
                    {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Network</span>
                  <span className="flex items-center gap-1.5">
                    Pharos Testnet
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {market.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Trading Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-bold mb-5" style={{ fontFamily: "var(--font-display)" }}>
                Trade
              </h3>

              {market.status === "resolved" ? (
                <div className="text-center py-8">
                  <div
                    className={`text-4xl font-black mb-2 ${
                      market.resolution === "yes" ? "text-yes" : "text-no"
                    }`}
                  >
                    {market.resolution?.toUpperCase()}
                  </div>
                  <p className="text-muted-foreground text-sm">This market has been resolved</p>
                </div>
              ) : (
                <>
                  {/* Outcome Selector */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => setSelectedOutcome("yes")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedOutcome === "yes"
                          ? "border-yes bg-yes/10 shadow-lg shadow-yes/10"
                          : "border-border hover:border-yes/30"
                      }`}
                    >
                      <div className="text-2xl font-black text-yes mb-1">{market.yesPrice}¢</div>
                      <div className="text-xs text-muted-foreground font-medium">YES</div>
                    </button>
                    <button
                      onClick={() => setSelectedOutcome("no")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedOutcome === "no"
                          ? "border-no bg-no/10 shadow-lg shadow-no/10"
                          : "border-border hover:border-no/30"
                      }`}
                    >
                      <div className="text-2xl font-black text-no mb-1">{market.noPrice}¢</div>
                      <div className="text-xs text-muted-foreground font-medium">NO</div>
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div className="mb-5">
                    <label className="text-sm text-muted-foreground mb-2 block">Amount (PHAR)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-12 rounded-lg bg-secondary border border-border px-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        PHAR
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[10, 50, 100, 500].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmount(String(val))}
                          className="flex-1 py-1.5 rounded-md bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trade Summary */}
                  {amount && parseFloat(amount) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-lg bg-secondary/50 p-4 mb-5 space-y-2 text-sm"
                    >
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Shares</span>
                        <span className="font-semibold">{estimatedShares}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Price</span>
                        <span className="font-semibold">
                          {selectedOutcome === "yes" ? market.yesPrice : market.noPrice}¢
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border/30 pt-2">
                        <span className="text-muted-foreground">Potential Payout</span>
                        <span className="font-bold text-gold">{potentialPayout} PHAR</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Trade Button */}
                  <Button
                    onClick={handleTrade}
                    className={`w-full h-12 text-base font-bold ${
                      selectedOutcome === "yes"
                        ? "bg-yes hover:bg-yes/90 text-yes-foreground"
                        : "bg-no hover:bg-no/90 text-no-foreground"
                    }`}
                  >
                    {isConnected
                      ? `Buy ${selectedOutcome.toUpperCase()}`
                      : "Connect Wallet to Trade"}
                  </Button>
                </>
              )}
            </div>

            {/* Share Card */}
            <div className="rounded-xl border border-border/60 bg-card p-5 mt-4">
              <h4 className="text-sm font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
                Share this prediction
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleShareTwitter}
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  X / Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleShareTelegram}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
