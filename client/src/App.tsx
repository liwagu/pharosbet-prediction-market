import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MarketDetail from "./pages/MarketDetail";
import CreateMarket from "./pages/CreateMarket";
import { Web3Provider } from "./contexts/Web3Context";
import { MarketsProvider } from "./contexts/MarketsContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/market/:id" component={MarketDetail} />
      <Route path="/create" component={CreateMarket} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Web3Provider>
          <MarketsProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </MarketsProvider>
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
