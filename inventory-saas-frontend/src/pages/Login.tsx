import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, ArrowRight, Sparkles, BarChart3, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
  tenantId: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    tenantId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password, formData.tenantId);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { tenant: 'TECH001', email: 'owner@techstore.com', role: 'Owner', color: 'bg-purple-500' },
    { tenant: 'FASHION001', email: 'manager@fashionhub.com', role: 'Manager', color: 'bg-pink-500' }
  ];

  const fillDemoCredentials = (cred: typeof demoCredentials[0]) => {
    setFormData({
      tenantId: cred.tenant,
      email: cred.email,
      password: 'demo123'
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 xl:px-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-radial from-white/10 to-transparent animate-pulse-slow"></div>
        </div>

        <div className="relative z-10">
          <div className="mb-16">
            <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border-2 border-white/20">
              <Package size={40} strokeWidth={2} />
            </div>
            <h1 className="text-5xl xl:text-6xl font-bold mb-4 tracking-tight">
              InventoryHub
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-md">
              Multi-tenant inventory management for modern businesses
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:translate-x-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Real-time Stock Tracking</h3>
                <p className="text-white/80 text-sm">Monitor inventory levels across all locations instantly</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:translate-x-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Smart Analytics</h3>
                <p className="text-white/80 text-sm">AI-powered insights and predictive low-stock alerts</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:translate-x-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Secure & Isolated</h3>
                <p className="text-white/80 text-sm">Complete data separation with enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">InventoryHub</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="tenantId" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Tenant ID
                </label>
                <input
                  type="text"
                  id="tenantId"
                  name="tenantId"
                  placeholder="e.g., TECH001"
                  value={formData.tenantId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                  isLoading
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Demo Credentials (Click to fill)</p>
              <div className="space-y-3">
                {demoCredentials.map((cred, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => fillDemoCredentials(cred)}
                    className="w-full text-left bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${cred.color} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                        {cred.role}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Tenant:</span>
                        <span className="text-gray-900 font-semibold">{cred.tenant}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Email:</span>
                        <span className="text-gray-900 font-mono text-xs">{cred.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Password:</span>
                        <span className="text-gray-900 font-mono text-xs">demo123</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;