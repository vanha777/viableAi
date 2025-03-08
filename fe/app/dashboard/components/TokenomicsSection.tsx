import { useEffect, useState } from "react";
import { FaPlus, FaCopy, FaCoins } from "react-icons/fa";
import Alert from "@/components/Alert";
import { MdGeneratingTokens } from "react-icons/md";
import { GameData } from "@/app/utils/AppContext";
import CreateTokenModal from "./createTokenModal";
import { useAppContext } from "@/app/utils/AppContext";
interface TokenForm {
  name: string;
  symbol: string;
  uri: string;
  // decimals: string;
  // totalSupply: string;
  // metadata: File | null;
}

export default function TokenomicsSection({ selectedGame }: { selectedGame: GameData }) {

  const { auth } = useAppContext();

  useEffect(() => {
    console.log("re render tokenomics section");
  }, [auth.tokenData]);

  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black relative">
      {/* Minimalist Token Display */}
      <div className="text-center space-y-8 mb-32">
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full 
                        flex items-center justify-center relative z-10">
            {auth.tokenData?.image ? (
              <img
                src={auth.tokenData.image}
                alt={auth.tokenData?.name || 'Token'}
                className="w-24 h-24 object-cover rounded-full"
              />
            ) : (
              <span className="text-white text-4xl font-bold">?</span>
            )}
          </div>
          {/* Glowing effect behind the circle */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 
                        blur-xl rounded-full transform scale-150 -z-0"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-white/60 text-sm tracking-wider">
            {auth.tokenData?.symbol || 'MONETA KEY'}
          </h2>
          <h1 className="text-white text-5xl font-light tracking-wider">
            {auth.tokenData?.name || 'Crypto Project'}
          </h1>
          <p className="text-white/40 text-lg">
            {auth.tokenData?.description || '2024'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="mt-8 px-6 py-3 border border-white/10 rounded-full text-white/60 
                   hover:text-white hover:border-white/30 transition-all duration-300"
        >
          {auth.tokenData ? 'Edit Token' : 'Create Token'}
        </button>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] text-white/20">BTC</div>
        <div className="absolute top-[30%] right-[20%] text-white/20">ETH</div>
        <div className="absolute bottom-[25%] left-[25%] text-white/20">SOL</div>
      </div>

      {/* Create Token Modal */}
      {showCreateForm && (
        <CreateTokenModal
          setShowCreateForm={setShowCreateForm}
          selectedGame={selectedGame}
        />
      )}

      {/* Token Stats Grid */}
      <div className="absolute bottom-32 w-full bg-black/40 backdrop-blur-sm border-t border-white/10 p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-4 gap-6">
          <div className="stat-card">
            <div className="text-white/60 text-sm">Market Cap</div>
            <div className="text-2xl text-white font-light">$0.00</div>
            <div className="text-green-400 text-sm">+0.00%</div>
          </div>

          <div className="stat-card">
            <div className="text-white/60 text-sm">Total Supply</div>
            <div className="text-2xl text-white font-light">0</div>
            <div className="text-white/40 text-sm">Tokens</div>
          </div>

          <div className="stat-card">
            <div className="text-white/60 text-sm">Circulating Supply</div>
            <div className="text-2xl text-white font-light">0</div>
            <div className="text-white/40 text-sm">Tokens</div>
          </div>

          <div className="stat-card">
            <div className="text-white/60 text-sm">Holders</div>
            <div className="text-2xl text-white font-light">0</div>
            <div className="text-white/40 text-sm">Addresses</div>
          </div>
        </div>
      </div>
      {/* 
      <Alert
        isOpen={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
      /> */}
    </div>
  );
} 