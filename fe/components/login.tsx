import { FcGoogle } from 'react-icons/fc'
import { FaApple } from 'react-icons/fa'

const LoginOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="modal-box bg-base-100 p-8 max-w-sm w-full">
        <h3 className="font-bold text-2xl text-center mb-6">Sign In</h3>
        
        <div className="flex flex-col gap-4">
          <button 
            className="btn btn-outline gap-2 hover:bg-base-200"
            onClick={() => {/* Add Google sign in logic */}}
          >
            <FcGoogle className="text-xl" />
            Continue with Google
          </button>

          <button 
            className="btn btn-outline gap-2 hover:bg-base-200"
            onClick={() => {/* Add Apple sign in logic */}}
          >
            <FaApple className="text-xl" />
            Continue with Apple
          </button>
        </div>

        <p className="text-sm text-center mt-6 text-base-content/70">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default LoginOverlay
