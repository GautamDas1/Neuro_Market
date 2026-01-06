import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { Globe, LayoutGrid, UploadCloud, User, LogOut } from "lucide-react";
import { Toaster } from 'react-hot-toast';

import Home from "./pages/Home";
import Publish from "./pages/Publish";
import Profile from "./pages/Profile";
import Login from "./pages/Login";

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. GLOBAL STYLES
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
    
    // 2. 🚨 SECURITY MONITOR: WATCH FOR WALLET SWITCHING
    if (window.ethereum) {
        window.ethereum.on("accountsChanged", (accounts) => {
            // If user switches account in MetaMask -> Force Logout
            console.log("Wallet switched. Ending session.");
            localStorage.removeItem("neuro_session");
            setAccount(null);
            window.location.href = "/"; // Kick to Login Page
        });

        window.ethereum.on("chainChanged", () => {
            window.location.reload();
        });
    }
    
    // 3. CHECK EXISTING SESSION
    const session = localStorage.getItem("neuro_session");
    if (session === "active") {
        checkConnection();
    } else {
        setLoading(false);
    }

  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
            setAccount(accounts[0]);
        } else {
            // Wallet is locked or disconnected -> clear session
            localStorage.removeItem("neuro_session");
            setLoading(false);
        }
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  };

  const handleLogout = () => {
      localStorage.removeItem("neuro_session");
      setAccount(null);
      window.location.href = "/";
  };

  if (loading) return null;

  return (
    <Router>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
            style: {
                background: '#18181b',
                color: '#fff',
                border: '1px solid #3f3f46',
                fontFamily: 'monospace',
                fontSize: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {!account ? (
        <Routes>
            <Route path="*" element={<Login setAccount={setAccount} />} />
        </Routes>
      ) : (
        <div className="min-h-screen bg-white text-zinc-900 font-sans bg-grid selection:bg-zinc-900 selection:text-white flex flex-col">
            
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
            <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
                
                <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-zinc-900 text-white p-1.5 rounded transition group-hover:rotate-12">
                    <Globe size={20} />
                </div>
                <span className="font-bold text-lg tracking-tight">
                    NeuroMarket<span className="text-zinc-400">_OS</span>
                </span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
                <Link to="/" className="flex items-center gap-2 hover:text-zinc-900 transition"><LayoutGrid size={16} /> Market</Link>
                <Link to="/publish" className="flex items-center gap-2 hover:text-zinc-900 transition"><UploadCloud size={16} /> Deploy</Link>
                <Link to="/profile" className="flex items-center gap-2 hover:text-zinc-900 transition"><User size={16} /> Workspace</Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-mono font-bold text-zinc-700">
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </span>
                    </div>

                    <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition ml-2" title="Log Out">
                        <LogOut size={18} />
                    </button>
                </div>

            </div>
            </nav>

            <div className="flex-grow">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/publish" element={<Publish />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            </div>
            
            <footer className="border-t border-zinc-100 py-6 mt-12 text-center">
                <p className="text-[10px] text-zinc-400 font-mono">SECURE CONNECTION ESTABLISHED • PORT 443</p>
            </footer>
        </div>
      )}
    </Router>
  );
}

export default App;