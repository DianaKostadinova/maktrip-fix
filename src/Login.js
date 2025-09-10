import React, { useState, useEffect } from 'react';

import { auth } from './Firebase';
import './login.css';
import {
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendEmailVerification
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const IMGBB_API_KEY = '83a7bd6033a411dad73d2335d0885e45';  
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (user) {
                if (user.photoURL) {
                    setPhotoURL(user.photoURL);
                }
                if (user.displayName) {
                    setDisplayName(user.displayName);
                }
            } else {
                setPhotoURL('');
                setDisplayName('');
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);

            // Set the profile picture from the user's profile
            if (userCred.user.photoURL) {
                setPhotoURL(userCred.user.photoURL);
            }

            if (onLogin) onLogin();
            navigate('/');
        } catch (err) {
            alert("❌ Login failed: " + err.message);
        }
    };

    const uploadToImgBB = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            if (data.success) {
                return data.data.url;
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (err) {
            console.error('ImgBB upload error:', err);
            throw err;
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

    
        if (file.size > 32 * 1024 * 1024) { 
            alert("❌ File too large. Please choose an image under 32MB.");
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert("❌ Please select a valid image file.");
            return;
        }

        if (!IMGBB_API_KEY || IMGBB_API_KEY === 'your_imgbb_api_key_here') {
            alert("❌ Please configure your ImgBB API key first.");
            return;
        }

        setIsUploading(true);

        try {
            const imageUrl = await uploadToImgBB(file);
            setPhotoURL(imageUrl);
            alert("✅ Image uploaded successfully!");
        } catch (err) {
            alert("❌ Failed to upload image: " + err.message);
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const register = async () => {
        if (!displayName.trim()) {
            return alert("Please enter a display name");
        }

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with display name and photo URL
            await updateProfile(userCred.user, {
                displayName: displayName.trim(),
                photoURL: photoURL || null
            });

            await sendEmailVerification(userCred.user);
            alert("✅ Registered! Check your email to verify.");
            if (onLogin) onLogin();
            navigate('/');
        } catch (err) {
            alert("❌ Registration failed: " + err.message);
        }
    };

    const resetPassword = async () => {
        if (!email) return alert("Please enter your email first.");
        try {
            await sendPasswordResetEmail(auth, email);
            alert("📧 Password reset email sent. Check your inbox.");
        } catch (err) {
            alert("❌ " + err.message);
        }
    };

    const updateUserProfile = async () => {
        if (!currentUser) return;

        try {
            const updates = {};

         
            if (displayName.trim() && displayName.trim() !== currentUser.displayName) {
                updates.displayName = displayName.trim();
            }

          
            if (photoURL && photoURL !== currentUser.photoURL) {
                updates.photoURL = photoURL;
            }

            if (Object.keys(updates).length > 0) {
                await updateProfile(currentUser, updates);
                alert("✅ Profile updated successfully!");

                
                await currentUser.reload();
                setCurrentUser({ ...currentUser });
            } else {
                alert("No changes to save.");
            }
        } catch (err) {
            alert("❌ Failed to update profile: " + err.message);
        }
    };

    const removeProfilePicture = () => {
        setPhotoURL('');
    };

    
    const ProfilePicture = ({ src, size = 80 }) => (
        <div className="profile-picture-container" style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '10px auto',
            display: 'block',
            border: '3px solid #ddd',
            backgroundColor: '#f0f0f0'
        }}>
            {src ? (
                <img
                    src={src}
                    alt="Profile"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: src ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.4,
                    color: '#999'
                }}
            >
                👤
            </div>
        </div>
    );

    return (
        <div>
            <div className="background-fixed"></div>
            <div className="login-container">
                <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>

                {}
                {currentUser && (
                    <div className="current-user-info">
                        <ProfilePicture src={currentUser.photoURL} size={80} />
                        <p>Welcome back, {currentUser.displayName || currentUser.email}!</p>

                        {}
                        <div className="edit-profile-section">
                            <input
                                type="text"
                                placeholder="Update display name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="profile-input"
                            />

                            <div className="file-upload-section">
                                <label className="file-upload-label">
                                    📷 Change Profile Picture
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        disabled={isUploading}
                                    />
                                </label>

                                {isUploading && (
                                    <div className="upload-status">
                                        <p>⏳ Uploading new image...</p>
                                    </div>
                                )}

                                {photoURL && photoURL !== currentUser.photoURL && !isUploading && (
                                    <div className="preview-container">
                                        <ProfilePicture src={photoURL} size={60} />
                                        <p>✅ New image ready to save</p>
                                    </div>
                                )}
                            </div>

                            <div className="profile-actions">
                                <button
                                    onClick={updateUserProfile}
                                    className="primary-btn"
                                    disabled={isUploading}
                                    style={{ marginBottom: '10px' }}
                                >
                                    Save Changes
                                </button>

                                <button
                                    onClick={() => {
                                        auth.signOut();
                                        setPhotoURL('');
                                        setCurrentUser(null);
                                        setDisplayName('');
                                    }}
                                    className="secondary-btn"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!currentUser && (
                    <>
                        <div className="auth-toggle">
                            <button
                                className={!isRegistering ? 'active' : ''}
                                onClick={() => setIsRegistering(false)}
                            >
                                Login
                            </button>
                            <button
                                className={isRegistering ? 'active' : ''}
                                onClick={() => setIsRegistering(true)}
                            >
                                Register
                            </button>
                        </div>

                        {isRegistering && (
                            <input
                                type="text"
                                placeholder="Display Name *"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        )}

                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '' : ''}
                            </button>
                        </div>

                        {isRegistering && (
                            <div className="file-upload-section">
                                <label className="file-upload-label">
                                    📷 Upload Profile Picture (Optional)
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        disabled={isUploading}
                                    />
                                </label>

                                {isUploading && (
                                    <div className="upload-status">
                                        <p>⏳ Uploading image...</p>
                                    </div>
                                )}

                                {photoURL && !isUploading && (
                                    <div className="preview-container">
                                        <ProfilePicture src={photoURL} />
                                        <p>✅ Image uploaded successfully</p>
                                        <button
                                            onClick={removeProfilePicture}
                                            className="remove-btn"
                                            style={{
                                                background: '#ff4444',
                                                color: 'white',
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="button-group">
                            {isRegistering ? (
                                <button
                                    onClick={register}
                                    className="primary-btn"
                                    disabled={isUploading}
                                >
                                    Create Account
                                </button>
                            ) : (
                                <button onClick={login} className="primary-btn">
                                    Login
                                </button>
                            )}

                            {!isRegistering && (
                                <button onClick={resetPassword} className="secondary-btn">
                                    Forgot Password?
                                </button>
                            )}
                        </div>

                        {!isRegistering && (
                            <p className="switch-text">
                                Don't have an account?
                                <button
                                    className="link-btn"
                                    onClick={() => setIsRegistering(true)}
                                >
                                    Sign up here
                                </button>
                            </p>
                        )}

                        {isRegistering && (
                            <p className="switch-text">
                                Already have an account?
                                <button
                                    className="link-btn"
                                    onClick={() => setIsRegistering(false)}
                                >
                                    Login here
                                </button>
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}