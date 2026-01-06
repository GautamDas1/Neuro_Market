import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Globe, Search, Database, Shield, ShoppingCart, Lock } from "lucide-react";
// IMPORT TOAST
import toast from 'react-hot-toast';

// ⚠️ YOUR ADDRESSES
const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

const Home = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState("");
  const [purchasing, setPurchasing] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkWallet();
    loadData();
  }, []);

  const checkWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setUserAddress(await signer.getAddress());
    }
  };

  const loadData = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(MARKET_ADDRESS, [
        "function getAllDatasets() external view returns (address[])",
        "function listings(address) public view returns (address dataTokenAddress, address publisher, uint256 price, bool isActive, uint256 stakedAmount, string ipfsHash)"
      ], provider);

      const addresses = await contract.getAllDatasets();
      
      const items = await Promise.all(addresses.map(async (addr) => {
        const details = await contract.listings(addr);
        const parts = details.ipfsHash.split("||");
        return {
           id: addr, 
           publisher: details.publisher,
           price: ethers.formatUnits(details.price, 18),
           ipfsHash: parts[0],
           name: parts[1] || `Dataset_${addr.slice(0,4)}`, 
           isActive: details.isActive
        };
      }));
      
      setDatasets(items);
    } catch (error) {
      console.error("Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const buyDataset = async (datasetAddress, price) => {
    setPurchasing(datasetAddress);
    const toastId = toast.loading("Processing Transaction..."); // Loading Toast

    try {
      if (!window.ethereum) return toast.error("MetaMask not found!");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ["function approve(address spender, uint256 amount) public returns (bool)"], signer);
      const marketContract = new ethers.Contract(MARKET_ADDRESS, ["function buyAccess(address _dataTokenAddress) external"], signer);

      const priceWei = ethers.parseUnits(price, 18);
      
      const tx1 = await tokenContract.approve(MARKET_ADDRESS, priceWei);
      await tx1.wait();

      const tx2 = await marketContract.buyAccess(datasetAddress);
      await tx2.wait();

      // SUCCESS TOAST
      toast.success("ACCESS GRANTED: Dataset acquired.", { id: toastId });
      
      loadData(); 

    } catch (err) {
      console.error("Buy Error:", err);
      toast.error("TRANSACTION FAILED: " + (err.reason || "Unknown Error"), { id: toastId });
    } finally {
        setPurchasing(null);
    }
  };

  const filteredDatasets = datasets.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.publisher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans bg-grid selection:bg-zinc-900 selection:text-white">
      
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-12">
        
        <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tighter text-zinc-900">Global Data Index</h1>
            <p className="text-zinc-500 font-medium">Acquire encrypted datasets for decentralized computation.</p>
            
            <div className="relative group max-w-md mt-4">
                <Search className="absolute left-3 top-3 text-zinc-400" size={16} />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search datasets..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded text-sm text-zinc-700 focus:outline-none focus:border-zinc-900 transition font-medium"
                />
            </div>
        </div>

        {loading ? (
             <div className="border border-zinc-200 bg-white p-12 text-center">
                <div className="inline-block w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-400 text-sm font-mono">SYNCHRONIZING BLOCKCHAIN...</p>
             </div>
        ) : filteredDatasets.length === 0 ? (
            <div className="border border-dashed border-zinc-200 p-12 text-center rounded">
                <p className="text-zinc-400 font-bold">NO DATA FOUND</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDatasets.map((item) => (
                    <div key={item.id} className="bg-white border border-zinc-200 rounded group hover:border-zinc-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
                        
                        {!item.isActive && (
                            <div className="absolute top-0 right-0 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 z-10">SOLD OUT</div>
                        )}

                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <div className="bg-zinc-50 border border-zinc-100 p-2 rounded text-zinc-900">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-zinc-900 font-mono">{item.name}</h3>
                                        <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">ID: {item.id.slice(0,8)}...</p>
                                    </div>
                                </div>
                                <Shield size={14} className="text-zinc-300" />
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs border-b border-dashed border-zinc-100 pb-1">
                                    <span className="text-zinc-400">Publisher</span>
                                    <span className="font-mono text-zinc-600">{item.publisher.slice(0,6)}...</span>
                                </div>
                                <div className="flex justify-between text-xs pb-1">
                                    <span className="text-zinc-400">Status</span>
                                    <span className={`font-mono font-bold ${item.isActive ? "text-emerald-600" : "text-red-500"}`}>
                                        {item.isActive ? "AVAILABLE" : "SOLD"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-50 border-t border-zinc-100 p-4 flex items-center justify-between">
                            <div>
                                <span className="block text-[10px] text-zinc-400 uppercase font-bold">Price</span>
                                <span className="text-lg font-bold text-zinc-900 font-mono">{item.price} NRO</span>
                            </div>
                            
                            {item.publisher.toLowerCase() === userAddress.toLowerCase() ? (
                                <button disabled className="bg-zinc-200 text-zinc-400 px-4 py-2 rounded text-sm font-bold cursor-not-allowed flex items-center gap-2">
                                    Owner <Lock size={12}/>
                                </button>
                            ) : (
                                <button 
                                    onClick={() => buyDataset(item.id, item.price)}
                                    disabled={!item.isActive || purchasing === item.id}
                                    className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-zinc-800 transition flex items-center gap-2 disabled:opacity-50 active:transform active:translate-y-px"
                                >
                                    {purchasing === item.id ? "Syncing..." : "Purchase"}
                                    {purchasing !== item.id && <ShoppingCart size={14} />}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default Home;