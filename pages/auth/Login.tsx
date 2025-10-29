import React from 'react';

const Login: React.FC = () => {
  return (
    <main className="min-h-screen bg-cover bg-center relative" style={{ backgroundImage: "url('/bg.jpg')" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col md:flex-row w-full max-w-[1100px] h-auto md:h-[min(600px,80vh)] rounded-2xl bg-black/60 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Left Panel */}
          <div className="w-full md:w-[55%] text-white p-8 md:p-16 flex flex-col justify-center items-center text-center md:text-left">
            <div>
              <img src="/logo.svg" className="h-8 mb-6" alt="Paradigm Services Logo" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to the Future of Onboarding.</h1>
              <p className="text-sm md:text-base text-gray-300">Streamlining the journey for every new member of the Paradigm family.</p>
            </div>
            <p className="text-xs text-gray-400 mt-8 md:mt-0">© 2025 Paradigm Services. All rights reserved.</p>
          </div>
          {/* Right Panel */}
          <div className="w-full md:w-[45%] p-8 md:p-14 bg-black/50 md:rounded-r-2xl">
            <h2 className="text-2xl font-semibold text-white mb-2">Sign In</h2>
            <p className="text-gray-300 mb-6">Enter your credentials to access your account.</p>
            <form className="flex flex-col gap-4">
              <div className="relative">
                <input type="email" placeholder="Email" className="rounded-lg p-3 pl-10 bg-gray-100 focus:outline-none w-full h-12 text-base" />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div className="relative">
                <input type="password" placeholder="Password" className="rounded-lg p-3 pl-10 bg-gray-100 focus:outline-none w-full h-12 text-base" />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <a href="#" className="text-sm text-gray-300 self-end text-right">Forgot your password?</a>
              <button className="bg-[#0f7b3e] text-white rounded-full py-3 font-semibold hover:bg-green-800 h-12">Sign in</button>
            </form>
            <div className="flex items-center my-6">
              <hr className="flex-1 border-gray-500" />
              <span className="px-3 text-gray-300 text-sm">OR</span>
              <hr className="flex-1 border-gray-500" />
            </div>
            <button className="flex items-center justify-center gap-2 bg-white text-gray-800 rounded-full py-3 w-full h-12">
              <img src="/google-icon.svg" className="h-5" alt="Google Logo" /> Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;