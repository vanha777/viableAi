import { IoSettingsSharp } from "react-icons/io5";
import { FaCrown, FaRegCreditCard, FaGithub, FaLinkedin, FaGlobe, FaInstagram } from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";
import Alert from "@/components/Alert";
import { GameData, useAppContext, UserData } from "@/app/utils/AppContext";
import { useEffect, useState } from "react";
import { Db } from "@/app/utils/db";
import { VerfifyUser } from "@/app/utils/db";

export default function SettingsSection() {
  const [isLoading, setIsLoading] = useState(false);
  const { auth, getUser, setUser } = useAppContext();
  const [formData, setFormData] = useState<Partial<UserData>>({});

  useEffect(() => {
    if (auth.userData) {
      // Initialize form data with user data
      setFormData({
        name: auth.userData.name || '',
        email: auth.userData.email || '',
        x: auth.userData.x || '',
        github: auth.userData.github || '',
        linkedin: auth.userData.linkedin || '',
        website: auth.userData.website || '',
        instagram: auth.userData.instagram || '',
      });
    } else {
      getUser();
    }
  }, [auth.userData]);

  // Update social media configuration
  const socialIcons = {
    x: { icon: RiTwitterXFill, color: 'text-[#1DA1F2] bg-blue-50', label: 'X' },
    github: { icon: FaGithub, color: 'text-gray-900 bg-gray-50', label: 'GitHub' },
    linkedin: { icon: FaLinkedin, color: 'text-[#0A66C2] bg-blue-50', label: 'LinkedIn' },
    website: { icon: FaGlobe, color: 'text-emerald-600 bg-emerald-50', label: 'Website' },
    instagram: { icon: FaInstagram, color: 'text-[#E4405F] bg-pink-50', label: 'Instagram' }
  };

  const handleInputChange = (key: keyof UserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async () => {
    if (!auth.userData?.id) return;

    setIsLoading(true);
    try {
      const { data: userData, error } = await Db
        .from('users')
        .update(formData)
        .eq('id', auth.userData.id).select().single();

      if (error) throw error;
      const user = userData as UserData;
      setUser(user);
      setAlert({
        show: true,
        message: 'Profile updated successfully!',
        type: 'success'
      });

      // Refresh user data
      getUser();
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlert({
        show: true,
        message: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [currentPlan, setCurrentPlan] = useState('free');
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

  const [validatingX, setValidatingX] = useState(false);
  const [xValidation, setXValidation] = useState<{ isValid: boolean; message: string | null }>({
    isValid: false,
    message: null
  });

  const validateAccount = async () => {
    if (!formData.x) {
      setXValidation({ isValid: false, message: 'Please enter an X username' });
      return;
    }

    setValidatingX(true);
    try {
      const result = await VerfifyUser(formData.x);
      setXValidation({
        isValid: Boolean(result),
        message: result ? 'Account verified!' : 'Account not found'
      });
    } catch (error) {
      setXValidation({
        isValid: false,
        message: 'Error validating account'
      });
    } finally {
      setValidatingX(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative p-8">
      {/* Header Section with Bubble Style */}
      <div className="navbar bg-gray-50 text-black p-6 mb-8">
        <div className="flex-1">
          <div className="bg-base-200 rounded-full px-8 py-4 shadow-lg flex items-center gap-6">
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md">
              {auth.userData?.photo ? (
                <img
                  src={auth.userData.photo}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <IoSettingsSharp className="text-2xl text-white" />
                </div>
              )}
            </div>
            <div className="text-xl">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-bold text-2xl">
                {auth.userData?.name}
              </span>
              <p className="text-base text-gray-600 mt-2">Account Settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* User Information Card */}
        <div className="bg-base-200 p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              User Information
            </h3>
            <button
              onClick={validateAccount}
              disabled={validatingX}
              className="px-5 py-2 text-sm rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              <RiTwitterXFill className="text-lg" />
              {validatingX ? 'Verifying Account...' : 'Verify Account'}
            </button>
          </div>
          
          {xValidation.message && (
            <div className={`mb-4 p-3 rounded-xl ${xValidation.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <p className="flex items-center gap-2">
                {xValidation.isValid ? '✓' : '✗'} {xValidation.message}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info Fields */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Name</p>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full text-gray-900 font-medium bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none py-1"
              />
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Email</p>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full text-gray-900 font-medium bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none py-1"
              />
            </div>
          </div>

          {/* Social Media Section */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-4">
              Social Media
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(socialIcons).map(([key, { icon: Icon, color, label }]) => (
                <div key={key} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="text-xl" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-500 text-sm">{label}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Enter your ${label} URL`}
                          className="w-full text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none py-1"
                          value={formData[key as keyof UserData] || ''}
                          onChange={(e) => handleInputChange(key as keyof UserData, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-md transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Plans Card */}
        {/* <div className="bg-base-200 p-8 rounded-3xl shadow-sm">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-6">
            Subscription Plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.id === 'pro'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    <FaCrown className="text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                </div>

                <p className="text-3xl font-bold text-gray-900 mb-4">{plan.price}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">✓</span> {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-all duration-300
                    ${currentPlan === plan.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md hover:shadow-blue-200'
                    }`}
                >
                  <FaRegCreditCard />
                  <span>{currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}</span>
                </button>
              </div>
            ))}
          </div>
        </div> */}
      </div>

      {/* Remove floating elements as they don't match the new style */}

      <Alert
        isOpen={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
} 