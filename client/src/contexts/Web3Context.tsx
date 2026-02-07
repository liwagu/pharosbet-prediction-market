import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner, formatEther } from "ethers";

// Pharos Testnet Configuration
export const PHAROS_CONFIG = {
  chainId: "0xA8338", // 688888 in hex
  chainName: "Pharos Testnet",
  rpcUrl: "https://testnet.dplabs-internal.com",
  blockExplorer: "https://testnet.pharosscan.xyz",
  nativeCurrency: {
    name: "PHAR",
    symbol: "PHAR",
    decimals: 18,
  },
};

interface Web3ContextType {
  account: string | null;
  balance: string;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isConnecting: boolean;
  isConnected: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToPharos: () => Promise<void>;
  shortenAddress: (addr: string) => string;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const isConnected = !!account;

  const shortenAddress = useCallback((addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  const switchToPharos = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: PHAROS_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: PHAROS_CONFIG.chainId,
              chainName: PHAROS_CONFIG.chainName,
              rpcUrls: [PHAROS_CONFIG.rpcUrl],
              blockExplorerUrls: [PHAROS_CONFIG.blockExplorer],
              nativeCurrency: PHAROS_CONFIG.nativeCurrency,
            },
          ],
        });
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setIsConnecting(true);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const walletSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const bal = await browserProvider.getBalance(accounts[0]);

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAccount(accounts[0]);
      setBalance(formatEther(bal));
      setChainId(Number(network.chainId));
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance("0");
    setSigner(null);
    setProvider(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnectWallet]);

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        signer,
        provider,
        isConnecting,
        isConnected,
        chainId,
        connectWallet,
        disconnectWallet,
        switchToPharos,
        shortenAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
  return context;
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
