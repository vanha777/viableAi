import { useRouter } from 'next/navigation';
import React from 'react';
import Logo from '../../../public/apple.png';
import { UserData } from '@/app/utils/AppContext';
import { AppProvider, useAppContext } from "@/app/utils/AppContext";
interface SimpleSideBarProps {
    children: React.ReactNode;
}

const SimpleSideBar: React.FC<SimpleSideBarProps> = ({
    children,
}) => {
    const router = useRouter();
    const { auth } = useAppContext();
    return (
        <div className="bg-gray-50 drawer lg:drawer-open">
            <input id="sidebar" type="checkbox" className="drawer-toggle" />

            {/* Drawer content */}
            <div className="drawer-content flex flex-col">
                <label htmlFor="sidebar" className="btn btn-square btn-ghost drawer-button lg:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </label>
                <div className="p-4">
                    {children}
                </div>
            </div>

            {/* Sidebar Content */}
            <div className="drawer-side">
                <label htmlFor="sidebar" aria-label="close sidebar" className="drawer-overlay"></label>
                <ul className="menu p-4 w-18 min-h-full bg-gray-50 text-base-content flex flex-col items-center gap-4">
                    <li className="mb-4">
                        <div className="relative rounded-full p-[2px] before:absolute before:w-full before:h-full before:rounded-full before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-blue-600 hover:before:to-purple-600 before:opacity-0 hover:before:opacity-100">
                            <div
                                onClick={() => router.push('/dashboard')}
                                className="rounded-full bg-white p-2 relative flex items-center justify-center cursor-pointer"
                            >
                                <img
                                    src={Logo.src}
                                    alt="CoLaunch Logo"
                                    className="w-12 h-12 rounded-full"
                                    onError={(e) => { e.currentTarget.src = '/path/to/default/logo.png'; }}
                                />
                            </div>
                        </div>
                    </li>
                    <li className="mt-32">
                        <div className="relative rounded-full p-[2px] before:absolute before:w-full before:h-full before:rounded-full before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-blue-600 hover:before:to-purple-600 before:opacity-0 hover:before:opacity-100">
                            <div
                                onClick={() => router.push('/dashboard')}
                                className="rounded-full bg-white p-4 relative flex items-center justify-center cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                        </div>
                    </li>
                    <li >
                        <div className="relative rounded-full p-[2px] before:absolute before:w-full before:h-full before:rounded-full before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-blue-600 hover:before:to-purple-600 before:opacity-0 hover:before:opacity-100">
                            <div
                                onClick={() => router.push(`/profile/${auth.userData?.id}/ideas`)}
                                className="rounded-full bg-white p-4 relative flex items-center justify-center cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                    </li>
                    <li>
                        <div className="relative rounded-full p-[2px] before:absolute before:w-full before:h-full before:rounded-full before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-blue-600 hover:before:to-purple-600 before:opacity-0 hover:before:opacity-100">
                            <div
                                onClick={() => router.push(`/profile/${auth.userData?.id}/offers`)}
                                className="rounded-full bg-white p-4 relative flex items-center justify-center cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                        </div>
                    </li>
                    <li>
                        <div className="relative rounded-full p-[2px] before:absolute before:w-full before:h-full before:rounded-full before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-blue-600 hover:before:to-purple-600 before:opacity-0 hover:before:opacity-100">
                            <div
                                onClick={() => router.push(`/profile/${auth.userData?.id}/deals`)}
                                className="rounded-full bg-white p-4 relative flex items-center justify-center cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </li>
                    <li>
                        <div className="relative rounded-full p-[2px] before:absolute before:w-full before:h-full before:rounded-full before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-blue-600 hover:before:to-purple-600 before:opacity-0 hover:before:opacity-100">
                            <div
                                onClick={() => router.push(`/profile/${auth.userData?.id}/partners`)}
                                className="rounded-full bg-white p-4 relative flex items-center justify-center cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </li>
                    <li className="mt-auto mb-4">
                        <div className="relative rounded-full p-[2px] before:absolute before:w-full before:h-full before:rounded-full before:transition-all before:duration-300 hover:before:bg-gradient-to-r hover:before:from-blue-600 hover:before:to-purple-600 before:opacity-0 hover:before:opacity-100">
                            <div
                                onClick={() => router.push('/profile/1/settings')}
                                className="rounded-full bg-white p-2 relative flex items-center justify-center cursor-pointer"
                            >
                                <img
                                    src={auth.userData?.photo || Logo.src}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full ring-2 ring-transparent hover:ring-purple-600 transition-all duration-300"
                                    onError={(e) => { e.currentTarget.src = Logo.src }}
                                />
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SimpleSideBar;
