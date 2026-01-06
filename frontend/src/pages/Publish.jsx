import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UploadCloud, FileText, Check, Lock, ArrowRight, Server, Terminal, Tag } from "lucide-react";

// ⚠️ YOUR CONSTANTS
const MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1MDIyMjdjMC02MGZhLTRiNmMtOTg0MC04OGM5MWNkZGE3NDIiLCJlbWFpbCI6ImdhdXRhbWtkNTc2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJkYmE2ODk1ZDUyYWQyNjEzMmE3NCIsInNjb3BlZEtleVNlY3JldCI6IjRjNDMzMmJlODc0NWFkYWM2MGJiZTMwMTdjNjVkYmY4NGM2YjQ2YmY1ZjYxNGNjOGM1MDhkYWRmNTIwN2Q3ODkiLCJleHAiOjE3OTg3OTEyNzh9.RzHVbZF7QEnDQVWNvMRcU289FCHeEs0yDU7r8M-IkJk"; 

const Publish = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "", description: "", mode: "0" });

  // --- INJECT GRID ---
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      .bg-grid {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                          linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
      }
    `;
    document.head.appendChild(styleSheet);
  }, []);

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
    if (!file || !formData.name || !formData.price) return alert("Fill all fields!");
    
    setLoading(true);
    setLogs([]);
    addLog("Initializing Sequence...");

    try {
      if (!window.ethereum) return alert("Install MetaMask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 1. Upload
      addLog("> Uploading Blob to IPFS...");
      const ipfsCid = await uploadToPinata(file);
      
      // ⚡ COMBINE HASH + NAME
      const realIpfsUrl = `ipfs://${ipfsCid}||${formData.name}`;
      
      addLog(`> Upload Success. CID: ${ipfsCid}`);
      addLog(`> Metadata Linked: ${formData.name}`);

      const marketContract = new ethers.Contract(MARKET_ADDRESS, [
        "function publishDataset(string _ipfsHash, string _name, string _symbol, uint256 _price) external",
        "function STAKE_AMOUNT() public view returns (uint256)"
      ], signer);

      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ["function approve(address spender, uint256 amount) public returns (bool)"], signer);

      // 3. Approve & Stake
      addLog("> Verifying Stake Requirements...");
      const stakeAmount = await marketContract.STAKE_AMOUNT();

      addLog("> Approving Token Allowance...");
      const approveTx = await tokenContract.approve(MARKET_ADDRESS, stakeAmount);
      await approveTx.wait();

      // 4. Publish
      addLog("> Executing Smart Contract...");
      const priceInWei = ethers.parseUnits(formData.price, 18);
      
      const tx = await marketContract.publishDataset(
        realIpfsUrl, // Sending the Combined String
        formData.name,
        "DATA", 
        priceInWei
      );
      
      await tx.wait();
      addLog("✅ SUCCESS: Asset Deployed on Mainnet.");
      setTimeout(() => navigate("/"), 2000);

    } catch (error) {
      console.error(error);
      addLog(`❌ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans bg-grid flex items-center justify-center p-6">
      
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded shadow-xl shadow-zinc-200/50">
        
        {/* HEADER */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-zinc-900 text-white p-2 rounded">
                    <Server size={18} />
                </div>
                <div>
                    <h2 className="font-bold text-sm text-zinc-900">Deploy Asset</h2>
                    <p className="text-xs text-zinc-500 font-mono">Mainnet Upload Protocol</p>
                </div>
            </div>
            <Lock size={14} className="text-zinc-300" />
        </div>

        {/* LOG TERMINAL */}
        {logs.length > 0 && (
            <div className="bg-zinc-50 border-b border-zinc-100 p-4 h-32 overflow-auto font-mono text-[10px] text-zinc-600">
                {logs.map((l,i) => <div key={i}>{l}</div>)}
                {loading && <div className="animate-pulse">_</div>}
            </div>
        )}

        {/* FORM */}
        <form onSubmit={handlePublish} className="p-6 space-y-5">
            
            {/* NAME INPUT */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dataset Name</label>
                <div className="relative">
                    <input 
                        name="name"
                        onChange={handleChange}
                        placeholder="e.g. Traffic Analysis 2026"
                        className="w-full border border-zinc-200 rounded p-2.5 pl-9 text-sm font-medium focus:outline-none focus:border-zinc-900 transition"
                    />
                    <Tag className="absolute left-2.5 top-2.5 text-zinc-300" size={16} />
                </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea 
                    name="description" 
                    onChange={handleChange} 
                    className="w-full border border-zinc-200 rounded p-2.5 text-sm focus:outline-none focus:border-zinc-900 transition" 
                    rows="2"
                    placeholder="Brief description of contents..."
                />
            </div>

            {/* FILE UPLOAD */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Source Payload</label>
                <div className="relative border-2 border-dashed border-zinc-200 rounded-lg p-6 hover:border-zinc-400 hover:bg-zinc-50 transition text-center cursor-pointer group">
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {file ? (
                        <div className="flex flex-col items-center gap-1 text-emerald-600">
                            <Check size={20} />
                            <span className="font-mono text-xs font-bold">{file.name}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-400 group-hover:text-zinc-600">
                            <UploadCloud size={20} />
                            <span className="text-xs font-bold">Select File</span>
                        </div>
                    )}
                </div>
            </div>

            {/* PRICE & MODE */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Price (NRO)</label>
                    <input 
                        name="price" 
                        type="number" 
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full border border-zinc-200 rounded p-2.5 text-sm font-mono focus:outline-none focus:border-zinc-900 transition"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Access Mode</label>
                    <select name="mode" onChange={handleChange} className="w-full border border-zinc-200 rounded p-2.5 text-sm bg-white focus:outline-none focus:border-zinc-900">
                        <option value="0">Standard DL</option>
                        <option value="1">Privacy Compute</option>
                    </select>
                </div>
            </div>

            {/* SUBMIT */}
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
                {loading ? "Processing..." : "Stake & Deploy"}
                {!loading && <ArrowRight size={14} />}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Publish;