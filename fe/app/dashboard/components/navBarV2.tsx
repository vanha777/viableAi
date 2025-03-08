import { useState } from "react";
import { AppProvider, useAppContext, UserData } from "@/app/utils/AppContext";

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    selectedIcon: React.ElementType;
}

interface NavbarProps {
    menuItems: MenuItem[];
    activeMenu: string;
    setActiveMenu: (id: string) => void;
    activeView: string;
    setActiveView: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
    menuItems,
    activeMenu,
    setActiveMenu,
    activeView,
    setActiveView
}) => {

    const { auth, setAccessToken, setUser, setGame, setTokenData, logout } = useAppContext();
    const [selectedIcon, setSelectedIcon] = useState<string>("🌟");
    console.log("this is auth", auth.userData?.photo);

    const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        // Handle image loading error
        console.error("Error loading image");
    };

    return (
        <div className="navbar bg-white shadow-sm flex justify-center items-center">
            <div className="w-full flex flex-col gap-4">
                {/* Logo and User section */}
                <div className="flex justify-between items-center px-6 w-full py-3">
                    <div className="flex-none">
                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                            CoLaunch.it
                        </div>
                    </div>

                    <div className="flex-none flex items-center gap-3">
                        <span className="text-gray-700">{auth.userData?.name}</span>
                        <div className="avatar">
                            <div className="w-9 h-9 rounded-full overflow-hidden">
                                {auth.userData?.photo ? (
                                    <img
                                        src={auth.userData.photo}
                                        alt={auth.userData?.name || 'User avatar'}
                                        className="w-full h-full object-cover rounded-full"
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                        onError={handleImageError}
                                    />
                                ) : (
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-full h-full flex items-center justify-center">
                                        <span>U</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* View switching buttons */}
                <div className="flex justify-center w-full">
                    <div className="flex gap-2">
                        <button
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeView === 'view1'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            onClick={() => setActiveView('view1')}
                        >
                            Ideas
                        </button>
                        <button
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeView === 'view2'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            onClick={() => setActiveView('view2')}
                        >
                            Deals
                        </button>
                    </div>
                </div>

                {/* Dropdown section */}
                <div className="w-full px-4">
                    <div className="flex flex-row gap-4 items-center justify-center px-4 py-2">
                        <div className="bg-gray-50 rounded-full px-6 py-3 flex gap-4">
                            <div className="dropdown">
                                <label tabIndex={0} className="btn bg-white hover:bg-gray-100 border-gray-200 text-gray-700 rounded-full">
                                    Location
                                </label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-2xl w-52 mt-2">
                                    <li><a className="hover:bg-gray-50 rounded-xl">🌟 Option 1</a></li>
                                    <li><a className="hover:bg-gray-50 rounded-xl">🌈 Option 2</a></li>
                                    <li><a className="hover:bg-gray-50 rounded-xl">💡 Option 3</a></li>
                                </ul>
                            </div>

                            <div className="dropdown">
                                <label tabIndex={0} className="btn bg-white hover:bg-gray-100 border-gray-200 text-gray-700 rounded-full">
                                    Scale
                                </label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-2xl w-52 mt-2">
                                    <li><a className="hover:bg-gray-50 rounded-xl">🌟 Option 1</a></li>
                                    <li><a className="hover:bg-gray-50 rounded-xl">🌈 Option 2</a></li>
                                    <li><a className="hover:bg-gray-50 rounded-xl">💡 Option 3</a></li>
                                </ul>
                            </div>

                            <div className="dropdown">
                                <label tabIndex={0} className="btn bg-white hover:bg-gray-100 border-gray-200 text-gray-700 rounded-full">
                                    Type
                                </label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-2xl w-52 mt-2">
                                    <li><a className="hover:bg-gray-50 rounded-xl">🌟 Option 1</a></li>
                                    <li><a className="hover:bg-gray-50 rounded-xl">🌈 Option 2</a></li>
                                    <li><a className="hover:bg-gray-50 rounded-xl">💡 Option 3</a></li>
                                </ul>
                            </div>

                            {/* Repeat similar styling for other dropdowns */}
                        </div>
                    </div>
                </div>
                
         

                {/* Tabs section */}
                <div className="navbar-start flex justify-center w-full pb-2">
                    <div className="bg-gray-50 p-1 rounded-2xl">
                        {menuItems.map((item) => {
                            const Icon = activeMenu === item.id ? item.selectedIcon : item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`px-6 py-2 rounded-xl transition-all duration-200 ${activeMenu === item.id
                                        ? 'bg-white shadow-md text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    onClick={() => setActiveMenu(item.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-5 h-5 ${activeMenu === item.id ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span>{item.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;

// ... existing code ...