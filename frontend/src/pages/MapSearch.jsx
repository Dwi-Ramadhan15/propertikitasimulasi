import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import { MapPin, Bed, Bath, Maximize, Image as ImageIcon, Search, Crosshair, Map, Filter, RefreshCcw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// 1. Ikon Standar (Biru)
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// 2. Ikon Hover (Merah) - Sesuai Requirement Blueprint
const highlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// 3. Ikon Kantor (Violet) - Biar tidak tabrakan dengan rumah merah
const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ isSettingOffice, setOfficeLocation, setIsSettingOffice }) {
  useMapEvents({
    click(e) {
      if (isSettingOffice) {
        setOfficeLocation([e.latlng.lat, e.latlng.lng]);
        setIsSettingOffice(false);
      }
    },
  });
  return null;
}

const MAX_PRICE_SLIDER = 20000000000;

export default function MapSearch() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState([-2.5489, 118.0149]); 
  const [mapZoom, setMapZoom] = useState(5);
  const navigate = useNavigate();

  // --- STATE HOVER BARU ---
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

  // --- STATE FILTER ---
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: MAX_PRICE_SLIDER }); 
  const [selectedBeds, setSelectedBeds] = useState([]); 

  // --- STATE RADIUS ---
  const [officeLocation, setOfficeLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [isSettingOffice, setIsSettingOffice] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties');
        setProperties(response.data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchProperties();
  }, []);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  
  const formatShortPrice = (angka) => {
    if (angka >= 1000000000) return `${(angka / 1000000000).toFixed(1)}M`;
    if (angka >= 1000000) return `${Math.floor(angka / 1000000)}Jt`;
    return angka;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: 0, max: MAX_PRICE_SLIDER });
    setSelectedBeds([]);
    setOfficeLocation(null);
    setRadiusKm(5);
    setIsSettingOffice(false);
  };

  let filteredProperties = properties.filter(p => {
    const matchText = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchPrice = priceRange.max === MAX_PRICE_SLIDER ? p.price >= priceRange.min : p.price >= priceRange.min && p.price <= priceRange.max;
    
    let matchBed = true;
    if (selectedBeds.length > 0) {
      if (selectedBeds.includes('3+')) matchBed = selectedBeds.includes(p.bedrooms.toString()) || p.bedrooms >= 3;
      else matchBed = selectedBeds.includes(p.bedrooms.toString());
    }

    let matchRadius = true;
    if (officeLocation) {
      const distance = calculateDistance(officeLocation[0], officeLocation[1], parseFloat(p.latitude), parseFloat(p.longitude));
      matchRadius = distance <= radiusKm;
    }

    return matchText && matchPrice && matchBed && matchRadius;
  });

  const handleCardClick = (lat, lon) => {
    setActiveLocation([parseFloat(lat), parseFloat(lon)]);
    setMapZoom(16);
  };

  const toggleBedSelection = (bed) => {
    if (selectedBeds.includes(bed)) setSelectedBeds(selectedBeds.filter(b => b !== bed));
    else setSelectedBeds([...selectedBeds, bed]);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-76px)] bg-gray-50 overflow-hidden">
      
      {/* PANEL KIRI: FILTER & DAFTAR PROPERTI */}
      <div className="w-full md:w-[450px] lg:w-[480px] h-1/2 md:h-full bg-white flex flex-col shadow-lg z-10">
        
        {/* FILTER ADVANCED */}
        <div className="p-5 border-b border-gray-100 bg-white shadow-sm z-10 overflow-y-auto max-h-[55%] scrollbar-hide">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><Filter size={24} className="text-blue-600" /> Filter</h2>
            <button onClick={handleResetFilters} className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-full"><RefreshCcw size={12}/> Reset</button>
          </div>
          
          <div className="relative mb-5">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input type="text" placeholder="Ketik nama atau lokasi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm" />
          </div>

          <div className="mb-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex justify-between"><span>Rentang Harga</span></h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-medium flex justify-between mb-1">
                  <span>Harga Maksimum:</span>
                  <span className="font-bold text-blue-600">{priceRange.max === MAX_PRICE_SLIDER ? "Tanpa Batas" : formatShortPrice(priceRange.max)}</span>
                </label>
                <input type="range" min="100000000" max={MAX_PRICE_SLIDER} step="100000000" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div className="text-center bg-white py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700">
                0 - {priceRange.max === MAX_PRICE_SLIDER ? "Tanpa Batas" : formatRupiah(priceRange.max)}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Jumlah Kamar Tidur</h3>
            <div className="flex gap-2">
              {['1', '2', '3+'].map(bed => (
                <button key={bed} onClick={() => toggleBedSelection(bed)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all border ${selectedBeds.includes(bed) ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{bed} Kamar</button>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${isSettingOffice ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"><Map size={16}/> Filter Jarak dari Kantor</h3>
            <button onClick={() => setIsSettingOffice(!isSettingOffice)} className={`w-full flex justify-center items-center gap-2 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${isSettingOffice ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-200'}`}>
              <Crosshair size={16}/> {isSettingOffice ? "Klik Peta sekarang..." : officeLocation ? "Ubah Titik Kantor" : "1. Tentukan Lokasi Kantor"}
            </button>
            {officeLocation && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>2. Radius Pencarian:</span><span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{radiusKm} km</span>
                </div>
                <input type="range" min="1" max="50" value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* HASIL LISTING */}
        <div className="bg-gray-100 px-5 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center shadow-inner z-20 relative">
          <span>Hasil Pencarian</span>
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">{filteredProperties.length} Properti</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-gray-50/80">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100"><Filter size={24} className="text-gray-300" /></div>
              <p className="text-gray-600 font-bold text-sm">Yah, tidak ada properti yang cocok.</p>
              <p className="text-xs text-gray-400 mt-1">Coba tekan tombol <b className="text-blue-500">Reset</b> di atas untuk menghapus semua filter.</p>
            </div>
          ) : (
            filteredProperties.map(p => {
              const distance = officeLocation ? calculateDistance(officeLocation[0], officeLocation[1], parseFloat(p.latitude), parseFloat(p.longitude)) : null;
              
              // Cek apakah item ini sedang di hover
              const isHovered = hoveredPropertyId === p.id;
              
              return (
                <div 
                  key={p.id} 
                  onClick={() => handleCardClick(p.latitude, p.longitude)}
                  onMouseEnter={() => setHoveredPropertyId(p.id)}   // Deteksi mouse masuk
                  onMouseLeave={() => setHoveredPropertyId(null)}   // Deteksi mouse keluar
                  className={`flex gap-4 p-3 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    isHovered ? 'bg-red-50 border-red-400 shadow-md scale-[1.02]' : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center"><ImageIcon className="text-gray-400"/></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between py-1 overflow-hidden w-full">
                    <div>
                      <h3 className={`font-extrabold text-sm truncate transition-colors ${isHovered ? 'text-red-600' : 'text-gray-800'}`}>{p.title}</h3>
                      <p className="text-blue-600 font-black mt-0.5 text-sm">{formatRupiah(p.price)}</p>
                      
                      {officeLocation && distance !== null ? (
                        <p className="text-[10px] bg-red-100 border border-red-200 text-red-700 font-bold px-2 py-0.5 rounded w-fit mt-1 flex items-center gap-1">
                          <MapPin size={10}/> {distance.toFixed(1)} km dari Kantor
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500 mt-1 flex items-start gap-1 truncate">
                          <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5"/> 
                          <span className="truncate">{p.address}</span>
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center gap-3 text-[10px] font-bold mt-2 w-fit px-2 py-1 rounded-md transition-colors ${isHovered ? 'bg-white text-gray-600' : 'bg-gray-50 text-gray-500'}`}>
                      <span className="flex items-center gap-1"><Bed size={12} className={isHovered ? 'text-red-500' : 'text-blue-500'}/> {p.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath size={12} className={isHovered ? 'text-red-500' : 'text-blue-500'}/> {p.bathrooms}</span>
                      <span className="flex items-center gap-1"><Maximize size={12} className={isHovered ? 'text-red-500' : 'text-blue-500'}/> {p.area_sqm}m²</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PANEL KANAN: PETA FULL SCREEN */}
      <div className={`flex-1 h-1/2 md:h-full relative z-0 ${isSettingOffice ? 'cursor-crosshair' : ''}`}>
        {isSettingOffice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/90 text-white px-6 py-2 rounded-full font-bold shadow-2xl animate-pulse border border-gray-700">
            Klik lokasi kantor Anda di peta...
          </div>
        )}

        <MapContainer center={activeLocation} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController center={activeLocation} zoom={mapZoom} />
          <MapClickHandler isSettingOffice={isSettingOffice} setOfficeLocation={setOfficeLocation} setIsSettingOffice={setIsSettingOffice} />

          {officeLocation && (
            <>
              <Marker position={officeLocation} icon={officeIcon}>
                <Popup><p className="font-bold text-sm text-center text-purple-700">🏢<br/>Pusat Pencarian<br/>(Kantor Anda)</p></Popup>
              </Marker>
              <Circle 
                center={officeLocation} 
                radius={radiusKm * 1000} 
                pathOptions={{ color: '#8b5cf6', fillColor: '#c4b5fd', fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }} 
              />
            </>
          )}
          
          {/* ... KODE SEBELUMNYA ... */}
          
          {filteredProperties.map(p => {
            const lat = parseFloat(p.latitude);
            const lon = parseFloat(p.longitude);
            if (isNaN(lat) || isNaN(lon)) return null;

            // CEK: Apakah ID rumah ini sedang di hover oleh mouse di daftar sebelah kiri?
            const isHovered = hoveredPropertyId === p.id;

            return (
              <Marker 
                // KUNCI RAHASIANYA DI SINI: Kita ubah key-nya setiap kali status hover berubah
                key={`${p.id}-${isHovered ? 'hover' : 'normal'}`} 
                
                position={[lat, lon]} 
                icon={isHovered ? highlightIcon : customIcon} 
                zIndexOffset={isHovered ? 1000 : 0}
              >
                <Popup className="custom-popup">
                  {/* ... ISI POPUP TETAP SAMA ... */}
                  <div className="w-48">
                    <div className="h-28 w-full rounded-t-lg overflow-hidden bg-gray-200 -mt-4 -mx-5 mb-2 w-[calc(100%+40px)] relative">
                      {p.images && p.images.length > 0 && <img src={p.images[0]} className="w-full h-full object-cover" alt="Property" />}
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">{p.title}</h4>
                    <p className="text-blue-600 font-black text-sm my-1">{formatRupiah(p.price)}</p>
                    <button 
                      onClick={() => navigate(`/property/${p.slug}`)}
                      className="w-full bg-blue-600 text-white text-[11px] font-bold py-1.5 rounded-md mt-2 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Lihat Detail Rumah
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}