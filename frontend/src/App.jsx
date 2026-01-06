import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { Globe, LayoutGrid, UploadCloud, User, Wallet, ArrowRight } from "lucide-react";

import Home from "./pages/Home";
import Publish from "./pages/Publish";
import Profile from "./pages/Profile";

function App() {
  const [account, setAccount] = useState(null);

  // --- 1. INJECT GLOBAL GRID BACKGROUND ---
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      .bg-grid {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                          linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
      }
      body { margin: 0; font-family: sans-serif; }
    `;
    document.head.appendChild(styleSheet);
    
    // Check if already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) setAccount(accounts[0]);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());
      } catch (error) {
        console.error("Connection failed:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-white text-zinc-900 font-sans bg-grid selection:bg-zinc-900 selection:text-white flex flex-col">
        
        {/* --- GLOBAL NAVIGATION BAR --- */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
            
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-zinc-900 text-white p-1.5 rounded transition group-hover:rotate-12">
                <Globe size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight">
                NeuroMarket<span className="text-zinc-400">_OS</span>
              </span>
            </Link>

            {/* LINKS */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
              <Link to="/" className="flex items-center gap-2 hover:text-zinc-900 transition">
                <LayoutGrid size={16} /> Marketplace
              </Link>
              <Link to="/publish" className="flex items-center gap-2 hover:text-zinc-900 transition">
                <UploadCloud size={16} /> Deploy Asset
              </Link>
              <Link to="/profile" className="flex items-center gap-2 hover:text-zinc-900 transition">
                <User size={16} /> Workspace
              </Link>
            </div>

            {/* WALLET BUTTON */}
            <div>
              {account ? (
                <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono font-bold text-zinc-700">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="bg-zinc-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-zinc-800 transition flex items-center gap-2 shadow-lg shadow-zinc-200"
                >
                  <Wallet size={16} /> Connect Wallet
                </button>
              )}
            </div>

          </div>
        </nav>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>

        {/* --- SIMPLE FOOTER --- */}
        <footer className="border-t border-zinc-100 py-8 mt-12">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <p className="text-xs text-zinc-400 font-mono">
                    NEUROMARKET DECENTRALIZED PROTOCOL • V2.0 • LOCALHOST
                </p>
            </div>
        </footer>

      </div>
    </Router>
  );
}

export default App;