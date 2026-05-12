import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for missing marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function App() {
  const [cracks, setCracks] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:5000/api/cracks')
        .then(res => res.json())
        .then(data => setCracks(data));
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e', color: 'white' }}>
      <header style={{ padding: '10px 20px', background: '#16213e', borderBottom: '2px solid #e94560' }}>
        <h1>🛣️ RDA Smart Road Management System</h1>
      </header>
      
      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR LIST */}
        <div style={{ width: '300px', overflowY: 'auto', padding: '20px', borderRight: '1px solid #0f3460' }}>
          <h2>Live Feed</h2>
          {cracks.map(c => (
            <div key={c.id} style={{ background: '#0f3460', padding: '10px', marginBottom: '10px', borderRadius: '8px' }}>
              <h4 style={{ color: '#e94560' }}>{c.type}</h4>
              <p size="small">Priority: {c.severity}</p>
            </div>
          ))}
        </div>

        {/* REAL MAP */}
        <MapContainer center={[6.9271, 79.8612]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {cracks.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]}>
              <Popup>
                <strong>{c.type}</strong><br/>Status: {c.severity}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;