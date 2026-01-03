import { useState, useEffect } from "react";
import { ethers } from "ethers";

// ⚠️ PASTE YOUR TERMINAL ADDRESSES HERE ⚠️
const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

const Profile = () => {
  const [myListings, setMyListings] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState("");

  const marketAbi = [
    "function getAllDatasets() external view returns (address[])",
    "function listings(address) public view returns (address dataTokenAddress, address publisher, uint256 price, bool isActive, uint256 stakedAmount, string ipfsHash)",
    "event FilePurchased(address indexed buyer, string dataTokenURI)" // <--- We need this to find your buys!
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

        // --- 1. FETCH ALL DATASETS (To find names & details) ---
        const allAddresses = await marketContract.getAllDatasets();
        const allData = await Promise.all(allAddresses.map(async (addr) => {
          const details = await marketContract.listings(addr);
          return {
             id: addr,
             publisher: details.publisher,
             price: ethers.formatUnits(details.price, 18),
             ipfsHash: details.ipfsHash,
             isActive: details.isActive,
             // We'll use this simply to match IPFS hashes later
             name: "Dataset " + addr.slice(0,6) // (If you stored Name on-chain we could fetch it, but for now we use ID)
          };
        }));

        // --- 2. FILTER: MY LISTINGS (Things I published) ---
        const myUploads = allData.filter(item => item.publisher.toLowerCase() === address.toLowerCase());
        setMyListings(myUploads);

        // --- 3. FILTER: MY PURCHASES (Things I bought) ---
        // We look for the "FilePurchased" receipt where 'buyer' == ME
        const filter = marketContract.filters.FilePurchased(address);
        const events = await marketContract.queryFilter(filter);
        
        // Map the events to the actual file data
        const purchases = events.map(e => {
          const ipfsHash = e.args[1]; // The 2nd argument in the event is the Hash
          // Try to find the original listing details to make it look nice
          const originalDetails = allData.find(d => d.ipfsHash === ipfsHash);
          return {
            ipfsHash: ipfsHash,
            timestamp: e.blockNumber,
            ...originalDetails // Merge with price/publisher info if found
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

  return (
    <div className="min-h-screen bg-slate-900 p-10 text-white">
      <h1 className="text-4xl font-bold mb-2">👤 User Profile</h1>
      <p className="text-gray-400 mb-10">Wallet: {userAddress}</p>

      {loading ? (
        <div>Loading Profile...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* SECTION 1: MY LIBRARY (BOUGHT) */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-green-400">📚 My Library (Purchased)</h2>
            {myPurchases.length === 0 ? (
              <p className="text-gray-500">You haven't bought anything yet.</p>
            ) : (
              <div className="space-y-4">
                {myPurchases.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">📦 {item.ipfsHash.slice(0, 15)}...</div>
                      <div className="text-xs text-gray-500">Purchased from: {item.publisher ? item.publisher.slice(0,6) : "Unknown"}...</div>
                    </div>
                    <a 
                      href={`https://ipfs.io/ipfs/${item.ipfsHash.replace("ipfs://", "")}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-bold"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MY LISTINGS (SOLD) */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">🏷️ My Listings (Published)</h2>
            {myListings.length === 0 ? (
              <p className="text-gray-500">You haven't published any datasets.</p>
            ) : (
              <div className="space-y-4">
                {myListings.map((item) => (
                  <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span className="font-bold">Data: {item.ipfsHash.slice(0,10)}...</span>
                      <span className={`text-xs px-2 py-1 rounded ${item.isActive ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                        {item.isActive ? "ACTIVE" : "SOLD"}
                      </span>
                    </div>
                    <div className="mt-2 text-purple-400 font-mono text-sm">{item.price} NRO</div>
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