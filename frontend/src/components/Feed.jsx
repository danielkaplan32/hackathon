import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const STATES = [
  '', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function OfferOptions() {
  const [offerType, setOfferType] = useState('item'); // 'item', 'hybrid', 'cash'
  // Accepts modalItemId as prop
  const handleContinue = () => {
    // Use window.location to navigate, passing both type and item id
    window.location.href = `/trade?type=${offerType}&item=${window.__modalItemId || ''}`;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: offerType === 'item' ? 700 : 400 }}>
          <input type="radio" name="offerType" value="item" checked={offerType === 'item'} onChange={() => setOfferType('item')} style={{ accentColor: 'var(--accent)' }} />
          Item Swap
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: offerType === 'hybrid' ? 700 : 400 }}>
          <input type="radio" name="offerType" value="hybrid" checked={offerType === 'hybrid'} onChange={() => setOfferType('hybrid')} style={{ accentColor: 'var(--accent)' }} />
          Hybrid Swap (Item + Cash)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: offerType === 'cash' ? 700 : 400 }}>
          <input type="radio" name="offerType" value="cash" checked={offerType === 'cash'} onChange={() => setOfferType('cash')} style={{ accentColor: 'var(--accent)' }} />
          Cash Only
        </label>
      </div>
      <button
        onClick={handleContinue}
        style={{ marginTop: 10, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
      >
        Continue
      </button>
    </div>
  );
}

