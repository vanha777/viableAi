import { useEffect, useState } from "react";
import { IoSettingsSharp } from "react-icons/io5";
import { FaCrown, FaRegCreditCard } from "react-icons/fa";
import Alert from "@/components/Alert";
import { GameData, useAppContext } from "@/app/utils/AppContext";

export default function SettingsSection({ selectedGame }: { selectedGame: GameData }) {
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAppContext();

  useEffect(() => {
    console.log("Re-render SettingsSection");
  }, [auth.userData]);

  const [currentPlan, setCurrentPlan] = useState('free');
  const userInfo = auth.userData;
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['Basic Analytics', 'Limited Transactions', 'Community Support'],
      id: 'free'
    },
    {
      name: 'Pro',
      price: '$29/month',
      features: ['Advanced Analytics', 'Unlimited Transactions', 'Priority Support', 'Custom Branding'],
      id: 'pro'
    }
  ];

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan) {
      setAlert({
        show: true,
        message: 'You are already subscribed to this plan',
        type: 'info'
      });
      return;
    }

    setAlert({
      show: true,
      message: 'Subscription updated successfully!',
      type: 'success'
    });
    setCurrentPlan(planId);
  };

  return (
    <div className="h-screen flex flex-col bg-black relative p-8">
      {/* Header Section */}
      <div className="text-center space-y-8 mb-16">
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-black border border-white/10 rounded-full 
                        flex items-center justify-center relative z-10">
            {userInfo?.photo ? (
              <img 
                src={userInfo.photo}
                alt="User avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <IoSettingsSharp className="text-4xl text-white/60" />
            )}
          </div>
          {/* Glowing effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0CC0DF]/20 to-[#14F195]/20 
                        blur-xl rounded-full transform scale-150 -z-0"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-white/60 text-sm tracking-wider">ACCOUNT SETTINGS</h2>
          <h1 className="text-white text-5xl font-light tracking-wider">
            {userInfo?.name}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        {/* User Information */}
        <div className="bg-black/80 border border-white/10 p-6 rounded-2xl mb-8">
          <h3 className="text-xl text-white font-light mb-6">User Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userInfo && Object.entries(userInfo)
              .filter(([key]) => !['id', 'photo', 'referal', 'favourite_game', 'type','studio_name'].includes(key.toLowerCase()))
              .map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <p className="text-white/60 text-sm">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                  <p className="text-white text-lg font-light">{value}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="bg-black/80 border border-white/10 p-6 rounded-2xl">
          <h3 className="text-xl text-white font-light mb-6">Subscription Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} 
                   className="bg-black/80 border border-white/10 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <FaCrown className={`text-2xl ${
                    plan.id === 'pro' ? 'text-[#14F195]' : 'text-white/40'
                  }`} />
                  <h3 className="text-xl text-white font-light">{plan.name}</h3>
                </div>
                
                <p className="text-3xl text-white font-light mb-4">{plan.price}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-white/60 flex items-center gap-2">
                      <span className="text-[#14F195]">✓</span> {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3 rounded-lg font-light flex items-center justify-center gap-2
                    ${currentPlan === plan.id 
                      ? 'bg-white/10 text-white/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#0CC0DF] to-[#14F195] text-white hover:opacity-90'
                    }`}
                >
                  <FaRegCreditCard />
                  <span>{currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] text-white/10">SETTINGS</div>
        <div className="absolute top-[30%] right-[20%] text-white/10">PROFILE</div>
        <div className="absolute bottom-[25%] left-[25%] text-white/10">PLANS</div>
      </div>

      <Alert
        isOpen={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
} 