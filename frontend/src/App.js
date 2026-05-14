import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for default Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => onLogin(email), 600);
  };

  return (
    <div className={`auth-page ${isExiting ? 'fade-out' : ''}`}>
      <div className="glass-card">
        <div className="auth-header">
          <div className="brand-badge">RDA GOV SRI LANKA</div>
          <h1>TERRA<span>SCAN</span></h1>
          <p>Advanced Road Surface Intelligence</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="email" placeholder="Personnel Email" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Security Key" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="login-button">INITIALIZE SYSTEM</button>
        </form>
      </div>
    </div>
  );
};

// --- MAP HELPER COMPONENTS ---
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) { onMapClick(e.latlng); },
  });
  return null;
};

const MapController = ({ selectedPos }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedPos) map.flyTo(selectedPos, 18, { duration: 1.5 });
  }, [selectedPos, map]);
  return null;
};

// --- MAIN APPLICATION ---
function App() {
  const [user, setUser] = useState(null); 
  const [cracks, setCracks] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAutoFetchActive, setIsAutoFetchActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // RDA Officer/Team List
  const officers = [
    "Eng. Karunaratne (Colombo)", 
    "Eng. Jayasuriya (Kandy)", 
    "Maintenance Team Alpha", 
    "Maintenance Team Beta",
    "Rapid Response Unit 01"
  ];

  const fetchData = async () => {
    if (!isAutoFetchActive) return;
    try {
      const response = await fetch('http://localhost:5000/api/cracks');
      const data = await response.json();
      // Ensure each crack has an assignedTo status
      const formattedData = data.map(c => ({ ...c, assignedTo: c.assignedTo || "Unassigned" }));
      setCracks(formattedData);
    } catch (e) { console.error("Backend offline"); }
  };

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setSelectedPos([parseFloat(lat), parseFloat(lon)]);
        } else {
          alert("Location not found!");
        }
      } catch (err) { console.error("Search failed", err); }
    }
  };

  const handleMapClick = (latlng) => {
    const newCrack = {
      id: Date.now(),
      type: "Manual Entry",
      lat: latlng.lat,
      lng: latlng.lng,
      severity: "High",
      assignedTo: "Unassigned"
    };
    setCracks([...cracks, newCrack]);
    setIsAutoFetchActive(false);
  };

  const assignOfficer = (id, officerName) => {
    setCracks(cracks.map(c => c.id === id ? { ...c, assignedTo: officerName } : c));
  };

  const deleteCrack = (id, e) => {
    e.stopPropagation();
    setIsAutoFetchActive(false);
    setCracks(cracks.filter(crack => crack.id !== id));
  };

  useEffect(() => {
    if (user && isAutoFetchActive) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user, isAutoFetchActive]);

  if (!user) return <LoginScreen onLogin={(u) => setUser(u)} />;

  const urgentCount = cracks.filter(c => c.severity === 'High').length;

  return (
    <div className={`app-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="main-header">
        <div className="header-left">
          <h1>TERRA<span>SCAN</span></h1>
          <p className="access-info">ACCESS: RDA OFFICER</p>
        </div>
        
        <div className="header-stats">
            <div className="stat-node"><span>DETECTED</span><strong>{cracks.length}</strong></div>
            <div className="stat-node"><span>URGENT</span><strong className="urgent-num">{urgentCount}</strong></div>
        </div>

        <div className="header-right">
          <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="logout-btn" onClick={() => setUser(null)}>LOGOUT</button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <h2 className="sidebar-title">
            CRACK FEED <span className="live-dot"></span>
          </h2>
          <div className="feed-scroll-area">
            {cracks.map((c) => (
              <div key={c.id} className="nav-card" onClick={() => setSelectedPos([c.lat, c.lng])}>
                <h3>{c.type}</h3>
                <div className="severity-pill">HIGH</div>
                <p className="assign-status">Assigned: <strong>{c.assignedTo}</strong></p>
                <p className="coords-text">{c.lat.toFixed(5)}, {c.lng.toFixed(5)}</p>
                <button className="delete-btn" onClick={(e) => deleteCrack(c.id, e)}>✕</button>
              </div>
            ))}
          </div>
        </aside>

        <main className="map-view">
          <div className="map-search-container">
            <input 
              type="text" 
              placeholder="Search Location..." 
              className="map-search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <div className="map-compass">
            <div className="compass-needle">N</div>
          </div>

          <MapContainer 
            center={[6.9271, 79.8612]} 
            zoom={15} 
            maxZoom={19}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer 
              url={isDarkMode 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
              } 
              attribution="© Google Maps"
              maxNativeZoom={18}
              maxZoom={20} 
            />
            <MapController selectedPos={selectedPos} />
            <MapEvents onMapClick={handleMapClick} />
            {cracks.map((crack) => (
              <CircleMarker 
                key={crack.id} 
                center={[crack.lat, crack.lng]} 
                radius={8} 
                className={crack.assignedTo === "Unassigned" ? "blinking-pin" : "assigned-pin"}
                pathOptions={{
                  color: crack.assignedTo === "Unassigned" ? '#ff4d4d' : '#f59e0b', 
                  fillColor: crack.assignedTo === "Unassigned" ? '#ff4d4d' : '#f59e0b', 
                  fillOpacity: 0.8,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{crack.type}</strong>
                    <p className="popup-status">Status: {crack.assignedTo === "Unassigned" ? "🔴 Pending" : "🟠 Assigned"}</p>
                    
                    <label className="assign-label">Dispatch Officer:</label>
                    <select 
                      className="assign-select"
                      value={crack.assignedTo}
                      onChange={(e) => assignOfficer(crack.id, e.target.value)}
                    >
                      <option value="Unassigned">Waiting for Assignment...</option>
                      {officers.map(off => <option key={off} value={off}>{off}</option>)}
                    </select>
                    
                    <hr />
                    <a href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${crack.lat},${crack.lng}`} target="_blank" rel="noreferrer" className="sv-btn">
                      Open Street View
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </main>
      </div>
    </div>
  );
}

export default App;