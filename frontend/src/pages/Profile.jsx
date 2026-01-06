import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { Terminal, Box, Activity, Server, Lock, ArrowRight, Command, Power, RefreshCw, User, Edit2, Save } from "lucide-react";
// 1. IMPORT TOAST
import toast from 'react-hot-toast';

// ⚠️ YOUR ADDRESSES
const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
const DAEMON_URL = "http://localhost:5000"; 

const Profile = () => {
  const [myListings, setMyListings] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [computeResults, setComputeResults] = useState({}); 
  const [selectedAlgo, setSelectedAlgo] = useState("ai_image");
  
  const [nodeStatus, setNodeStatus] = useState("CONNECTING...");
  const [latency, setLatency] = useState(0);
  const [isOnline, setIsOnline] = useState(false);

  // 👤 SIMPLE IDENTITY STATE (No Email/Bio)
  const [isEditing, setIsEditing] = useState(false);
  const [identity, setIdentity] = useState({ name: "Loading...", role: "..." });

  useEffect(() => {
    // Load Simple Identity
    const storedName = localStorage.getItem("neuro_user") || "Anonymous";
    const storedRole = localStorage.getItem("neuro_role") || "Node Operator";
    setIdentity({ name: storedName, role: storedRole });

    loadProfile();
  }, []);

  const saveIdentity = () => {
      localStorage.setItem("neuro_user", identity.name);
      localStorage.setItem("neuro_role", identity.role);
      setIsEditing(false);
      toast.success("IDENTITY UPDATED");
  };

  const loadProfile = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);

        const marketContract = new ethers.Contract(MARKET_ADDRESS, [
            "function getAllDatasets() external view returns (address[])",
            "function listings(address) public view returns (address, address, uint256, bool, uint256, string)",
            "event FilePurchased(address indexed buyer, string dataTokenURI)"
        ], provider);

        const allAddresses = await marketContract.getAllDatasets();
        const allData = await Promise.all(allAddresses.map(async (addr) => {
          const d = await marketContract.listings(addr);
          const parts = d[5].split("||");
          return { id: addr, publisher: d[1], price: ethers.formatUnits(d[2], 18), ipfsHash: parts[0], name: parts[1] || "Dataset", isActive: d[3] };
        }));

        setMyListings(allData.filter(item => item.publisher.toLowerCase() === address.toLowerCase()));

        const filter = marketContract.filters.FilePurchased(address);
        const events = await marketContract.queryFilter(filter);
        const purchases = events.map(e => {
          const rawHash = e.args[1];
          const parts = rawHash.split("||");
          return { ipfsHash: parts[0], name: parts[1] || "Dataset" };
        });
        setMyPurchases(purchases);
      } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    const checkNode = async () => {
        const start = Date.now();
        try {
            await axios.get(`${DAEMON_URL}/health`, { timeout: 2000 });
            const end = Date.now();
            setLatency(end - start); 
            setIsOnline(true);
            setNodeStatus("OPERATIONAL");
        } catch (error) {
            setLatency(0);
            setIsOnline(false);
            setNodeStatus("OFFLINE");
        }
    };
    checkNode();
    const interval = setInterval(checkNode, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCompute = async (ipfsHash) => {
    setComputeResults(prev => ({ ...prev, [ipfsHash]: "Initializing..." })); 
    // 2. USE TOAST
    const toastId = toast.loading("Allocating Compute Resources...");

    try {
      const response = await axios.post(`${DAEMON_URL}/compute`, { ipfsHash, algo: selectedAlgo });
      setComputeResults(prev => ({ ...prev, [ipfsHash]: response.data.result }));
      toast.success("COMPUTE SUCCESSFUL", { id: toastId });
    } catch (error) {
      setComputeResults(prev => ({ ...prev, [ipfsHash]: "Error: Daemon Connection Failed" }));
      toast.error("COMPUTE FAILED", { id: toastId });
    }
  };

  const toggleStatus = async (datasetAddress) => {
      setProcessing(datasetAddress);
      // 3. USE TOAST
      const toastId = toast.loading("Updating Blockchain Status...");

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const marketContract = new ethers.Contract(MARKET_ADDRESS, ["function toggleStatus(address _dataToken) external"], signer);
        const tx = await marketContract.toggleStatus(datasetAddress);
        await tx.wait();
        
        await loadProfile(); 
        toast.success("STATUS UPDATED", { id: toastId });

      } catch (error) { 
          console.error("Unpublish Error:", error); 
          toast.error("UPDATE FAILED: " + (error.reason || "Unknown"), { id: toastId });
      } 
      finally { setProcessing(null); }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white bg-grid">
      
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-12">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-zinc-200 pb-8">
            <div className="flex flex-col gap-2 border-l-2 border-zinc-900 pl-6">
                <h1 className="text-4xl font-bold tracking-tighter text-zinc-900">User Workspace</h1>
                <p className="text-zinc-500 font-medium">Manage datasets and execute decentralized algorithms.</p>
            </div>

            {/* 👤 SIMPLE IDENTITY CARD (Clean Version) */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center gap-4 w-full md:w-auto min-w-[300px]">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white">
                    <User size={24} />
                </div>
                <div className="flex-grow">
                    {isEditing ? (
                        <div className="space-y-2">
                            <input 
                                className="w-full text-sm font-bold bg-white border border-zinc-300 rounded px-2 py-1"
                                value={identity.name}
                                onChange={(e) => setIdentity({...identity, name: e.target.value})}
                            />
                            <input 
                                className="w-full text-xs font-mono bg-white border border-zinc-300 rounded px-2 py-1"
                                value={identity.role}
                                onChange={(e) => setIdentity({...identity, role: e.target.value})}
                            />
                        </div>
                    ) : (
                        <div>
                            <div className="font-bold text-zinc-900">{identity.name}</div>
                            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wide">{identity.role}</div>
                        </div>
                    )}
                </div>
                <button onClick={() => isEditing ? saveIdentity() : setIsEditing(true)} className="text-zinc-400 hover:text-zinc-900">
                    {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                </button>
            </div>
        </div>

        {/* REST OF THE PAGE (UNCHANGED LOGIC) */}
        {loading ? (
            <div className="border border-zinc-200 p-12 text-center text-zinc-400 animate-pulse bg-white">
                Loading Assets...
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: COMPUTE TERMINALS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                            <Terminal size={14} /> Active Environments
                        </h2>
                    </div>

                    {myPurchases.length === 0 ? (
                        <div className="bg-zinc-50 border border-zinc-200 p-8 rounded text-center text-zinc-500 text-sm">
                            No environments allocated. Purchase data to begin.
                        </div>
                    ) : (
                        myPurchases.map((item, idx) => (
                            <div key={idx} className="bg-white border border-zinc-200 rounded shadow-sm hover:shadow-lg hover:border-zinc-400 transition-all duration-200 group">
                                <div className="p-5 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50">
                                    <div className="flex gap-4">
                                        <div className="bg-white border border-zinc-200 p-2 rounded text-zinc-900">
                                            <Server size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-zinc-900 font-mono">{item.name}</h3>
                                            <p className="text-xs text-zinc-500 font-mono mt-1">{item.ipfsHash.slice(0,15)}...</p>
                                        </div>
                                    </div>
                                    <Lock size={14} className="text-zinc-400" />
                                </div>

                                <div className="p-5">
                                    <div className="flex gap-2 mb-4">
                                        <div className="relative flex-grow">
                                            <select 
                                                value={selectedAlgo}
                                                onChange={(e) => setSelectedAlgo(e.target.value)} 
                                                className="w-full bg-white text-zinc-700 text-sm py-2 px-3 rounded border border-zinc-200 outline-none focus:border-zinc-900 appearance-none font-medium cursor-pointer"
                                            >
                                                <option value="ai_image">Model: MobileNet V2 (Vision)</option>
                                                <option value="health_train">Model: Linear Regression (Health)</option>
                                                <option value="nlp_train">Model: NLP Analyzer (Text)</option>
                                                <option value="analyze_size">Utility: File Integrity Check</option>
                                            </select>
                                            <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-400">
                                                <Command size={14} />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleCompute(item.ipfsHash)}
                                            className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-zinc-800 transition flex items-center gap-2 active:transform active:translate-y-px"
                                        >
                                            Run <ArrowRight size={14} />
                                        </button>
                                    </div>

                                    <div className="bg-zinc-50 border border-zinc-200 rounded p-4 min-h-[80px]">
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2">System Output</div>
                                        <div className={`font-mono text-xs whitespace-pre-wrap ${
                                            computeResults[item.ipfsHash]?.includes("Error") ? "text-red-600" : "text-zinc-800"
                                        }`}>
                                            {computeResults[item.ipfsHash] || "_"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* RIGHT: INVENTORY */}
                <div className="space-y-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Box size={14} /> Inventory
                    </h2>

                    <div className="bg-white border border-zinc-200 rounded">
                        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                            <span className="text-sm font-bold text-zinc-700">My Listings</span>
                            <span className="bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded text-xs font-bold">{myListings.length}</span>
                        </div>
                        
                        <div className="divide-y divide-zinc-100">
                            {myListings.length === 0 ? (
                                <div className="p-4 text-xs text-zinc-400 text-center">No listings active.</div>
                            ) : (
                                myListings.map((item, idx) => (
                                    <div key={idx} className={`p-4 transition flex justify-between items-center ${item.isActive ? "hover:bg-zinc-50" : "bg-zinc-50 opacity-60"}`}>
                                        <div>
                                            <div className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                                                {item.name}
                                                {!item.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">INACTIVE</span>}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.price} NRO</div>
                                        </div>
                                        <button 
                                            onClick={() => toggleStatus(item.id)}
                                            disabled={processing === item.id}
                                            className={`p-2 rounded border transition ${
                                                item.isActive 
                                                ? "border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50" 
                                                : "border-green-200 text-green-500 hover:bg-green-50"
                                            }`}
                                        >
                                            {processing === item.id ? <RefreshCw size={14} className="animate-spin"/> : <Power size={14} />}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={`rounded p-5 transition-colors duration-500 ${isOnline ? "bg-zinc-900 text-white" : "bg-red-50 border border-red-200 text-red-900"}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Activity size={18} className={isOnline ? "text-emerald-400" : "text-red-500 animate-pulse"} />
                            <span className="font-bold text-sm">Node Status</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className={`text-[10px] uppercase ${isOnline ? "text-zinc-400" : "text-red-400"}`}>Status</div>
                                <div className={`font-mono font-bold ${isOnline ? "text-emerald-400" : "text-red-600"}`}>
                                    {isOnline ? "ONLINE" : "OFFLINE"}
                                </div>
                            </div>
                            <div>
                                <div className={`text-[10px] uppercase ${isOnline ? "text-zinc-400" : "text-red-400"}`}>Real Latency</div>
                                <div className={`font-mono font-bold ${isOnline ? "text-emerald-400" : "text-red-600"}`}>
                                    {isOnline ? `${latency}ms` : "---"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Profile;