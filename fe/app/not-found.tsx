import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { IoGameControllerOutline } from "react-icons/io5";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black/80 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <IoGameControllerOutline className="text-8xl text-green mx-auto" />
        <h1 className="text-4xl font-bold text-white">404</h1>
        <h2 className="text-xl text-gray-400">Page Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-green hover:bg-green/90 text-grey px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <FaHome className="text-lg" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
} 