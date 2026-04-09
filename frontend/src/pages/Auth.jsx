import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, Lock, Mail, User, Phone, Home, Briefcase, KeyRound, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'user'
  });

  const [otpCode, setOtpCode] = useState('');
  const [registeredIdentifier, setRegisteredIdentifier] = useState('');
  const [registeredRole, setRegisteredRole] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // PENYESUAIAN ARAH DASHBOARD YANG BARU
        if (response.data.user.role === 'super_admin') {
          navigate('/admin-dashboard');
        } else if (response.data.user.role === 'agen') {
          navigate('/agent-dashboard');
        } else {
          navigate('/'); 
        }

      } else {
        const endpoint = formData.role === 'agen' ? '/auth/register/agen' : '/auth/register/user';
        await api.post(endpoint, formData);
        
        setRegisteredRole(formData.role);
        
        if (formData.role === 'user') {
          alert('Kode OTP telah dikirim ke WhatsApp Anda!');
          setRegisteredIdentifier(formData.phone_number); 
        } else {
          alert('Kode OTP telah dikirim ke Email Anda!');
          setRegisteredIdentifier(formData.email);
        }
        setIsVerifying(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-otp', {
        identifier: registeredIdentifier,
        otp_code: otpCode
      });
      
      alert(response.data.message);
      setIsVerifying(false);
      setIsLogin(true);
      setOtpCode('');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Kode OTP salah atau server bermasalah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
    >
      <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative z-10 border border-white/20">
        
        {isVerifying ? (
          <div>
            <button onClick={() => setIsVerifying(false)} className="flex items-center gap-1 text-gray-500 hover:text-primary mb-6 text-sm font-medium transition">
              <ArrowLeft size={16} /> Kembali
            </button>
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
                Verifikasi {registeredRole === 'agen' ? 'Email' : 'WhatsApp'}
              </h2>
              <p className="text-gray-500 text-sm">
                Masukkan 6 digit kode OTP yang telah kami kirimkan ke {registeredRole === 'agen' ? 'alamat email' : 'nomor WhatsApp'} <br/> 
                <strong className="text-gray-700">{registeredIdentifier}</strong>
              </p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center border border-red-100 font-medium">{error}</div>}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <input 
                required 
                type="text" 
                maxLength="6"
                placeholder="• • • • • •" 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white" 
              />
              <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 mt-4 flex justify-center items-center gap-2">
                {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verifikasi Akun'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-xl">
              <button 
                className={`flex-1 py-2.5 rounded-lg font-bold transition-all duration-300 ${isLogin ? 'bg-white shadow-md text-primary scale-100' : 'text-gray-500 scale-95 hover:text-gray-700'}`}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Masuk
              </button>
              <button 
                className={`flex-1 py-2.5 rounded-lg font-bold transition-all duration-300 ${!isLogin ? 'bg-white shadow-md text-primary scale-100' : 'text-gray-500 scale-95 hover:text-gray-700'}`}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Daftar Baru
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-2">
                {isLogin ? 'Selamat Datang!' : 'Mulai Perjalananmu'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isLogin ? 'Masuk untuk mengelola properti impianmu.' : 'Pilih peranmu dan temukan kemudahan bersama kami.'}
              </p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center border border-red-100 font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${formData.role === 'user' ? 'border-primary bg-blue-50 text-primary shadow-sm' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                      <input type="radio" name="role" value="user" className="hidden" checked={formData.role === 'user'} onChange={handleChange} />
                      <Home size={28} />
                      <span className="text-sm font-bold text-center">Pencari Rumah</span>
                    </label>
                    <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${formData.role === 'agen' ? 'border-primary bg-blue-50 text-primary shadow-sm' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                      <input type="radio" name="role" value="agen" className="hidden" checked={formData.role === 'agen'} onChange={handleChange} />
                      <Briefcase size={28} />
                      <span className="text-sm font-bold text-center">Agen Properti</span>
                    </label>
                  </div>

                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input required type="text" name="name" placeholder="Nama Lengkap" value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input required type="text" name="phone_number" placeholder="Nomor WhatsApp" value={formData.phone_number} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white" />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input required type="email" name="email" placeholder="Alamat Email" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input required type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white" />
              </div>

              <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 mt-4 flex justify-center items-center gap-2">
                {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? <><LogIn size={20}/> Masuk Sekarang</> : <><UserPlus size={20}/> Daftar Sekarang</>)}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}