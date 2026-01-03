import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ethers } from "ethers";
import Home from "./pages/Home";
import Publish from "./pages/Publish";
import Profile from "./pages/Profile";

function App() {
  const [account, setAccount] = useState(null);

  // --- WALLET CONNECTION LOGIC ---
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
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        
        {/* --- NAVIGATION BAR --- */}
        <nav className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800 shadow-lg">
          <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            NeuroMarket 🧠
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-purple-400 transition font-medium">Marketplace</Link>
            <Link to="/publish" className="hover:text-purple-400 transition font-medium">Publish</Link>
            <Link to="/profile" className="hover:text-purple-400 transition font-medium">Dashboard</Link>
            
            {/* LOGIN BUTTON */}
            {account ? (
              <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-mono border border-green-500/50">
                ● {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            ) : (
              <button 
                onClick={connectWallet}
                className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg font-bold transition shadow-lg shadow-purple-500/20"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </nav>

        {/* --- PAGE CONTENT --- */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;