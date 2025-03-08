import { useState } from 'react';
import { FaEnvelope, FaInfoCircle, FaEllipsisH } from 'react-icons/fa';

const SimpleSupport = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="fixed bottom-16 right-6 flex flex-col-reverse gap-4 z-50">
            {isExpanded && (
                <>
                    <div className="tooltip tooltip-left" data-tip="Contact Us">
                        <button className="support-button bg-black/80 border border-white/10 hover:border-white/30">
                            <FaEnvelope className="h-5 w-5 text-white/60 group-hover:text-white" />
                        </button>
                    </div>
                    <div className="tooltip tooltip-left" data-tip="Help & Information">
                        <button className="support-button bg-black/80 border border-white/10 hover:border-white/30">
                            <FaInfoCircle className="h-5 w-5 text-white/60 group-hover:text-white" />
                        </button>
                    </div>
                    <div className="tooltip tooltip-left" data-tip="More Options">
                        <button className="support-button bg-black/80 border border-white/10 hover:border-white/30">
                            <FaEllipsisH className="h-5 w-5 text-white/60 group-hover:text-white" />
                        </button>
                    </div>
                </>
            )}
            <div className="tooltip tooltip-left" data-tip="Support">
                <button
                    className="h-14 w-14 rounded-full bg-gradient-to-r from-[#0CC0DF] to-[#14F195] 
                             flex items-center justify-center group transition-all duration-300 
                             hover:opacity-90"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-black"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </button>
            </div>

            <style jsx>{`
                .support-button {
                    @apply h-12 w-12 rounded-full flex items-center justify-center 
                           transition-all duration-300 group;
                }
            `}</style>
        </div>
    );
};

export default SimpleSupport;
