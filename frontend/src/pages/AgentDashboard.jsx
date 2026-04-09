import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, MapPin, CheckCircle, Clock, XCircle, Image as ImageIcon, Building, LayoutDashboard, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState('list');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ title: '', description: '', address: '', price: '', bedrooms: '', bathrooms: '', area_sqm: '', latitude: '', longitude: '' });
  const [images, setImages] = useState([]);

  useEffect(() => { if (activeTab === 'list') fetchAgentProperties(); }, [activeTab]);

  const fetchAgentProperties = async () => {
    try {
      const response = await api.get('/properties/agent');
      setProperties(response.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImages(e.target.files);

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/auth'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length < 2) return alert("Minimal wajib mengunggah 2 foto properti!");
    setLoading(true);
    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    for (let i = 0; i < images.length; i++) submitData.append('images', images[i]);

    try {
      await api.post('/properties', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Properti berhasil diajukan! Menunggu verifikasi admin.');
      setActiveTab('list');
      setFormData({ title: '', description: '', address: '', price: '', bedrooms: '', bathrooms: '', area_sqm: '', latitude: '', longitude: '' });
      setImages([]);
      fetchAgentProperties();
    } catch (err) { alert(err.response?.data?.error || "Gagal menambahkan properti"); } finally { setLoading(false); }
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="flex min-h-[calc(100vh-76px)] bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2"><Building size={24} /> Panel Agen</h2>
          <p className="text-sm text-gray-500 mt-1 truncate">Hai, {user.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'list' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}><LayoutDashboard size={20} /> Listing Saya</button>
          <button onClick={() => setActiveTab('add')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'add' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}><PlusCircle size={20} /> Tambah Properti</button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all"><LogOut size={20} /> Keluar</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'list' && (
          <>
            <div className="mb-8"><h1 className="text-3xl font-extrabold text-gray-800">Properti Saya</h1></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">Belum ada properti.</div>
              ) : (
                properties.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <div className="h-56 bg-gray-200 relative overflow-hidden">
                      <ImageSlider images={item.images || []} />
                      <div className="absolute z-10 top-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md bg-white">
                        {item.status === 'approved' ? <><CheckCircle size={14} className="text-green-500"/> Disetujui</> : item.status === 'rejected' ? <><XCircle size={14} className="text-red-500"/> Ditolak</> : <><Clock size={14} className="text-yellow-500"/> Menunggu</>}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-800 truncate">{item.title}</h3>
                      <p className="text-primary font-extrabold text-xl mt-1">{formatRupiah(item.price)}</p>
                      <p className="text-gray-500 text-sm mt-3 flex items-center gap-1 truncate"><MapPin size={16} className="text-gray-400 shrink-0" /> <span className="truncate">{item.address || "Alamat belum diatur"}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'add' && (
          <div className="max-w-3xl">
            <div className="mb-8"><h1 className="text-3xl font-extrabold text-gray-800">Tambah Listing Baru</h1></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Judul Properti</label><input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Lengkap</label><textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"></textarea></div>
                  
                  {/* INPUT ALAMAT BARU */}
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Alamat Lengkap</label><textarea required name="address" placeholder="Contoh: Jl. Sudirman No. 12, Jakarta Pusat" value={formData.address} onChange={handleChange} rows="2" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"></textarea></div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label><input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Luas (m²)</label><input required type="number" name="area_sqm" value={formData.area_sqm} onChange={handleChange} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Kamar Tidur</label><input required type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Kamar Mandi</label><input required type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <div className="col-span-2"><p className="text-sm text-blue-800 font-bold flex items-center gap-1"><MapPin size={16}/> Titik Koordinat Peta</p></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Latitude</label><input required type="text" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Longitude</label><input required type="text" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" /></div>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer relative">
                    <input required type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <ImageIcon className="mx-auto text-gray-400 mb-3" size={40} />
                    <label className="block text-sm font-bold text-gray-700 mb-1">Klik atau Drag Foto</label>
                    {images.length > 0 && <span className="inline-block mt-4 px-4 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">{images.length} file dipilih</span>}
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 mt-2">
                  {loading ? 'Memproses...' : 'Ajukan Properti'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}