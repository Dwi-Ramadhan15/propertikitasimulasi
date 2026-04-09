import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, User, Phone, ArrowLeft, Image as ImageIcon, CheckCircle, ExternalLink, MessageCircle, Waves, TreePine, ShieldCheck, Car, Wifi } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapEvents({ target, property }) {
  const map = useMap();
  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  if (!property) return null;

  return (
    <Marker 
      position={target} 
      icon={customIcon}
      eventHandlers={{ click: (e) => map.setView(e.latlng, 17, { animate: true }) }}
    >
      <Popup minWidth={220}>
        <div className="flex flex-col gap-2 p-1">
          <div className="w-full h-28 rounded-lg overflow-hidden bg-gray-100">
             <img src={property.images?.[0]} alt="preview" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 leading-tight text-sm">{property.title}</h4>
            <p className="text-blue-600 font-black text-sm mt-0.5">{formatRupiah(property.price)}</p>
          </div>
          <a 
            href={`http://maps.google.com/maps?q=${property.latitude},${property.longitude}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-200 text-white text-[11px] font-bold py-2 rounded hover:bg-green-500 transition-all no-underline shadow-sm mt-1"
          >
            <ExternalLink size={12} /> Buka Google Maps
          </a>
        </div>
      </Popup>
    </Marker>
  );
}

const getFacilityIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('kolam') || lowerName.includes('renang')) return <Waves size={20} />;
  if (lowerName.includes('taman') || lowerName.includes('hijau')) return <TreePine size={20} />;
  if (lowerName.includes('aman') || lowerName.includes('security')) return <ShieldCheck size={20} />;
  if (lowerName.includes('carport') || lowerName.includes('parkir')) return <Car size={20} />;
  if (lowerName.includes('wifi') || lowerName.includes('internet')) return <Wifi size={20} />;
  return <CheckCircle size={20} />; 
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [waMessage, setWaMessage] = useState("Halo, saya tertarik dengan properti ini. Boleh minta info lebih lanjut?");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        setProperty(response.data);
        if (response.data.images?.length > 0) setMainImage(response.data.images[0]);
        
        setWaMessage(`Halo ${response.data.agent_name}, saya melihat properti *${response.data.title}* di PropertiKita. Apakah masih tersedia?`);
      } catch (err) {
        alert("Properti tidak ditemukan!");
        navigate('/');
      } finally { setLoading(false); }
    };
    fetchDetail();
  }, [id, navigate]);

  const handleContactWhatsApp = (e) => {
    const token = localStorage.getItem('token');
    if (!token) {
      e.preventDefault();
      alert("Maaf, Anda harus login terlebih dahulu untuk mengirim pesan ke agen.");
      navigate('/auth');
      return;
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  if (!property) return null;

  const lat = parseFloat(property.latitude);
  const lon = parseFloat(property.longitude);
  const position = [lat, lon];
  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  
  const waNumber = property.agent_phone?.startsWith('0') ? '62' + property.agent_phone.substring(1) : property.agent_phone;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 font-bold transition-all bg-white px-5 py-2.5 rounded-full shadow-sm w-fit group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Kembali
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="space-y-4">
              <div className="h-[400px] md:h-[550px] w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 p-2">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-100 relative group">
                  {mainImage ? <img src={mainImage} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={60}/></div>}
                </div>
              </div>
              {property.images?.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x">
                  {property.images.map((img, idx) => (
                    <div key={idx} onClick={() => setMainImage(img)} className={`h-24 w-32 flex-shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer border-[3px] transition-all ${mainImage === img ? 'border-blue-600 scale-105 shadow-md' : 'border-white opacity-70 hover:opacity-100'}`}>
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-8">
              <h3 className="font-extrabold text-gray-800 mb-6 text-xl">Fasilitas Unggulan</h3>
              {property.facilities ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(typeof property.facilities === 'string' ? JSON.parse(property.facilities) : property.facilities).map((fasilitas, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-blue-800 hover:bg-blue-100 transition-colors cursor-default">
                      <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                        {getFacilityIcon(fasilitas)}
                      </div>
                      <span className="font-bold text-sm">{fasilitas}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">Fasilitas belum ditambahkan oleh agen.</p>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-extrabold text-gray-800 mb-4 text-xl">Deskripsi Properti</h3>
              <p className="text-gray-600 text-sm md:text-base whitespace-pre-wrap leading-relaxed text-justify">{property.description}</p>
            </div>
            
          </div>

          <div className="space-y-6">
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-5 py-2 rounded-bl-3xl font-bold text-xs flex items-center gap-1.5 shadow-sm"><CheckCircle size={14}/> Terverifikasi</div>
              
              <div className="flex flex-col mb-5 mt-4">
                <div className="flex items-start gap-2 text-gray-700 font-bold text-sm">
                  <MapPin size={18} className="text-red-500 shrink-0 mt-0.5"/> 
                  <span>{property.address || "Alamat belum tersedia"}</span>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 leading-tight">{property.title}</h1>
              <p className="text-4xl font-black text-blue-600 mb-8 tracking-tight">{formatRupiah(property.price)}</p>
              
              <div className="grid grid-cols-3 gap-3 py-6 border-t border-gray-100 bg-white">
                <div className="text-center bg-gray-50 p-3 rounded-2xl"><Bed size={24} className="mx-auto text-blue-600 mb-1.5"/><p className="font-bold text-lg text-gray-800">{property.bedrooms}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Kamar</p></div>
                <div className="text-center bg-gray-50 p-3 rounded-2xl"><Bath size={24} className="mx-auto text-blue-600 mb-1.5"/><p className="font-bold text-lg text-gray-800">{property.bathrooms}</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Mandi</p></div>
                <div className="text-center bg-gray-50 p-3 rounded-2xl"><Maximize size={24} className="mx-auto text-blue-600 mb-1.5"/><p className="font-bold text-lg text-gray-800">{property.area_sqm}m²</p><p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Luas</p></div>
              </div>
            </div>

            <div className="bg-blue-50/80 p-8 rounded-3xl border border-blue-200 shadow-lg shadow-blue-100">
              <h3 className="font-extrabold text-blue-900 mb-5 flex items-center gap-2">Tanya Agen Sekarang</h3>
              
              <div className="flex items-center gap-4 mb-6 bg-white p-3 rounded-2xl border border-blue-100">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-2 border-white shrink-0"><User size={28}/></div>
                <div>
                  <p className="font-bold text-gray-800 text-lg leading-tight">{property.agent_name}</p>
                  <p className="text-gray-500 text-xs flex items-center gap-1 mt-1 font-medium"><Phone size={12} className="text-blue-500"/> {property.agent_phone}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Pesan Anda</label>
                <textarea 
                  rows="4"
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full p-4 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-white resize-none shadow-inner"
                ></textarea>
              </div>
              
              <a 
                href={waLink} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={handleContactWhatsApp}
                className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold transition-all shadow-lg text-base no-underline ${
                  !localStorage.getItem('token') 
                  ? 'bg-green-500 text-white cursor-pointer' 
                  : 'bg-green-400 hover:bg-green-600 text-white shadow-green-500/30'
                }`}
              >
              <MessageCircle size={20}/> Kirim Pesan via WA
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-20">
          <h3 className="font-extrabold text-2xl text-gray-800 mb-6 flex items-center gap-2">
            <MapPin className="text-red-500" /> Lokasi Properti
          </h3>
          <div className="w-full h-[480px] rounded-2xl overflow-hidden border-2 border-gray-100 z-0 shadow-inner">
            <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapEvents target={position} property={property} /> 
            </MapContainer>
            
          </div>
          <p className="text-center text-xs text-gray-400 mt-5 italic bg-gray-50 border border-gray-100 w-fit mx-auto px-5 py-2 rounded-full">
            Lokasi peta menunjukkan titik koordinat asli dari properti ini.
          </p>
        </div>
      </div>
    </div>
  );
}