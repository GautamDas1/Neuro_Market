import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Hexagon, ArrowRight, Globe, Key, User, UserPlus, Eye, EyeOff } from "lucide-react";

const DAEMON_URL = "http://localhost:5000"; 

const Login = ({ setAccount }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", role: "Data Scientist" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // 👁️ NEW: Show/Hide Password State
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); 
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = isRegistering ? "/register" : "/login";
      
      const response = await axios.post(`${DAEMON_URL}${endpoint}`, formData);

      if (isRegistering) {
          setSuccess("✅ Account created! Please log in.");
          setIsRegistering(false);
          setLoading(false);
      } else {
          const role = response.data.role;
          
          if (window.ethereum) {
              const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
              
              localStorage.setItem("neuro_session", "active");
              localStorage.setItem("neuro_user", formData.username);
              localStorage.setItem("neuro_role", role);
              
              setAccount(accounts[0]);
              navigate("/profile");
          } else {
              setError("MetaMask not detected");
          }
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Connection Error to Daemon");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans bg-grid flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900"></div>
      <div className="absolute bottom-10 right-10 text-zinc-100 pointer-events-none">
        <Hexagon size={300} strokeWidth={0.5} />
      </div>

      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-zinc-200/50 p-10 relative z-10">
        
        <div className="mb-8 flex items-center gap-3">
             <div className="bg-zinc-900 text-white p-2 rounded">
                <Globe size={24} />
             </div>
             <h1 className="text-2xl font-bold tracking-tight">NeuroMarket<span className="text-zinc-400">_OS</span></h1>
        </div>

        <div className="space-y-2 mb-8">
            <h2 className="text-xl font-bold">{isRegistering ? "Create Identity" : "Secure Login"}</h2>
            <p className="text-zinc-500 text-sm">
                {isRegistering ? "Register a new secure node identity." : "Enter authorized personnel credentials."}
            </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
            
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Username</label>
                <div className="relative">
                    <input 
                        name="username"
                        type="text"
                        placeholder="e.g. neuro_admin"
                        onChange={handleChange}
                        className="w-full border border-zinc-200 rounded p-3 pl-10 text-sm font-medium focus:outline-none focus:border-zinc-900 transition bg-zinc-50 focus:bg-white"
                        required
                    />
                    <User className="absolute left-3 top-3 text-zinc-400" size={16} />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                    <input 
                        name="password"
                        // 👁️ TOGGLE TYPE HERE
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        onChange={handleChange}
                        className="w-full border border-zinc-200 rounded p-3 pl-10 pr-10 text-sm font-medium focus:outline-none focus:border-zinc-900 transition bg-zinc-50 focus:bg-white"
                        required
                    />
                    <Key className="absolute left-3 top-3 text-zinc-400" size={16} />
                    
                    {/* 👁️ TOGGLE BUTTON */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {isRegistering && (
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Role</label>
                    <select name="role" onChange={handleChange} className="w-full border border-zinc-200 rounded p-3 text-sm bg-white">
                        <option>Data Scientist</option>
                        <option>Research Partner</option>
                        <option>Node Validator</option>
                    </select>
                </div>
            )}

            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded font-bold">{error}</div>}
            {success && <div className="text-xs text-green-600 bg-green-50 p-2 rounded font-bold">{success}</div>}

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg mt-4"
            >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                    isRegistering ? <>Register Node <UserPlus size={18} /></> : <>Unlock Protocol <ArrowRight size={18} /></>
                )}
            </button>
        </form>

        <div className="mt-6 text-center text-sm">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(""); setSuccess(""); }}
                className="text-zinc-500 hover:text-zinc-900 underline underline-offset-4"
            >
                {isRegistering ? "Already have an ID? Login" : "New User? Create Account"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default Login;