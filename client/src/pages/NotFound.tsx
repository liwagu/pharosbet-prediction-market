import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B1120]">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 text-center px-6">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl scale-150" />
            <div className="relative w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-7xl font-bold text-white mb-3 font-mono tracking-tight">404</h1>
        <h2 className="text-xl font-semibold text-slate-300 mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Maybe the market already resolved?
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-6 py-2.5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5"
          >
            <Home className="w-4 h-4 mr-2" />
            Browse Markets
          </Button>
        </div>
      </div>
    </div>
  );
}
