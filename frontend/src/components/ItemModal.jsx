import React, { useState, useEffect } from 'react';

const DEFAULT_EMOJI = '📦';
const DEFAULT_CATEGORY = '';

const ItemModal = ({ open, onClose, onSave, type = 'item', initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || DEFAULT_CATEGORY);
  // Remove emoji, add photos
  const [photos, setPhotos] = useState(initialData?.photos || []);
  const [wants, setWants] = useState(initialData?.wants || '');

  useEffect(() => {
    setTitle(initialData?.title || '');
    setDescription(initialData?.description || '');
    setCategory(initialData?.category || DEFAULT_CATEGORY);
    setPhotos(initialData?.photos || []);
    setWants(initialData?.wants || '');
  }, [initialData, open]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, description, category, photos, wants, type });
  };

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.25)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        className="item-modal"
        onSubmit={handleSubmit}
        style={{
          background: 'var(--surface)',
          borderRadius: 18,
          padding: '32px 28px',
          minWidth: 320,
          maxWidth: 380,
          width: '90vw',
          boxShadow: '0 4px 32px rgba(0,0,0,0.13)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, color: 'var(--accent)' }}>
          {type === 'wishlist' ? 'Add Wishlist Entry' : 'Add Item'}
        </div>
        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
          Title
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{
              width: '100%',
              marginTop: 4,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 15,
              background: 'var(--surface2)',
              color: 'var(--text)',
              marginBottom: 8,
            }}
          />
        </label>
        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
          Description
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 15,
              background: 'var(--surface2)',
              color: 'var(--text)',
              minHeight: 60,
              marginBottom: 8,
            }}
          />
        </label>
        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
          Category
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 15,
              background: 'var(--surface2)',
              color: 'var(--text)',
              marginBottom: 8,
            }}
          />
        </label>
        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
          Photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            style={{
              display: 'block',
              margin: '8px 0',
            }}
          />
        </label>
        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {photos.map((src, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={src} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                <button type="button" onClick={() => handleRemovePhoto(idx)} style={{ position: 'absolute', top: -8, right: -8, background: '#ff5c72', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 13, lineHeight: '20px', padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}
        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
          Wants (comma separated)
          <input
            value={wants}
            onChange={e => setWants(e.target.value)}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 15,
              background: 'var(--surface2)',
              color: 'var(--text)',
              marginBottom: 8,
            }}
          />
        </label>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button
            type="submit"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              transition: 'background .15s',
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 22px',
              fontWeight: 600,
              fontSize: 16,
              color: 'var(--text)',
              cursor: 'pointer',
              transition: 'border .15s',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemModal;
