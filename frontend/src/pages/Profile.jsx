import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios"; 

// ⚠️ CHECK: Make sure these match your specific project details
const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Your Contract Address
const DAEMON_URL = "http://localhost:5000"; // Your Python Backend URL

const Profile = () => {
  const [myListings, setMyListings] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState("");
  
  // Stores the results from Python (e.g., "Identified: Sports Car")
  const [computeResults, setComputeResults] = useState({}); 
  
  // Stores the User's choice (e.g., "ai_image" or "health_train")
  const [selectedAlgo, setSelectedAlgo] = useState("analyze_size");

  const marketAbi = [
    "function getAllDatasets() external view returns (address[])",
    "function listings(address) public view returns (address dataTokenAddress, address publisher, uint256 price, bool isActive, uint256 stakedAmount, string ipfsHash)",
    "event FilePurchased(address indexed buyer, string dataTokenURI)"
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);

        const marketContract = new ethers.Contract(MARKET_ADDRESS, marketAbi, provider);

        // 1. Fetch All Listings (to find details for purchases)
        const allAddresses = await marketContract.getAllDatasets();
        const allData = await Promise.all(allAddresses.map(async (addr) => {
          const details = await marketContract.listings(addr);
          return {
             id: addr,
             publisher: details.publisher,
             price: ethers.formatUnits(details.price, 18),
             ipfsHash: details.ipfsHash,
             isActive: details.isActive
          };
        }));

        // Filter: What did I publish?
        setMyListings(allData.filter(item => item.publisher.toLowerCase() === address.toLowerCase()));

        // 2. Fetch My Purchases (Events)
        const filter = marketContract.filters.FilePurchased(address);
        const events = await marketContract.queryFilter(filter);
        
        // Map events back to full data details
        const purchases = events.map(e => {
          const ipfsHash = e.args[1];
          const originalDetails = allData.find(d => d.ipfsHash === ipfsHash);
          return {
            ipfsHash: ipfsHash,
            ...originalDetails // Spread original details (price, publisher, etc.)
          };
        });
        
        setMyPurchases(purchases);

      } catch (error) {
        console.error("Profile Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // --- THE CORE FUNCTION: TRIGGER COMPUTE ---
  const handleCompute = async (ipfsHash) => {
    // 1. Show "Loading..." state immediately
    setComputeResults(prev => ({ 
        ...prev, 
        [ipfsHash]: `⏳ Connecting to Daemon... Running '${selectedAlgo}'...` 
    }));

    try {
      // 2. Send Request to Python (Hash + Algo Choice)
      const response = await axios.post(`${DAEMON_URL}/compute`, {
        ipfsHash: ipfsHash,
        algo: selectedAlgo // <--- Sending the Dropdown Value!
      });
      
      // 3. Show Success Message
      setComputeResults(prev => ({ 
          ...prev, 
          [ipfsHash]: `✅ ${response.data.result}` 
      }));

    } catch (error) {
      console.error("Daemon Error:", error);
      setComputeResults(prev => ({ 
          ...prev, 
          [ipfsHash]: "❌ Error: Daemon offline or Data not found." 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-10 text-white font-sans">
      <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        👤 User Dashboard
      </h1>
      <p className="text-gray-400 mb-10 font-mono text-sm">Wallet: {userAddress}</p>

      {loading ? (
        <div className="text-xl animate-pulse">Loading Blockchain Data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* === SECTION 1: MY LIBRARY (PURCHASED) === */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center gap-2">
              📚 My Library <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">Compute Access</span>
            </h2>
            
            {myPurchases.length === 0 ? (
              <p className="text-gray-500 italic">You haven't purchased any datasets yet.</p>
            ) : (
              <div className="space-y-6">
                {myPurchases.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 p-5 rounded-xl border border-slate-700 hover:border-blue-500 transition duration-300">
                    
                    {/* File Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="font-bold text-lg text-white">📦 Data: {item.ipfsHash.slice(0, 15)}...</div>
                            <div className="text-xs text-gray-500">Publisher: {item.publisher?.slice(0,10)}...</div>
                        </div>
                        <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded">Owned</span>
                    </div>
                    
                    {/* COMPUTE CONTROLS */}
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">
                            Select AI Model:
                        </label>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* 1. DROPDOWN MENU */}
                            <select 
                                value={selectedAlgo}
                                onChange={(e) => setSelectedAlgo(e.target.value)} 
                                className="bg-slate-700 text-white text-sm p-2 rounded border border-slate-600 outline-none flex-grow hover:bg-slate-600 cursor-pointer"
                            >
                                <option value="analyze_size">📊 Simple Check (File Size)</option>
                                <option value="ai_image">🧠 MobileNet V2 (Image AI)</option>
                                <option value="health_train">🏥 Health Prediction (CSV)</option>
                                <option value="nlp_train">📜 Story Analyzer (NLP)</option>
                            </select>

                            {/* 2. RUN BUTTON */}
                            <button 
                                onClick={() => handleCompute(item.ipfsHash)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg transform active:scale-95 transition"
                            >
                                ⚡ Run Compute
                            </button>
                        </div>
                    </div>

                    {/* 3. RESULT DISPLAY AREA */}
                    {computeResults[item.ipfsHash] && (
                      <div className={`mt-4 p-3 rounded border text-sm font-mono whitespace-pre-wrap ${
                          computeResults[item.ipfsHash].includes("Error") 
                          ? "bg-red-900/30 border-red-500 text-red-300" 
                          : "bg-black/50 border-green-500/50 text-green-400 shadow-inner"
                      }`}>
                        {computeResults[item.ipfsHash]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === SECTION 2: MY LISTINGS (PUBLISHED) === */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl opacity-80">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">🏷️ My Listings</h2>
            {myListings.length === 0 ? (
               <p className="text-gray-500 italic">No listings found.</p>
            ) : (
              <div className="space-y-4">
                {myListings.map((item) => (
                  <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                        <span className="font-bold block text-gray-300">Data: {item.ipfsHash.slice(0,10)}...</span>
                        <span className="text-xs text-green-500">● Active</span>
                    </div>
                    <div className="text-purple-400 font-mono font-bold">{item.price} NRO</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Profile;