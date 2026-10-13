import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from './Firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './chat.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userLocationIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="8" fill="#4285F4" stroke="white" stroke-width="3"/>
            <circle cx="15" cy="15" r="3" fill="white"/>
        </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});

const cafeIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.9 12.5 28.5 12.5 28.5S25 23.4 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#8B4513"/>
            <circle cx="12.5" cy="12.5" r="8" fill="white"/>
            <path d="M8 9h9v1h-9zm0 2h9v1h-9zm0 2h9v1h-9z" fill="#8B4513"/>
            <circle cx="12.5" cy="12.5" r="2" fill="#8B4513"/>
        </svg>
    `),
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const nightlifeIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.9 12.5 28.5 12.5 28.5S25 23.4 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#ff6b6b"/>
            <circle cx="12.5" cy="12.5" r="8" fill="white"/>
            <path d="M9 8h2v3h3v2h-3v3h-2v-3H6v-2h3V8z" fill="#ff6b6b"/>
        </svg>
    `),
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const placesIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.9 12.5 28.5 12.5 28.5S25 23.4 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#007bff"/>
            <circle cx="12.5" cy="12.5" r="8" fill="white"/>
            <path d="M12.5 6L15 11h-5l2.5-5zm0 12L10 13h5l-2.5 5z" fill="#007bff"/>
        </svg>
    `),
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapController({ userLocation, selectedPlace, routeCoordinates }) {
    const map = useMap();
    useEffect(() => {
        if (userLocation && selectedPlace && routeCoordinates.length > 0) {
            const bounds = L.latLngBounds([
                [userLocation.lat, userLocation.lng],
                [selectedPlace.coords.lat, selectedPlace.coords.lng]
            ]);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (userLocation) {
            map.setView([userLocation.lat, userLocation.lng], 13);
        }
    }, [userLocation, selectedPlace, routeCoordinates, map]);
    return null;
}

export default function Card({ onClose = () => { } }) {
    const user = auth.currentUser;
    const [pinnedPlaces, setPinnedPlaces] = useState([]);
    const [savedPlan, setSavedPlan] = useState('');
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [likes, setLikes] = useState({});
    const [plan, setPlan] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showDirections, setShowDirections] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [loadingRoute, setLoadingRoute] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [transitMode, setTransitMode] = useState('driving');
    const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
    const [editPhotoURL, setEditPhotoURL] = useState(user?.photoURL || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const ref = useRef();
    const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY;

    const formatDuration = (minutes) => {
        if (!isFinite(minutes) || minutes <= 0) return '<1 min';
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };



    const uploadToImgBB = async (file) => {
        if (!IMGBB_API_KEY) {
            throw new Error('ImgBB API key is not configured. Please check your .env file.');
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('ImgBB API Error:', errorText);
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.url) {
                return data.data.url;
            } else {
                console.error('ImgBB Response:', data);
                throw new Error(data.error?.message || 'Upload failed - invalid response from ImgBB');
            }
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 32 * 1024 * 1024) {
            alert('❌ File too large. Please choose an image under 32MB.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('❌ Please select a valid image file.');
            return;
        }

        if (!IMGBB_API_KEY) {
            alert('❌ ImgBB API key is not configured. Please add REACT_APP_IMGBB_API_KEY to your .env file.');
            console.error('Missing IMGBB_API_KEY. Current value:', IMGBB_API_KEY);
            return;
        }

        setIsUploading(true);
        try {
            console.log('Starting image upload...');
            const imageUrl = await uploadToImgBB(file);
            console.log('Upload successful:', imageUrl);

            setEditPhotoURL(imageUrl);
            alert('✅ Image uploaded successfully! Click "Save Changes" to apply.');
        } catch (error) {
            console.error('Upload failed:', error);
            alert(`❌ Failed to upload image: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleSaveProfile = async () => {
        if (!user) {
            alert('❌ No user logged in');
            return;
        }
        setIsSaving(true);
        try {
            const updates = {};
            if (editDisplayName.trim()) updates.displayName = editDisplayName.trim();
            if (editPhotoURL) updates.photoURL = editPhotoURL;
            if (Object.keys(updates).length > 0) {
                await updateProfile(user, updates);
                await user.reload();
                alert('✅ Profile updated successfully!');
                setShowEditModal(false);
                window.location.reload();
            } else {
                alert('❌ No changes to save.');
            }
        } catch (err) {
            alert('❌ Failed to update profile: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditProfile = () => {
        setEditDisplayName(user?.displayName || '');
        setEditPhotoURL(user?.photoURL || '');
        setShowEditModal(true);
    };

    useEffect(() => {
        const docRef = doc(db, 'users', user.uid);
        getDoc(docRef).then(snap => {
            if (!snap.exists()) {
                setDoc(docRef, { pinnedPlaces: [], likes: {}, plan: '' });
            }
        });
        return onSnapshot(docRef, (snap) => {
            const data = snap.data() || {};
            setPinnedPlaces(data.pinnedPlaces || []);
            setSavedPlan(data.travelPlan || '');
            setLikes(data.likes || {});
            setPlan(data.plan || '');
        });
    }, [user.uid]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getUserLocation = () => {
        setLocationError('');
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(loc);
                },
                () => {
                    setLocationError('Unable to get your location. Please enable location services.');
                }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser.');
        }
    };

    const calculateRoute = async (destination, mode) => {
        if (!userLocation) return;
        setLoadingRoute(true);
        setTransitMode(mode);
        try {
            const modeMap = { driving: 'driving', walking: 'walking', cycling: 'cycling' };
            const coords = `${userLocation.lng},${userLocation.lat};${destination.coords.lng},${destination.coords.lat}`;
            const response = await fetch(`https://router.project-osrm.org/route/v1/${modeMap[mode]}/${coords}?overview=full&geometries=geojson`);
            const data = await response.json();
            if (data.routes && data.routes[0]) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                setRouteCoordinates(coordinates);
                const distance = (route.distance / 1000).toFixed(1);
                const duration = Math.max(1, Math.round(route.duration / 60));
                setRouteInfo({ distance: `${distance} km`, duration: formatDuration(duration), mode });
            } else {
                throw new Error('No route found');
            }
        } catch (error) {
            const R = 6371;
            const dLat = (destination.coords.lat - userLocation.lat) * Math.PI / 180;
            const dLon = (destination.coords.lng - userLocation.lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(destination.coords.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            setRouteCoordinates([[userLocation.lat, userLocation.lng], [destination.coords.lat, destination.coords.lng]]);
            const speeds = { driving: 50, cycling: 15, walking: 5 };
            const selectedSpeed = speeds[mode] || speeds.driving;
            const estimatedTime = Math.round((distance / selectedSpeed) * 60);
            setRouteInfo({ distance: `${distance.toFixed(1)} km`, duration: formatDuration(estimatedTime), mode, note: 'Straight-line distance (routing service unavailable)' });
        } finally {
            setLoadingRoute(false);
        }
    };

    useEffect(() => {
        if (userLocation && showDirections && selectedPlace) {
            calculateRoute(selectedPlace, transitMode);
        }
    }, [userLocation]);

    const handleGetDirections = (place) => {
        if (!userLocation) getUserLocation();
        setSelectedPlace(place);
        setShowDirections(true);
        if (userLocation) calculateRoute(place, transitMode);
    };

    const handleDeletePlan = async () => {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, { plan: '' });
    };

    const getIconForPlace = (place) => {
        if (place.type === 'cafe') return cafeIcon;
        if (place.type === 'nightlife') return nightlifeIcon;
        if (place.type === 'places') return placesIcon;
        return defaultIcon;
    };

    const getIconEmoji = (type) => {
        switch (type) {
            case 'cafe': return '☕';
            case 'nightlife': return '🍸';
            case 'places': return '🗺️';
            default: return '📍';
        }
    };

    const groupedPlaces = pinnedPlaces.reduce((acc, place) => {
        const type = place.type || 'general';
        if (!acc[type]) acc[type] = [];
        acc[type].push(place);
        return acc;
    }, {});

    return (
        <>
            <div className="dropdown-card" ref={ref} style={{ maxHeight: showDirections ? '80vh' : '60vh', overflowY: 'auto', width: '500px' }}>
                <div className="user-section">
                    <img src={user.photoURL || '/default.png'} alt="Profile" />
                    <div>
                        <strong>{user.displayName}</strong>
                        <br></br>
                        <span>{user.email}</span>
                        <div className="profile-actions">
                            <button className="edit-profile-btn" onClick={handleEditProfile}>✏️ Edit Profile</button>
                            <button className="logout-btn" onClick={() => signOut(auth)}>Logout</button>
                        </div>
                    </div>
                </div>

                <div className="map-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4>Your Pinned Places ({pinnedPlaces.length})</h4>
                        <button onClick={getUserLocation} style={{ padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'orange', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer' }}>📍 My Location</button>
                    </div>

                    {locationError && (
                        <div style={{ color: 'red', fontSize: '0.8rem', marginBottom: '10px' }}>{locationError}</div>
                    )}

                    {pinnedPlaces.length > 0 && (
                        <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px', fontSize: '0.8rem' }}>
                            {Object.entries(groupedPlaces).map(([type, places]) => (
                                <span key={type} style={{ backgroundColor: type === 'cafe' ? '#8B4513' : type === 'nightlife' ? '#ff6b6b' : type === 'places' ? '#007bff' : '#6c757d', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                    {getIconEmoji(type)} {places.length}
                                </span>
                            ))}
                        </div>
                    )}

                    {pinnedPlaces.length > 0 ? (
                        <MapContainer center={[41.6086, 21.7453]} zoom={7} scrollWheelZoom={false} style={{ height: showDirections ? '250px' : '150px', borderRadius: '10px' }}>
                            <TileLayer attribution='&copy; OpenStreetMap contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                            <MapController userLocation={userLocation} selectedPlace={selectedPlace} routeCoordinates={routeCoordinates} />

                            {userLocation && (
                                <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                                    <Popup>Your Location</Popup>
                                </Marker>
                            )}

                            {pinnedPlaces.map((place, index) => (
                                <Marker key={index} position={[place.coords.lat, place.coords.lng]} icon={getIconForPlace(place)}>
                                    <Popup>
                                        <div>
                                            <strong>{getIconEmoji(place.type)} {place.name}</strong>
                                            {place.type && (
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>Type: {place.type}</div>
                                            )}
                                            <button onClick={() => handleGetDirections(place)} style={{ marginTop: '5px', padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                                                Get Directions
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            {routeCoordinates.length > 0 && (
                                <Polyline positions={routeCoordinates} color="#007bff" weight={4} opacity={0.8} />
                            )}
                        </MapContainer>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>No pinned locations yet. Start exploring!</p>
                    )}
                </div>

                {showDirections && selectedPlace && (
                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                        <h5 style={{ marginBottom: '10px' }}>Directions to {selectedPlace.name}</h5>

                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                            {['driving'].map(mode => (
                                <button key={mode} onClick={() => calculateRoute(selectedPlace, mode)} style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: transitMode === mode ? '#007bff' : '#e9ecef', color: transitMode === mode ? 'white' : '#495057', border: 'none', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>
                                    {mode === 'driving' && '🚗'}
                                   
                                    <span style={{ marginLeft: '3px' }}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                                </button>
                            ))}
                        </div>

                        {loadingRoute && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>Loading route...</div>
                        )}

                        {routeInfo && !loadingRoute && (
                            <div>
                                {routeInfo.error ? (
                                    <p style={{ color: 'red' }}>{routeInfo.error}</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                                            <span>📏 Distance: {routeInfo.distance}</span>
                                            <span>⏱️ Duration: {routeInfo.duration}</span>
                                        </div>

                                        {routeInfo.note && (
                                            <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', marginBottom: '10px' }}>
                                                {routeInfo.note}
                                            </p>
                                        )}

                                        <button onClick={() => { setShowDirections(false); setSelectedPlace(null); setRouteCoordinates([]); setRouteInfo(null); }} style={{ width: '100%', padding: '8px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            Close Directions
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {savedPlan && (
                    <div className="plan-section">
                        <h4>Saved Plan</h4>
                        <button onClick={() => setShowPlanModal(true)} className="plan-icon-button">View Pinned Plan</button>
                    </div>
                )}
            </div>

            {showEditModal && (
                <div className="plan-modal-overlay" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <div className="plan-modal-content" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowEditModal(false)}>X</button>
                        <h2>Edit Profile</h2>
                        <div style={{ padding: '20px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <img src={editPhotoURL || user.photoURL || '/default.png'} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover', border: '3px solid #ddd' }} />
                                <div>
                                    <label style={{ display: 'inline-block', padding: '8px 12px', backgroundColor: 'orange', color: 'white', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Change Picture
                                        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
                                    </label>
                                    {isUploading && (
                                        <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '5px' }}>⏳ Uploading...</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Display Name:
                                </label>
                                <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} placeholder="Enter your display name" />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Email:
                                </label>
                                <input type="email" value={user.email} disabled style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', backgroundColor: '#f8f9fa', color: '#666' }} />
                                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                                    Email cannot be changed
                                </small>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={handleSaveProfile} disabled={isSaving || isUploading} style={{ flex: 1, padding: '10px', backgroundColor: 'orange', color: 'white', border: 'none', borderRadius: '5px', cursor: isSaving || isUploading ? 'not-allowed' : 'pointer', opacity: isSaving || isUploading ? 0.6 : 1 }}>
                                    {isSaving ? '⏳ Saving...' : '✅ Save Changes'}
                                </button>

                                <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPlanModal && (
                <div className="plan-modal-overlay" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    <div className="plan-modal-content" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowPlanModal(false)}>X</button>
                        <h2>Your Travel Plan</h2>
                        <pre onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{savedPlan}</pre>
                    </div>
                </div>
            )}
        </>
    );
}