export default function Feed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [userState, setUserState] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [modalItem, setModalItem] = useState(null);
  const [modalImgIdx, setModalImgIdx] = useState(0);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    const fetchFeed = async () => {
      // Fetch all items except those owned by the current user
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;
      let userStateFetched = '';
      if (userId) {
        // Fetch user profile to get state
        const { data: userProfile } = await supabase
          .from('users')
          .select('state')
          .eq('id', userId)
          .single();
        userStateFetched = userProfile?.state || '';
        setUserState(userStateFetched);
        setLocation(userStateFetched); // default filter to user's state
      }
      let query = supabase
        .from('items')
        .select('*, owner:users(first_name, last_name, username, profile_image_base64, state)')
        .order('created_at', { ascending: false });
      if (userId) {
        query = query.neq('owner_id', userId);
      }
      const { data, error } = await query;
      setItems(data || []);
      setLoading(false);
    };
    fetchFeed();
  }, []);

  // Filter items by search and location
  const filteredItems = items.filter(item => {
    const matchesTitle = item.title?.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = !location || item.owner?.state === location;
    return matchesTitle && matchesLocation;
  });

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <>
      <div style={{ padding: 32 }}>
        {/* Search and location filter */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Search input with magnifying glass icon */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--surface1)', borderRadius: 8, border: '1px solid var(--border)', minWidth: 220, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', fontSize: 18, pointerEvents: 'none', display: 'flex', alignItems: 'center', height: '100%' }}>
              {/* Magnifying glass SVG */}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/><line x1="15.4142" y1="15" x2="19" y2="18.5858" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '10px 14px 10px 38px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 16,
                width: '100%',
                color: 'var(--text)',
                borderRadius: 8,
              }}
            />
          </div>
          {/* Custom themed dropdown for location filter */}
          <div ref={dropdownRef} style={{ position: 'relative', minWidth: 140, userSelect: 'none' }}>
            <div
              onClick={() => setDropdownOpen((open) => !open)}
              style={{
                display: 'flex', alignItems: 'center', background: 'var(--surface1)', borderRadius: 8, border: '1px solid var(--border)',
                padding: '10px 34px 10px 38px', fontSize: 16, color: 'var(--text)', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', fontSize: 18, display: 'flex', alignItems: 'center', height: '100%' }}>
                {/* Location marker SVG */}
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 19s7-7.58 7-12A7 7 0 1 0 3 7c0 4.42 7 12 7 12z" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
              </span>
              <span style={{ flex: 1, textAlign: 'left', color: location ? 'var(--text)' : 'var(--muted)' }}>
                {location ? location : 'All Locations'}
              </span>
              <span style={{ position: 'absolute', right: 12, color: 'var(--muted)', fontSize: 16, display: 'flex', alignItems: 'center', height: '100%' }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 1000, maxHeight: 260, overflowY: 'auto',
              }}>
                <div
                  onClick={() => { setLocation(''); setDropdownOpen(false); }}
                  style={{
                    padding: '10px 38px', cursor: 'pointer', color: !location ? 'var(--accent)' : 'var(--text)', background: 'var(--surface2)', backgroundColor: 'var(--surface2)', fontWeight: !location ? 700 : 400, borderBottom: '1px solid var(--border)',
                  }}
                  onMouseDown={e => e.preventDefault()}
                >
                  All Locations
                </div>
                {STATES.filter(Boolean).map(state => (
                  <div
                    key={state}
                    onClick={() => { setLocation(state); setDropdownOpen(false); }}
                    style={{
                      padding: '10px 38px', cursor: 'pointer', color: location === state ? 'var(--accent)' : 'var(--text)', background: 'var(--surface2)', backgroundColor: 'var(--surface2)', fontWeight: location === state ? 700 : 400, borderBottom: '1px solid var(--border)',
                    }}
                    onMouseDown={e => e.preventDefault()}
                  >
                    {state}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {filteredItems.length === 0 && <div>No items found.</div>}
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{ width: 260, background: 'var(--surface2)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', border: '1px solid var(--border)' }}
              onClick={() => { setModalItem(item); setModalImgIdx(0); }}
            >
              {/* Owner info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                {item.owner?.profile_image_base64 ? (
                  <img src={item.owner.profile_image_base64} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span role="img" aria-label="avatar" style={{ fontSize: 22 }}>👤</span>
                )}
                <span style={{ fontWeight: 700, fontSize: 15 }}>{item.owner?.first_name} {item.owner?.last_name}</span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{item.owner?.username ? '@' + item.owner.username : ''}</span>
                {item.owner?.state && <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>{item.owner.state}</span>}
              </div>
              {/* Item image */}
              {Array.isArray(item.photos) && item.photos.length > 0 ? (
                <img src={item.photos[0]} alt="item" style={{ width: '100%', height: 180, objectFit: 'cover', background: '#eee' }} />
              ) : (
                <div style={{ width: '100%', height: 180, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 32 }}>No Image</div>
              )}
              {/* Item title */}
              <div style={{ padding: '14px 16px', fontWeight: 700, fontSize: 18 }}>{item.title}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Modal for expanded item view */}
      {modalItem && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.32)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setModalItem(null)}
        >
          <div
            style={{
              background: 'var(--surface)', borderRadius: 18, padding: 0, minWidth: 600, maxWidth: 900, width: '95vw', boxShadow: '0 4px 32px rgba(0,0,0,0.13)', display: 'flex', flexDirection: 'row', gap: 0, fontFamily: 'var(--font-body)', position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button - now at modal top right, green like the plus */}
            <button
              onClick={() => setModalItem(null)}
              style={{
                position: 'absolute', top: 16, right: 18, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 22, cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              aria-label="Close"
              title="Close"
              onMouseOver={e => e.currentTarget.style.background = 'var(--accent-dark, #1db954)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--accent)'}
            >×</button>
            {/* Left column: images and details */}
            <div style={{ flex: 1.2, minWidth: 0, borderTopLeftRadius: 18, borderBottomLeftRadius: 18, background: 'var(--surface1)', display: 'flex', flexDirection: 'column' }}>
              {/* Image carousel */}
              <div style={{ position: 'relative', width: '100%', height: 260, background: '#eee', borderTopLeftRadius: 18, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Array.isArray(modalItem.photos) && modalItem.photos.length > 0 ? (
                  <img src={modalItem.photos[modalImgIdx]} alt="item" style={{ width: '100%', height: 260, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 40 }}>No Image</div>
                )}
                {/* Carousel controls */}
                {Array.isArray(modalItem.photos) && modalItem.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setModalImgIdx(idx => (idx - 1 + modalItem.photos.length) % modalItem.photos.length)}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.32)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', zIndex: 1 }}
                      aria-label="Previous image"
                    >&#8592;</button>
                    <button
                      onClick={() => setModalImgIdx(idx => (idx + 1) % modalItem.photos.length)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.32)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', zIndex: 1 }}
                      aria-label="Next image"
                    >&#8594;</button>
                    <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: 600, textShadow: '0 1px 4px #000', fontSize: 15 }}>
                      {modalImgIdx + 1} / {modalItem.photos.length}
                    </div>
                  </>
                )}
              </div>
              {/* Item details */}
              <div style={{ padding: '22px 24px 18px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>{modalItem.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 4 }}>{modalItem.category}</div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>{modalItem.description}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                  <b>Owner:</b> {modalItem.owner?.first_name} {modalItem.owner?.last_name} {modalItem.owner?.username && `(@${modalItem.owner.username})`}<br />
                  {modalItem.owner?.state && <><b>Location:</b> {modalItem.owner.state}<br /></>}
                  {modalItem.created_at && <><b>Posted:</b> {new Date(modalItem.created_at).toLocaleString()}<br /></>}
                  {modalItem.wants && <><b>Wants:</b> {modalItem.wants}<br /></>}
                </div>
              </div>
            </div>
            {/* Right column: Make an Offer */}
            <div style={{ flex: 1, minWidth: 0, borderTopRightRadius: 18, borderBottomRightRadius: 18, background: 'var(--surface2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px 28px 22px 28px', boxSizing: 'border-box', maxWidth: 340 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 18, color: 'var(--accent)' }}>Make an Offer</div>
                {/* Pass modalItem.id to OfferOptions via global for now */}
                {modalItem && (window.__modalItemId = modalItem.id)}
                <OfferOptions />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}