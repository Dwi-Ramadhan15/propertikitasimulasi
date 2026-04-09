import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Image as ImageIcon, Building, LayoutDashboard, LogOut, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import api from '../services/api';

const ImageSlider = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % images.length), 3000);
    return () => clearInterval(interval);
  }, [images]);

  const nextSlide = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % images.length); };
  const prevSlide = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); };

  if (!images || images.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200"><ImageIcon /></div>;

  return (
    <div className="relative w-full h-full group">
      <img src={images[currentIndex]} alt="Property" className="w-full h-full object-cover transition-all duration-500" />
      {images.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"><ChevronLeft size={20} /></button>
          <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"><ChevronRight size={20} /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />)}
          </div>
        </>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => { fetchAdminProperties(); }, []);

  const fetchAdminProperties = async () => {
    try {
      const response = await api.get('/properties/admin');
      setProperties(response.data);
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!window.confirm(`Yakin ingin men-${newStatus} properti ini?`)) return;
    try {
      await api.put(`/properties/${id}/status`, { status: newStatus });
      fetchAdminProperties();
    } catch (err) { alert("Gagal mengubah status!"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="flex min-h-[calc(100vh-76px)] bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2"><Building size={24} /> Panel Admin</h2>
          <p className="text-sm text-gray-500 mt-1 truncate">Hai, Komandan {user.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-blue-50 text-primary">
            <LayoutDashboard size={20} /> Validasi Listing
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={20} /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Validasi Listing Masuk</h1>
        <p className="text-gray-500 mb-8">Setujui atau tolak properti yang diajukan oleh para agen.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">Belum ada properti yang diajukan agen.</div>
          ) : (
            properties.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                <div className="h-56 bg-gray-200 relative overflow-hidden">
                  <ImageSlider images={item.images || []} />
                  <div className="absolute z-10 top-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md bg-white">
                    {item.status === 'approved' ? <><CheckCircle size={14} className="text-green-500"/> Disetujui</> : 
                     item.status === 'rejected' ? <><XCircle size={14} className="text-red-500"/> Ditolak</> : 
                     <><Clock size={14} className="text-yellow-500"/> Menunggu</>}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 bg-gray-100 w-fit px-3 py-1.5 rounded-full">
                    <UserIcon size={14} className="text-primary"/> Agen: {item.agent_name}
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 truncate">{item.title}</h3>
                  <p className="text-primary font-extrabold text-xl mt-1">{formatRupiah(item.price)}</p>
                  
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button onClick={() => handleStatusChange(item.id, 'approved')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-sm transition">Setujui</button>
                      <button onClick={() => handleStatusChange(item.id, 'rejected')} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-sm transition">Tolak</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}