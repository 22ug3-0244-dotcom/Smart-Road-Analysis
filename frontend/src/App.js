import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Popup, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder'; 
import './App.css';

// Fix for default Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENT: LOGIN SCREEN ---
const LoginScreen = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      setIsExiting(true); // Trigger fade out of login
      setTimeout(() => {
        onLogin(email);
      }, 600); // Wait for animation to finish
    } else {
      alert("Please enter valid RDA credentials");
    }
  };

  return (
    <div className={`auth-overlay ${isExiting ? 'fade-out' : ''}`}>
      <div className="auth-card">
        <div className="auth-header">
          <h2>🛣️ RDA Smart Portal</h2>
          <p>{isSignUp ? 'Create Officer Account' : 'Authorized Personnel Login'}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Officer Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@rda.gov.lk" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="auth-btn">
            {isSignUp ? 'Register Account' : 'Sign In to Dashboard'}
          </button>
        </form>
        <p className="auth-toggle" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Sign In' : 'New Officer? Request Sign Up'}
        </p>
      </div>
    </div>
  );
};

// --- COMPONENT: MAP CONTROLLER ---
const MapController = ({ selectedPos }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedPos) {
      map.flyTo(selectedPos, 18, { duration: 1.5 });
    }
  }, [selectedPos, map]);
  return null;
};

// --- COMPONENT: CLICK TO ADD PIN ---
const AddPinOnClick = ({ onUpdate }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const crackTypes = ["Alligator Crack", "Longitudinal Crack", "Transverse Crack", "Pothole"];
      const severities = ["High", "Medium", "Low"];
      const randomType = crackTypes[Math.floor(Math.random() * crackTypes.length)];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

      await fetch('http://localhost:5000/api/cracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: randomType, severity: randomSeverity, lat, lng })
      });
      onUpdate();
    },
  });
  return null;
};

// --- COMPONENT: RED PULSING MARKER ---
const RedPulsingMarker = ({ crack, onSelect }) => {
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${crack.lat},${crack.lng}`;

  return (
    <CircleMarker 
      center={[crack.lat, crack.lng]}
      pathOptions={{ 
        color: '#ef4444', 
        fillColor: '#ef4444', 
        fillOpacity: 1, 
        weight: 2,
        className: 'pulsing-marker'
      }}
      radius={8}
      eventHandlers={{ click: () => onSelect([crack.lat, crack.lng]) }}
    >
      <Popup>
        <div className="popup-content">
          <strong>{crack.type}</strong><br/>
          Priority: <span className={`severity ${crack.severity.toLowerCase()}`}>{crack.severity}</span><br/>
          <hr/>
          <a href={streetViewUrl} target="_blank" rel="noreferrer" className="street-link">🛰️ Open Street View</a>
        </div>
      </Popup>
    </CircleMarker>
  );
};

// --- COMPONENT: SEARCH ---
const SearchField = () => {
  const map = useMap();
  const searchControlRef = useRef(null);

  useEffect(() => {
    if (!searchControlRef.current) {
      const geocoder = L.Control.geocoder({ 
        defaultMarkGeocode: false, 
        placeholder: "Search Area...", 
        collapsed: false 
      })
      .on('markgeocode', (e) => { map.setView(e.geocode.center, 16); })
      .addTo(map);
      searchControlRef.current = geocoder;
    }
  }, [map]);
  return null;
};

function App() {
  const [user, setUser] = useState(null); 
  const [cracks, setCracks] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cracks');
      const data = await response.json();
      const sortedData = data.sort((a, b) => (a.severity === 'High' ? -1 : 1));
      setCracks(sortedData);
    } catch (e) { console.error(e); }
  };

  const handleLogin = (email) => {
    setUser(email);
    setTimeout(() => setShowDashboard(true), 100); // Small delay to trigger CSS
  };

  const deleteCrack = async (e, id) => {
    e.stopPropagation();
    await fetch(`http://localhost:5000/api/cracks/${id}`, { method: 'DELETE' });
    fetchData();
  };

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const totalCracks = cracks.length;
  const highPriority = cracks.filter(c => c.severity === 'High').length;
  const estimatedBudget = cracks.reduce((sum, c) => {
    const costs = { High: 15000, Medium: 7500, Low: 3000 };
    return sum + (costs[c.severity] || 0);
  }, 0);

  return (
    <div className={`app-container dashboard-entry ${showDashboard ? 'active' : ''}`}>
      <header className="app-header">
        <div className="header-left">
          <h1>🛣️ RDA Smart Road Portal</h1>
          <p className="subtitle">Welcome, Officer {user.split('@')[0]}</p>
        </div>
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Total Repairs</span>
            <span className="stat-value">{totalCracks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Urgent (High)</span>
            <span className="stat-value text-red">{highPriority}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Est. Budget</span>
            <span className="stat-value text-green">LKR {estimatedBudget.toLocaleString()}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={() => { setShowDashboard(false); setTimeout(() => setUser(null), 500); }}>Logout</button>
      </header>

      <div className="main-content">
        <div className="sidebar">
          <h2>Work Order Queue</h2>
          <div className="feed-list">
            {cracks.map((c) => (
              <div key={c.id} className="card clickable-card" onClick={() => setSelectedPos([c.lat, c.lng])}>
                <div className="card-header">
                  <h3>{c.type}</h3>
                  <button className="delete-btn" onClick={(e) => deleteCrack(e, c.id)}>✅</button>
                </div>
                <div className="card-body">
                  <span className={`severity ${c.severity.toLowerCase()}`}>{c.severity}</span>
                  <p className="coord">{c.lat.toFixed(5)}, {c.lng.toFixed(5)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="map-wrapper">
          <MapContainer center={[6.9271, 79.8612]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="Google Maps" />
            <SearchField />
            <MapController selectedPos={selectedPos} />
            <AddPinOnClick onUpdate={fetchData} />
            {cracks.map((crack) => (
              <RedPulsingMarker key={crack.id} crack={crack} onSelect={setSelectedPos} />
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;