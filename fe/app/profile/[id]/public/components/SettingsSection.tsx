import { IoSettingsSharp } from "react-icons/io5";
import { FaCrown, FaRegCreditCard, FaGithub, FaLinkedin, FaGlobe, FaInstagram } from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";
import Alert from "@/components/Alert";
import { GameData, useAppContext, UserData } from "@/app/utils/AppContext";
import { useEffect, useState } from "react";
import { Db } from "@/app/utils/db";

export default function SettingsSection({ user_id }: { user_id: string }) {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await Db.from('users').select('*').eq('id', user_id).single();
      if (error) throw error;
      setUserData(data as UserData);
    };
    fetchUserData();
  }, [user_id]);

  // Update social media configuration
  const socialIcons = {
    x: { icon: RiTwitterXFill, color: 'text-[#1DA1F2] bg-blue-50', label: 'X' },
    github: { icon: FaGithub, color: 'text-gray-900 bg-gray-50', label: 'GitHub' },
    linkedin: { icon: FaLinkedin, color: 'text-[#0A66C2] bg-blue-50', label: 'LinkedIn' },
    website: { icon: FaGlobe, color: 'text-emerald-600 bg-emerald-50', label: 'Website' },
    instagram: { icon: FaInstagram, color: 'text-[#E4405F] bg-pink-50', label: 'Instagram' }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative p-8">
      {/* Header Section */}
      <div className="navbar bg-gray-50 text-black p-6 mb-8">
        <div className="flex-1">
          <div className="bg-base-200 rounded-full px-8 py-4 shadow-lg flex items-center gap-6">
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md">
              {userData?.photo ? (
                <img
                  src={userData.photo}
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
                {userData?.name}
              </span>
              <p className="text-base text-gray-600 mt-2">Public Profile</p>
            </div>
          </div>
        </div>
        
        {/* Verified Badge Section */}
        <div className="flex-none">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-6 py-3 shadow-lg flex items-center gap-3 text-white">
            <FaCrown className="text-yellow-400 text-xl" />
            <span className="font-medium">Verified User</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* User Information Card */}
        <div className="bg-base-200 p-8 rounded-3xl shadow-sm">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-6">
            User Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info Display */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Name</p>
              <p className="text-gray-900 font-medium py-1">{userData?.name || '-'}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Email</p>
              <p className="text-gray-900 font-medium py-1">{userData?.email || '-'}</p>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-4">
              Social Media
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(socialIcons).map(([key, { icon: Icon, color, label }]) => (
                userData?.[key as keyof UserData] && (
                  <a
                    key={key}
                    href={userData[key as keyof UserData] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon className="text-xl" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-500 text-sm">{label}</p>
                        <p className="text-sm text-gray-900 truncate">
                          {userData[key as keyof UserData] as string}
                        </p>
                      </div>
                    </div>
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 