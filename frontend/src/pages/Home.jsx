import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Image as ImageIcon, Bed, Bath, Maximize, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState({ search: '', priceRange: '', bedrooms: '' });

  const fetchProperties = async (params = {}) => {
    try {
      const response = await api.get('/properties', { params });
      setProperties(response.data);
      setHeroIndex(0);
    } catch (err) { console.error("Gagal mengambil data", err); }
  };

  // --- FITUR LIVE SEARCH (Otomatis nyari pas ngetik) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProperties(searchParams);
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchParams]);

  // --- FITUR TOMBOL CARI (Bisa di klik atau tekan Enter) ---
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties(searchParams);
  };

  const heroProperties = properties.slice(0, 5); 
  const safeHeroIndex = heroProperties.length > 0 ? heroIndex % heroProperties.length : 0;
  const currentHero = heroProperties[safeHeroIndex];

  useEffect(() => {
    if (heroProperties.length <= 1) return;
    const interval = setInterval(() => setHeroIndex((prev) => (prev + 1) % heroProperties.length), 6000);
    return () => clearInterval(interval);
  }, [heroProperties.length]);

  const handleHeroNext = () => setHeroIndex((prev) => (prev + 1) % heroProperties.length);
  const handleHeroPrev = () => setHeroIndex((prev) => (prev - 1 + heroProperties.length) % heroProperties.length);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStartEvent = (e) => { 
    setTouchEnd(null); 
    setTouchStart(e.targetTouches ? e.targetTouches[0].clientX : e.clientX); 
  };
  const onTouchMoveEvent = (e) => {
    setTouchEnd(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
  };
  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleHeroNext();
    if (distance < -50) handleHeroPrev();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const currentHeroBg = currentHero && currentHero.images?.length > 0
    ? currentHero.images[0]
    : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';
    
  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="min-h-screen bg-gray-50">
      <div 
        className="relative h-[550px] flex items-center justify-center bg-cover bg-center transition-all duration-1000 ease-in-out group select-none cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: `url('${currentHeroBg}')` }}
        onTouchStart={onTouchStartEvent} 
        onTouchMove={onTouchMoveEvent} 
        onTouchEnd={onTouchEndEvent}
        onMouseDown={onTouchStartEvent} 
        onMouseMove={(e) => { if (touchStart !== null) onTouchMoveEvent(e); }} 
        onMouseUp={onTouchEndEvent} 
        onMouseLeave={() => { setTouchStart(null); setTouchEnd(null); }}
      >
        <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-[2px] pointer-events-none"></div>
        
        {heroProperties.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); handleHeroPrev(); }} className="absolute left-4 md:left-10 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition opacity-0 group-hover:opacity-100 z-20"><ChevronLeft size={30}/></button>
            <button onClick={(e) => { e.stopPropagation(); handleHeroNext(); }} className="absolute right-4 md:right-10 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition opacity-0 group-hover:opacity-100 z-20"><ChevronRight size={30}/></button>
          </>
        )}

        <div className="relative z-10 text-center px-4 w-full max-w-4xl pointer-events-none">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-bold backdrop-blur-md mb-4 border border-white/30">Properti Unggulan</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg leading-tight">
            {currentHero ? currentHero.title : "Temukan Rumah Impianmu"}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-10 flex items-center justify-center gap-2">
            <MapPin size={24} className="text-red-400 shrink-0"/> 
            {currentHero ? (currentHero.address || "Alamat detail belum tersedia") : "Jelajahi properti terbaik di seluruh Indonesia"}
          </p>
        </div>

        {/* KEMBALI MENGGUNAKAN FORM DENGAN TOMBOL CARI */}
        <form onSubmit={handleSearch} className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-white p-3 md:p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 z-30 border border-gray-100 cursor-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20}/>
            <input 
              type="text" 
              value={searchParams.search} 
              onChange={(e) => setSearchParams({...searchParams, search: e.target.value})} 
              placeholder="Cari lokasi atau judul..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/30 transition-all font-medium" 
            />
          </div>
          
          <select value={searchParams.priceRange} onChange={(e) => setSearchParams({...searchParams, priceRange: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl outline-none text-gray-700 focus:ring-2 focus:ring-blue-600/30 font-medium cursor-pointer">
            <option value="" disabled>Pilih Harga</option>
            <option value="">Semua Harga</option>
            <option value="< 500 Juta">&lt; 500 Juta</option>
            <option value="500 Jt - 1 M">500 Jt - 1 M</option>
            <option value="> 1 Milyar">&gt; 1 Milyar</option>
          </select>

          <select value={searchParams.bedrooms} onChange={(e) => setSearchParams({...searchParams, bedrooms: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl outline-none text-gray-700 focus:ring-2 focus:ring-blue-600/30 font-medium cursor-pointer">
            <option value="" disabled>Pilih Kamar</option>
            <option value="">Semua Kamar</option>
            <option value="1 Kamar">1 Kamar</option>
            <option value="2 Kamar">2 Kamar</option>
            <option value="3 Kamar">3 Kamar</option>
            <option value="4+ Kamar">4+ Kamar</option>
            <option value="5+ Kamar">5+ Kamar</option>
          </select>

          {/* TOMBOL CARI KEMBALI HADIR */}
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer">
            Cari
          </button>
        </form>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800">Rekomendasi Properti</h2>
            <p className="text-gray-500 mt-1">
              {searchParams.search || searchParams.priceRange || searchParams.bedrooms 
                ? `Menampilkan hasil pencarian untuk filter Anda.` 
                : `Daftar properti terbaik yang disetujui oleh admin.`}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <ImageIcon size={60} className="mx-auto text-gray-300 mb-4"/>
              <p className="text-xl font-bold text-gray-600">Tidak ada properti ditemukan.</p>
              <p className="text-sm mt-1">Coba sesuaikan kata kunci atau filter pencarian Anda.</p>
            </div>
          ) : (
            properties.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                <div className="h-64 relative overflow-hidden">
                  <ImageSlider images={item.images || []} />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 shadow-sm flex items-center gap-1">
                    <MapPin size={12}/> {item.agent_name}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-2">
                    <MapPin size={16} className="text-red-400 shrink-0 mt-0.5"/> 
                    <span className="line-clamp-1">{item.address || "Alamat detail belum tersedia"}</span>
                  </div>
                  <h3 className="font-extrabold text-xl text-gray-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{item.title}</h3>
                  <p className="text-2xl font-black text-blue-600 mb-4">{formatRupiah(item.price)}</p>
                  
                  <div className="flex items-center justify-between py-4 border-y border-gray-100 text-gray-600 mb-4">
                    <div className="flex items-center gap-2" title="Kamar Tidur"><Bed size={18} className="text-gray-400"/> <span className="font-bold">{item.bedrooms}</span></div>
                    <div className="flex items-center gap-2" title="Kamar Mandi"><Bath size={18} className="text-gray-400"/> <span className="font-bold">{item.bathrooms}</span></div>
                    <div className="flex items-center gap-2" title="Luas Bangunan"><Maximize size={18} className="text-gray-400"/> <span className="font-bold">{item.area_sqm} m²</span></div>
                  </div>
                  
                  <button onClick={() => navigate(`/property/${item.slug}`)} className="mt-auto w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white py-3 rounded-xl font-bold transition-all border border-blue-100 hover:border-blue-600">
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}