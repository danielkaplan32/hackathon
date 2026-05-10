  // Sign out and redirect to Auth screen
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // reload to show AuthScreen
  };
import React, { useState, useEffect } from 'react';
import SwitcharooLogo from '../assets/switcharoo-icon.svg';
import { useLocation } from 'react-router-dom';
import Items from './Items';
import ItemModal from './ItemModal';
import Feed from './Feed';
import Requests from './Requests';
import MessagesList from './MessagesList';
import { supabase } from '../supabaseClient';
import ProfileScreen from './ProfileScreen';

const FeedIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 9h6v6H9z"/></svg>
);
const ItemsIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
);
const RequestsIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1v8h8"/><path d="M3 11V3h8"/><path d="M21 13v8h-8"/><path d="M7 23v-8H-1"/><polyline points="17 1 23 1 23 7"/><polyline points="3 11 3 3 11 3"/><polyline points="21 13 21 21 13 21"/><polyline points="7 23 1 23 1 17"/></svg>
);
const MessagesIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const ProfileIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"/></svg>
);
const NAV_OPTIONS = [
  { key: 'feed', label: 'Feed', icon: FeedIcon },
  { key: 'items', label: 'My Items', icon: ItemsIcon },
  { key: 'requests', label: 'Requests', icon: RequestsIcon },
  { key: 'messages', label: 'Messages', icon: MessagesIcon },
  { key: 'profile', label: 'Profile', icon: ProfileIcon },
];

