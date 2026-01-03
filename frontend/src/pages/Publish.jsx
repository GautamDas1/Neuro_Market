import { useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ⚠️ YOUR CONTRACT ADDRESSES
const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

// ⚠️ YOUR PINATA JWT
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1MDIyMjdjMC02MGZhLTRiNmMtOTg0MC04OGM5MWNkZGE3NDIiLCJlbWFpbCI6ImdhdXRhbWtkNTc2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJkYmE2ODk1ZDUyYWQyNjEzMmE3NCIsInNjb3BlZEtleVNlY3JldCI6IjRjNDMzMmJlODc0NWFkYWM2MGJiZTMwMTdjNjVkYmY4NGM2YjQ2YmY1ZjYxNGNjOGM1MDhkYWRmNTIwN2Q3ODkiLCJleHAiOjE3OTg3OTEyNzh9.RzHVbZF7QEnDQVWNvMRcU289FCHeEs0yDU7r8M-IkJk"; 

const Publish = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [file, setFile] = useState(null);
  
  // Added 'mode' back to state (Default: 0)
  const [formData, setFormData] = useState({ name: "", price: "", description: "", mode: "0" });

  const addLog = (msg) => setLogs(prev => [...prev, msg]);
  
  const handleFileChange = (e) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const uploadToPinata = async (fileToUpload) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    let data = new FormData();
    data.append('file', fileToUpload);

    const res = await axios.post(url, data, {
      maxBodyLength: "Infinity",
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });
    return res.data.IpfsHash; 
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first!");
    
    setLoading(true);
    setLogs([]);

    try {
      if (!window.ethereum) return alert("Please install MetaMask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 1. Upload
      addLog("📤 Uploading File to IPFS...");
      const ipfsCid = await uploadToPinata(file);
      const realIpfsUrl = `ipfs://${ipfsCid}`;
      addLog(`✅ Uploaded! CID: ${ipfsCid}`);

      // 2. Connect
      const marketAbi = [
        "function publishDataset(string _ipfsHash, string _name, string _symbol, uint256 _price) external",
        "function STAKE_AMOUNT() public view returns (uint256)"
      ];
      const marketContract = new ethers.Contract(MARKET_ADDRESS, marketAbi, signer);

      const tokenAbi = ["function approve(address spender, uint256 amount) public returns (bool)"];
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signer);

      // 3. Approve & Stake
      addLog("💰 Checking Stake...");
      const stakeAmount = await marketContract.STAKE_AMOUNT();

      addLog("📝 Approving Token Spend...");
      const approveTx = await tokenContract.approve(MARKET_ADDRESS, stakeAmount);
      await approveTx.wait();

      // 4. Publish
      // (Note: We are not sending 'mode' to blockchain yet because your Contract V2 doesn't take it, 
      // but having it in the UI makes the UX better for now!)
      addLog("🚀 Publishing to Blockchain...");
      const priceInWei = ethers.parseUnits(formData.price, 18);
      
      const tx = await marketContract.publishDataset(
        realIpfsUrl, 
        formData.name,
        "DATA", 
        priceInWei
      );
      
      await tx.wait();
      alert("🎉 Dataset Published Successfully!");
      navigate("/");

    } catch (error) {
      console.error(error);
      addLog(`❌ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-10 flex justify-center text-white">
      <div className="w-full max-w-2xl bg-slate-800 p-8 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6">📤 Publish Dataset</h1>
        
        <div className="bg-black/40 p-3 rounded mb-4 font-mono text-xs h-32 overflow-auto border border-slate-600">
           {logs.length === 0 ? "Ready..." : logs.map((l,i) => <div key={i}>{l}</div>)}
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:bg-slate-700 transition">
            <input type="file" onChange={handleFileChange} className="hidden" id="file-upload"/>
            <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
               {file ? `📄 ${file.name}` : "Click here to Select a File"}
            </label>
          </div>

          <input name="name" placeholder="Dataset Name" onChange={handleChange} className="w-full p-3 rounded bg-slate-900 border border-slate-700" required />
          <textarea name="description" placeholder="Description" onChange={handleChange} className="w-full p-3 rounded bg-slate-900 border border-slate-700" rows="3" />
          
          <div className="grid grid-cols-2 gap-4">
            <input name="price" type="number" placeholder="Price (NRO)" onChange={handleChange} className="w-full p-3 rounded bg-slate-900 border border-slate-700" required />
            
            {/* --- RESTORED MODE SELECTOR --- */}
            <select name="mode" onChange={handleChange} className="w-full p-3 rounded bg-slate-900 border border-slate-700">
              <option value="0">📥 Standard Download</option>
              <option value="1">🔒 Privacy Compute (Coming Soon)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-purple-600 p-4 rounded font-bold hover:bg-purple-500">
            {loading ? "Publishing..." : "Stake Fee & Publish 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Publish;