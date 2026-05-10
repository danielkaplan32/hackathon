
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const STATES = [
  '', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];


const ProfileScreen = ({ onProfileComplete }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    email: '',
    first_name: '',
    last_name: '',
    state: '',
    city: '',
    profile_image_base64: '', // base64 image
    bio: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);
      // Try to fetch user profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (data) {
        setProfile({
          email: data.email || session.user.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          state: data.state || '',
          city: data.city || '',
          profile_image_base64: data.profile_image_base64 || '',
          bio: data.bio || '',
        });
        setAvatarPreview(data.profile_image_base64 || '');
      } else {
        setProfile(p => ({
          ...p,
          email: session.user.email || '',
          first_name: session.user.user_metadata?.full_name?.split(' ')[0] || '',
          last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        }));
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
  };


  // Handle avatar upload
  const handleAvatarUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(p => ({ ...p, profile_image_base64: reader.result }));
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file); // base64 encode
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    if (!user) return;
    // Save to Supabase
    const updatePayload = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      state: profile.state,
      city: profile.city,
      profile_image_base64: profile.profile_image_base64,
      bio: profile.bio,
    };
    const { error } = await supabase.from('users').update(updatePayload).eq('id', user.id);
    setSaving(false);
    if (error) {
      alert('Error saving profile: ' + error.message);
    } else {
      if (onProfileComplete) onProfileComplete();
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="screen active" id="screen-profile" role="main" aria-label="Profile Setup Screen" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <form className="setup-card" role="form" aria-labelledby="profile-form-title" style={{margin: '0 auto'}} onSubmit={handleSubmit}>
        <div className="setup-title" id="profile-form-title">Set up your profile 👋</div>
        <div className="setup-sub">Tell the community a bit about yourself.</div>
        <div className="form-group" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <label htmlFor="avatar-upload">Profile Photo</label>
          <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 8 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              overflow: 'hidden',
              border: '2px solid #bbb',
            }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span role="img" aria-label="generic avatar">👤</span>
              )}
            </div>
            <label htmlFor="avatar-upload" style={{
              position: 'absolute',
              bottom: -8,
              right: -8,
              background: '#fff',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              border: '1px solid #ccc',
              cursor: 'pointer',
            }}>
              <span style={{fontSize: 24, color: '#1976d2'}}>+</span>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            name="email"
            type="email"
            value={profile.email}
            readOnly
            tabIndex={-1}
            style={{ fontStyle: 'italic', pointerEvents: 'none', background: 'inherit' }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-first-name">First Name</label>
          <input id="profile-first-name" name="first_name" type="text" value={profile.first_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="profile-last-name">Last Name</label>
          <input id="profile-last-name" name="last_name" type="text" value={profile.last_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="profile-state">State</label>
          <select id="profile-state" name="state" value={profile.state} onChange={handleChange} required>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="profile-city">City</label>
          <input id="profile-city" name="city" type="text" value={profile.city} onChange={handleChange} placeholder="City" />
        </div>
        <div className="form-group">
          <label htmlFor="profile-bio">Bio</label>
          <textarea id="profile-bio" name="bio" value={profile.bio} onChange={handleChange} placeholder="What do you love to trade?" />
        </div>
        <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile & Enter →'}</button>
      </form>
    </div>
  );
};

export default ProfileScreen;
