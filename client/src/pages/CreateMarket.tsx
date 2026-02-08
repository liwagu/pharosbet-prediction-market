/*
 * Design: Social Betting Lounge
 * CreateMarket: Form to create a new prediction market
 * Colors: Deep navy bg, gold accent, card surfaces
 */
import Navbar from "@/components/Navbar";
import { useMarkets, type MarketCategory } from "@/contexts/MarketsContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Tag,
  FileText,
  HelpCircle,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";

const categories: { value: MarketCategory; label: string }[] = [
  { value: "crypto", label: "Crypto" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "tech", label: "Tech" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

export default function CreateMarket() {
  const { createMarket } = useMarkets();
  const { isConnected, connectWallet, account } = useWeb3();
  const [, setLocation] = useLocation();

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MarketCategory>("crypto");
  const [endDate, setEndDate] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields first, before wallet connect
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter resolution criteria");
      return;
    }
    if (!endDate) {
      toast.error("Please set an end date");
      return;
    }

    if (!isConnected) {
      toast.info("Connect your wallet to create a market", {
        description: "Your form data will be preserved.",
      });
      connectWallet();
      return;
    }

    const endTimestamp = new Date(endDate).getTime();
    if (endTimestamp <= Date.now()) {
      toast.error("End date must be in the future");
      return;
    }

    setIsSubmitting(true);

    // Simulate blockchain transaction delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newMarket = createMarket({
      question: question.trim(),
      description: description.trim(),
      category,
      creator: account || "0x0000...0000",
      endDate: endTimestamp,
      tags: tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });

    setIsSubmitting(false);
    toast.success("Market created successfully!", {
      description: "Your prediction market is now live on Pharos Network",
    });
    setLocation(`/market/${newMarket.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-3xl mx-auto">
        {/* Back button */}
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Markets
          </button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-black mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Create a Prediction Market
            </h1>
            <p className="text-muted-foreground">
              Ask a question about the future and let the crowd decide. Markets are deployed on Pharos Network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <HelpCircle className="w-4 h-4 text-gold" />
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Will Bitcoin exceed $150,000 by end of 2026?"
                className="w-full h-12 rounded-lg bg-secondary border border-border px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all placeholder:text-muted-foreground/50"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Frame your question so it can be answered with YES or NO. ({question.length}/200)
              </p>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <FileText className="w-4 h-4 text-gold" />
                Resolution Criteria
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly how this market will be resolved. Include specific conditions, data sources, and edge cases..."
                rows={4}
                className="w-full rounded-lg bg-secondary border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all placeholder:text-muted-foreground/50 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Clear resolution criteria help prevent disputes. Be specific about data sources and conditions.
              </p>
            </div>

            {/* Category & End Date */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border/60 bg-card p-6">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Tag className="w-4 h-4 text-gold" />
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        category === cat.value
                          ? "bg-gold/15 text-gold border border-gold/30"
                          : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-6">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Calendar className="w-4 h-4 text-gold" />
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-12 rounded-lg bg-secondary border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  The market will close at this time for resolution.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Tag className="w-4 h-4 text-gold" />
                Tags (optional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="bitcoin, crypto, price (comma separated)"
                className="w-full h-12 rounded-lg bg-secondary border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Info Banner */}
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-5 flex gap-4">
              <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gold mb-1">Before you create</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Creating a market deploys a smart contract on Pharos Network. Initial liquidity will be
                  provided automatically via the AMM. Make sure your resolution criteria are clear and
                  verifiable through oracle data.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gold-foreground/30 border-t-gold-foreground rounded-full animate-spin" />
                    Deploying on Pharos...
                  </div>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    {isConnected ? "Create Market" : "Connect Wallet to Create"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
