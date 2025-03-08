'use client'
import { useState } from 'react';
import ManageIdeaForm from './manageIdeas';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/utils/AppContext';

const SimpleNav = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();
    const { auth, getUser } = useAppContext();

    return (
        <div className="fixed bottom-16 right-6 flex flex-col-reverse gap-3 z-50">
            {isExpanded && (
                <>
                    <div className="tooltip tooltip-left" data-tip="My Profile">
                        <button 
                            className="btn btn-circle btn-success animate-bounce-up"
                            onClick={() => router.push('/dashboard/profile')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button>
                    </div>
                    <div className="tooltip tooltip-left" data-tip="My Deals">
                        <button 
                            className="btn btn-circle btn-primary animate-bounce-up"
                            onClick={() => router.push('/dashboard/deals')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                    {auth.userData?.type === 'founder' && (
                        <>
                            <div className="tooltip tooltip-left" data-tip="My Offers">
                                <button 
                                    className="btn btn-circle btn-secondary animate-bounce-up"
                                    onClick={() => router.push(`/profile/${auth.userData?.id}/offers`)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </button>
                            </div>
                            <div className="tooltip tooltip-left" data-tip="My Ideas">
                                <button 
                                    className="btn btn-circle btn-accent animate-bounce-up"
                                    onClick={() => router.push(`/profile/${auth.userData?.id}/ideas`)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}
                    {auth.userData?.type !== 'founder' && (
                        <div className="tooltip tooltip-left" data-tip="My Wallets">
                            <button 
                                className="btn btn-circle btn-warning animate-bounce-up"
                                onClick={() => router.push('/dashboard/wallets')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </>
            )}
            <div className="tooltip tooltip-left" data-tip="Support">
                <button
                    className="btn btn-circle btn-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-80 transition-all duration-300"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-8 w-8 transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SimpleNav;
