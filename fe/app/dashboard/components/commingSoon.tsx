'use client';

import React, { FC } from 'react';
import { FaTimes, FaGhost } from 'react-icons/fa';

interface ComingSoonProps {
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
}

const ComingSoon: FC<ComingSoonProps> = ({ showCreateForm, setShowCreateForm }) => {
  if (!showCreateForm) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-3xl p-8 max-w-md w-full relative">
        {/* Close button */}
        <button 
          onClick={() => setShowCreateForm(false)}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <FaTimes className="text-gray-500" />
        </button>

        {/* Content */}
        <div className="text-center py-8">
          <FaGhost className="text-gray-400 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Coming Soon!</h3>
          <p className="text-gray-600">
            This feature will be available in the next version.
          </p>
          <button
            onClick={() => setShowCreateForm(false)}
            className="mt-6 px-6 py-2 bg-base-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-gray-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
