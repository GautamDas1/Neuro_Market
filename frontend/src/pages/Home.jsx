import { useState, useEffect } from "react";
import { ethers } from "ethers";

// ⚠️ ENSURE THESE MATCH PUBLISH.JSX ⚠️
const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

const Home = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState("");

  const marketAbi = [
    "function getAllDatasets() external view returns (address[])",
    "function listings(address) public view returns (address dataTokenAddress, address publisher, uint256 price, bool isActive, uint256 stakedAmount, string ipfsHash)",
    "function buyAccess(address _dataTokenAddress) external"
  ];

  const tokenAbi = ["function approve(address spender, uint256 amount) public returns (bool)"];

  useEffect(() => {
    checkWallet();
    loadData();

    // Auto-reload when MetaMask account changes
    if(window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
    }
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
      const contract = new ethers.Contract(MARKET_ADDRESS, marketAbi, provider);

      // 1. Get List of Addresses
      const addresses = await contract.getAllDatasets();
      
      // 2. Fetch Details for EACH Address
      const items = await Promise.all(addresses.map(async (addr) => {
        const details = await contract.listings(addr);
        return {
           id: addr, 
           publisher: details.publisher,
           price: ethers.formatUnits(details.price, 18),
           ipfsHash: details.ipfsHash,
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
    try {
      if (!window.ethereum) return alert("Install MetaMask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signer);
      const marketContract = new ethers.Contract(MARKET_ADDRESS, marketAbi, signer);

      const priceWei = ethers.parseUnits(price, 18);
      
      // Approve
      const tx1 = await tokenContract.approve(MARKET_ADDRESS, priceWei);
      await tx1.wait();

      // Buy 
      const tx2 = await marketContract.buyAccess(datasetAddress);
      await tx2.wait();

      alert("✅ Purchased Successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Buy Error:", err);
      alert("Purchase Failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-10 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          NeuroMarketplace V2
        </h1>
        <div className="flex items-center gap-4">
          <span className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 text-sm">
             {userAddress ? `👤 ${userAddress.slice(0,6)}...${userAddress.slice(-4)}` : "Not Connected"}
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center mt-20 text-xl">Loading Blockchain Data...</div>
      ) : datasets.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
          <p className="text-2xl">📭 No datasets found.</p>
          <p>Go to the Publish page to list the first item!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {datasets.map((item) => (
            <div key={item.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
               {/* Status Badge */}
               <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold ${item.isActive ? "bg-green-600" : "bg-red-600"}`}>
                 {item.isActive ? "FOR SALE" : "SOLD"}
               </div>

              <div className="flex justify-between items-start mb-4 mt-2">
                <span className="bg-purple-900 text-purple-200 text-xs px-2 py-1 rounded">
                   ID: {item.id.slice(0,6)}...
                </span>
              </div>
              
              <h2 className="text-xl font-bold mb-2 break-all text-white">Data: {item.ipfsHash}</h2>
              <p className="text-gray-400 text-sm mb-4">Publisher: {item.publisher.slice(0,6)}...</p>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <span className="text-2xl font-bold text-purple-400">{item.price} NRO</span>
                
                {/* Disable Buy Button if I am the Owner */}
                {item.publisher.toLowerCase() === userAddress.toLowerCase() ? (
                   <button disabled className="bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-bold cursor-not-allowed">
                     You Own This
                   </button>
                ) : (
                   <button 
                    onClick={() => buyDataset(item.id, item.price)}
                    className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-purple-900/50"
                  >
                    Buy Access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;