const MainApp = ({ openTradeModal }) => {
  const location = useLocation();
  const getPanelFromPath = (pathname) => {
    if (pathname === '/items') return 'items';
    if (pathname === '/feed') return 'feed';
    if (pathname === '/requests') return 'requests';
    if (pathname === '/messages') return 'messages';
    if (pathname === '/profile') return 'profile';
    return localStorage.getItem('activePanel') || 'feed';
  };
  const [activePanel, setActivePanel] = useState(() => getPanelFromPath(window.location.pathname));

  // Sync panel with URL changes
  useEffect(() => {
    setActivePanel(getPanelFromPath(location.pathname));
  }, [location.pathname]);

  // Persist activePanel in localStorage
  const handlePanelChange = (panel) => {
    setActivePanel(panel);
    localStorage.setItem('activePanel', panel);
    if (panel === 'items') {
      window.history.pushState({}, '', '/items');
    } else if (panel === 'feed') {
      window.history.pushState({}, '', '/feed');
    } else if (panel === 'requests') {
      window.history.pushState({}, '', '/requests');
    } else if (panel === 'messages') {
      window.history.pushState({}, '', '/messages');
    } else if (panel === 'profile') {
      window.history.pushState({}, '', '/profile');
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    profile_image_base64: '',
    username: '',
  });
  // Items and wishlist state
  const [myItems, setMyItems] = useState([]);
  const [myWishlist, setMyWishlist] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('item'); // 'item' or 'wishlist'
  const [editItem, setEditItem] = useState(null);

  // Fetch items and wishlist for the user
  const fetchData = async (theUser) => {
    if (!theUser) return;
    // Fetch my items
    const { data: myItemsData } = await supabase
      .from('items')
      .select('*')
      .eq('owner_id', theUser.id)
      .order('created_at', { ascending: false });
    setMyItems(myItemsData || []);

    // Fetch my wishlist (wishlists table, same structure as items)
    const { data: myWishlistData } = await supabase
      .from('wishlists')
      .select('*')
      .eq('owner_id', theUser.id)
      .order('created_at', { ascending: false });
    setMyWishlist(myWishlistData || []);
  };

  useEffect(() => {
    fetchData(user);
  }, [user]);

  // Refetch user and data on window focus
  useEffect(() => {
    const handleFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchData(session.user);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Add or update item or wishlist
  const handleSaveItem = async (itemData) => {
    if (!user) return;
    const { title, description, category, photos, wants, type } = itemData;
    if (addType === 'wishlist') {
      // Add to wishlist (wishlists table)
      if (editItem) {
        await supabase.from('wishlists').update({
          title,
          description,
          category,
          photos,
          wants,
          status: 'wanted',
        }).eq('id', editItem.id);
      } else {
        await supabase.from('wishlists').insert([
          {
            owner_id: user.id,
            title,
            description,
            category,
            photos,
            wants,
            status: 'wanted',
          },
        ]);
      }
      // Refresh wishlist
      const { data: wishlistData } = await supabase
        .from('wishlists')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      setMyWishlist(wishlistData || []);
    } else {
      // Add or update item (items table)
      if (editItem) {
        await supabase.from('items').update({
          title,
          description,
          category,
          photos,
          wants,
        }).eq('id', editItem.id);
      } else {
        await supabase.from('items').insert([
          {
            owner_id: user.id,
            title,
            description,
            category,
            photos,
            wants,
            status: 'available',
          },
        ]);
      }
      // Refresh items
      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      setMyItems(itemsData || []);
    }
    setShowAddModal(false);
    setEditItem(null);
  };

  // Edit item: open modal prefilled
  const handleUpdateItem = (item) => {
    setEditItem(item);
    setAddType('item');
    setShowAddModal(true);
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!user) return;
    await supabase.from('items').delete().eq('id', itemId);
    // Refresh items
    const { data: itemsData } = await supabase
      .from('items')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setMyItems(itemsData || []);
  };

  // Add item (open modal)
  function handleAddItem(type = 'item') {
    setAddType(type);
    setEditItem(null);
    setShowAddModal(true);
  }

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUser(session.user);
      // Fetch profile
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          profile_image_base64: data.profile_image_base64 || '',
          username: data.username || '',
        });
      }
    };
    fetchUser();
  }, []);

  // Hamburger for mobile
  const handleHamburger = () => setSidebarOpen(o => !o);

  return (
    <div className="screen active" id="screen-app" role="main" aria-label="Main Application">
      {/* Collapse/Expand Arrow Icon */}
      {/* Sidebar toggle button inside sidebar, top right */}
      {sidebarOpen && (
        <button
          className="sidebar-toggle"
          aria-label="Collapse sidebar"
          style={{
            position: 'fixed',
            top: 18,
            left: (window.innerWidth > 900
              ? (sidebarOpen ? (window.innerWidth > 900 ? 320 : 320) - 56 : 0)
              : (sidebarOpen ? 0 : 0)) + 'px',
            zIndex: 201,
            background: 'var(--surface)',
            border: 'none',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            fontSize: 24,
            color: 'var(--text)',
            minWidth: 40,
            minHeight: 40,
          }}
          onClick={handleHamburger}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      {!sidebarOpen && (
        <button
          className="sidebar-toggle"
          aria-label="Expand sidebar"
          style={{
            position: 'fixed',
            top: 18,
            left: 18,
            zIndex: 201,
            background: 'var(--surface)',
            border: 'none',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            fontSize: 24,
            color: 'var(--text)',
            minWidth: 40,
            minHeight: 40,
          }}
          onClick={handleHamburger}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
      {/* Overlay for sidebar on mobile */}
      {sidebarOpen && window.innerWidth <= 900 && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            zIndex: 99,
          }}
        />
      )}
      <div
        className="app-shell"
        style={{
          display: 'flex',
          minHeight: '100vh',
          position: 'relative',
          paddingTop: window.innerWidth <= 900 ? 70 : 0, // Add space for hamburger on mobile
        }}
      >
        <aside
          className="sidebar"
          role="navigation"
          aria-label="Main Navigation"
          style={{
            minWidth: sidebarOpen ? (window.innerWidth > 900 ? 270 : 320) : 0,
            maxWidth: window.innerWidth > 900 ? 320 : '98vw',
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            display: sidebarOpen ? 'flex' : 'none',
            flexDirection: 'column',
            position: window.innerWidth > 900 ? 'relative' : 'fixed',
            left: 0,
            top: window.innerWidth <= 900 ? 70 : 0, // Push sidebar below hamburger on mobile
            height: window.innerWidth > 900 ? '100vh' : 'calc(100vh - 70px)',
            zIndex: 120,
            boxShadow: window.innerWidth > 900 ? 'none' : '2px 0 16px rgba(0,0,0,0.12)',
            transition: 'min-width 0.2s',
            alignItems: 'flex-start',
            overflowY: 'auto',
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="sidebar-logo" aria-label="Switcharoo Logo" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, margin: '0 0 32px 32px', color: '#fff', letterSpacing: -1, display: 'block', minWidth: 0, lineHeight: 1.1, whiteSpace: 'normal', overflow: 'visible' }}>
              <span style={{ color: '#fff', minWidth: 0, fontSize: 36, display: 'block', whiteSpace: 'nowrap' }}>Switch</span>
              <span style={{ color: 'var(--accent)', fontSize: 36, display: 'block', whiteSpace: 'nowrap' }}>aroo</span>
            </div>
            {NAV_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={"nav-item" + (activePanel === opt.key ? ' active' : '')}
                aria-current={activePanel === opt.key ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  color: activePanel === opt.key ? 'var(--accent)' : 'var(--text)',
                  fontWeight: activePanel === opt.key ? 700 : 500,
                  fontSize: 16,
                  padding: '12px 18px',
                  borderRadius: 10,
                  marginBottom: 4,
                  cursor: 'pointer',
                  transition: 'background .15s',
                  backgroundColor: activePanel === opt.key ? 'var(--accent-dim)' : 'transparent',
                }}
                onClick={() => handlePanelChange(opt.key)}
              >
                <span className="nav-icon" style={{ fontSize: 20 }}>{opt.icon}</span>
                {opt.label}
                {/* No fake badges for requests or messages */}
              </button>
            ))}
            <div className="sidebar-spacer" style={{ flex: 1 }}></div>
            {/* Sign Out button above avatar */}
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'var(--danger, #e74c3c)',
                fontWeight: 600,
                fontSize: 15,
                padding: '12px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                marginBottom: 0,
              }}
              aria-label="Sign out"
            >
              Sign Out
            </button>
            <div
              className="sidebar-user"
              tabIndex={0}
              aria-label="User Profile"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 18, borderTop: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => handlePanelChange('profile')}
            >
              <div className="sidebar-avatar" id="sidebar-av" style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0e0e0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {profile.profile_image_base64 ? (
                  <img src={profile.profile_image_base64} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span role="img" aria-label="avatar">👤</span>
                )}
              </div>
              <div>
                <div className="sidebar-username" id="sidebar-name" style={{ fontWeight: 700, fontSize: 15 }}>{profile.first_name} {profile.last_name}</div>
                <div className="sidebar-handle" id="sidebar-handle" style={{ color: 'var(--muted)', fontSize: 13 }}>{profile.username ? '@' + profile.username : ''}</div>
              </div>
            </div>
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 24, marginBottom: 0, paddingBottom: 0 }}>
              DUHackathon Team
            </div>
          </div>
        </aside>
        {/* Main content area */}
        <main
          className="app-shell"
          style={{
            display: 'flex',
            minHeight: '100vh',
            position: 'relative',
            paddingTop: window.innerWidth <= 900 ? 70 : 0,
            background: 'var(--surface2)',
            width: '100%',
            boxSizing: 'border-box',
            paddingTop: window.innerWidth <= 900 ? 30 : 0, // Extra space for hamburger
            transition: 'margin-left 0.2s',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {activePanel === 'feed' && (
            <Feed />
          )}
          {activePanel === 'items' && (
            <>
              <div style={{ width: '100%', flex: 1, alignSelf: 'stretch', padding: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div>
                  <Items
                    items={myItems}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    sectionTitle="My Items"
                  />
                </div>
                <div>
                  <Items
                    items={myWishlist}
                    onAddItem={handleAddItem}
                    onUpdateItem={(item) => {
                      setEditItem(item);
                      setAddType('wishlist');
                      setShowAddModal(true);
                    }}
                    onDeleteItem={async (itemId) => {
                      await supabase.from('wishlists').delete().eq('id', itemId);
                      const { data: wishlistData } = await supabase
                        .from('wishlists')
                        .select('*')
                        .eq('owner_id', user.id)
                        .order('created_at', { ascending: false });
                      setMyWishlist(wishlistData || []);
                    }}
                    sectionTitle="My Wishlist"
                  />
                </div>
              </div>
              <ItemModal
                open={showAddModal}
                onClose={() => { setShowAddModal(false); setEditItem(null); }}
                onSave={handleSaveItem}
                type={addType}
                initialData={editItem}
              />
            </>
          )}
          {activePanel === 'requests' && (
            <Requests />
          )}
          {activePanel === 'messages' && (
            <MessagesList />
          )}
          {activePanel === 'profile' && (
            <ProfileScreen />
          )}
        </main>
      </div>
    </div>
  );
};

export default MainApp;