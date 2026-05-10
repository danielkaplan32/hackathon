import React, { useState, useRef, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// sectionTitle: string (e.g. 'My Items' or 'My Wishlist')
export default function Items({ items, onAddItem, onUpdateItem, onDeleteItem, sectionTitle = 'My Items' }) {
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabRef = useRef();
  // Persist gallery modal state in sessionStorage
  const [galleryPhotos, setGalleryPhotosState] = useState(() => {
    const saved = sessionStorage.getItem('galleryPhotos');
    return saved ? JSON.parse(saved) : null;
  });

  const setGalleryPhotos = (photos) => {
    setGalleryPhotosState(photos);
    if (photos) {
      sessionStorage.setItem('galleryPhotos', JSON.stringify(photos));
    } else {
      sessionStorage.removeItem('galleryPhotos');
    }
  };

  // Close menu if clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (fabRef.current && !fabRef.current.contains(e.target)) {
        setFabMenuOpen(false);
      }
    }
    if (fabMenuOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [fabMenuOpen]);

  // Listen for sessionStorage changes (e.g., if another tab closes gallery)
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === 'galleryPhotos') {
        setGalleryPhotosState(e.newValue ? JSON.parse(e.newValue) : null);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="items-panel" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', gap: 24, alignSelf: 'stretch' }}>
      <div className="items-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: '0 0 8px 0', fontWeight: 500 }}>{sectionTitle}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="item-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface2)',
                  borderRadius: 14,
                  padding: '14px 20px',
                  width: '100%',
                  minWidth: 0,
                  flex: 1,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  gap: 18,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                  marginBottom: 2,
                  border: '1px solid var(--border)',
                  transition: 'box-shadow .18s',
                }}
              >
                {/* Show first photo thumbnail if exists */}
                {Array.isArray(item.photos) && item.photos.length > 0 && (
                  <img
                    src={item.photos[0]}
                    alt="item"
                    style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, marginRight: 18, cursor: 'pointer', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    onClick={() => setGalleryPhotos(item.photos)}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{item.title}</span>
                  {typeof item.value !== 'undefined' && item.value !== null && (
                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent)', marginTop: 2 }}>
                      ${item.value}
                    </span>
                  )}
                </div>
                <button
                  className="edit-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderRadius: 8,
                    padding: 6,
                    marginRight: 4,
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    transition: 'background .15s',
                  }}
                  onClick={() => onUpdateItem(item)}
                  title="Edit"
                >
                  <EditIcon style={{ fontSize: 22 }} />
                </button>
                <button
                  className="delete-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderRadius: 8,
                    padding: 6,
                    cursor: 'pointer',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    transition: 'background .15s',
                  }}
                  onClick={() => onDeleteItem(item.id)}
                  title="Delete"
                >
                  <DeleteIcon style={{ fontSize: 22 }} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text2)', padding: '16px 0', textAlign: 'center' }}>No items yet.</div>
          )}
        </div>
      </div>
      {/* Gallery modal for viewing all photos */}
      {galleryPhotos && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={() => setGalleryPhotos(null)}
        >
          <div style={{ display: 'flex', gap: 18, padding: 24, background: 'rgba(30,30,30,0.95)', borderRadius: 16 }} onClick={e => e.stopPropagation()}>
            {galleryPhotos.map((src, idx) => (
              <img key={idx} src={src} alt="gallery" style={{ maxWidth: 320, maxHeight: 320, borderRadius: 12, border: '2px solid var(--accent)', background: '#222' }} />
            ))}
          </div>
          <button onClick={() => setGalleryPhotos(null)} style={{ position: 'fixed', top: 32, right: 32, background: '#ff5c72', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 22, cursor: 'pointer', zIndex: 10000 }}>×</button>
        </div>
      )}
      {/* Floating Action Button with Menu (only show for My Items section) */}
      {sectionTitle === 'My Items' && (
        <div ref={fabRef} style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 300 }}>
          <button
            className="fab"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#00e676',
              color: '#fff',
              fontSize: 32,
              border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              zIndex: 200,
              position: 'relative',
            }}
            onClick={() => setFabMenuOpen((v) => !v)}
            aria-label="Add Item"
          >
            +
          </button>
          {fabMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 70,
                right: 0,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                padding: '8px 0',
                minWidth: 160,
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  padding: '12px 18px',
                  textAlign: 'left',
                  fontSize: 16,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background 0.15s',
                }}
                onClick={() => {
                  setFabMenuOpen(false);
                  onAddItem('item');
                }}
              >
                Add to My Items
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  padding: '12px 18px',
                  textAlign: 'left',
                  fontSize: 16,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background 0.15s',
                }}
                onClick={() => {
                  setFabMenuOpen(false);
                  onAddItem('wishlist');
                }}
              >
                Add to Wishlist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}