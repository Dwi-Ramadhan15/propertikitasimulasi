import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Home as HomeIcon, Map as MapIcon, PlusSquare, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import PropertyDetail from './pages/PropertyDetail';
import MapSearch from './pages/MapSearch';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50 font-sans">
      <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
        <HomeIcon className="w-7 h-7" /> PropertiKita
      </Link>
      <div className="flex gap-6 items-center">
        <Link to="/" className="hover:text-blue-600 font-semibold transition">Beranda</Link>
        <Link to="/search" className="flex items-center gap-1 hover:text-blue-600 font-semibold transition text-gray-600">
          <MapIcon className="w-4 h-4" /> Cari Peta
        </Link>
        
        {token ? (
          <>
            {user.role === 'super_admin' && (
              <Link to="/admin-dashboard" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                <LayoutDashboard size={18} /> Admin Panel
              </Link>
            )}
            {user.role === 'agen' && (
              <Link to="/agent-dashboard" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                <PlusSquare size={18} /> Tambah Listing
              </Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-bold transition">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </>
        ) : (
          <Link to="/auth" className="flex items-center gap-1 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-200">
            <LogIn className="w-4 h-4" /> Masuk
          </Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-gray-800 bg-gray-50">
        <Navbar />
        <main className="w-full">
          <Routes>
            {/* Rute Publik (Bebas Masuk) */}
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/search" element={<MapSearch />} />

            {/* Rute Terkunci Khusus Admin */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Rute Terkunci Khusus Agen */}
            <Route 
              path="/agent-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['agen']}>
                  <AgentDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Jika ngetik URL ngawur, lempar ke Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;