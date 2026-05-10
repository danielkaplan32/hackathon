import React, { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import Popper from '@mui/material/Popper';

const DEFAULT_EMOJI = '📦';
const DEFAULT_CATEGORY = '';

const CATEGORY_OPTIONS = [
  'Clothing',
  'Electronics',
  'Books',
  'Toys',
  'Home',
  'Sports',
  'Other',
];

// Custom styled MUI components for dark theme compatibility
const CustomAutocomplete = styled(Autocomplete)(({ theme }) => ({
  marginTop: '4px',
  marginBottom: '8px',
  background: 'var(--surface2)',
  borderRadius: '8px',
  '& .MuiOutlinedInput-root': {
    color: 'var(--text)',
    background: 'var(--surface2)',
    borderRadius: 8,
    '& .MuiAutocomplete-tag': {
      background: 'var(--accent)',
      color: '#fff',
    },
    '& fieldset': {
      borderColor: 'var(--border)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--accent)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--accent)',
    },
  },
  '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
    color: 'var(--text2)',
  },
  '& .MuiAutocomplete-listbox': {
    background: 'var(--surface) !important',
    color: 'var(--text) !important',
  },
  '& .MuiAutocomplete-option': {
    background: 'var(--surface) !important',
    color: 'var(--text) !important',
    '&[aria-selected="true"]': {
      background: 'var(--accentSoft) !important',
      color: 'var(--accent) !important',
    },
    '&.Mui-focused': {
      background: 'var(--accentSoft) !important',
      color: 'var(--accent) !important',
    },
  },
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    color: 'var(--text)',
    background: 'var(--surface2)',
    borderRadius: 8,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border)',
  },
  '& label': {
    color: 'var(--text2)',
  },
  '& label.Mui-focused': {
    color: 'var(--accent)',
  },
  '& .MuiInputBase-input': {
    color: 'var(--text)',
    background: 'var(--surface2)',
  },
}));

const WantsAutocomplete = styled(Autocomplete)(({ theme }) => ({
  marginTop: '4px',
  marginBottom: '8px',
  background: 'var(--surface2)',
  borderRadius: '8px',
  '& .MuiOutlinedInput-root': {
    color: 'var(--text)',
    background: 'var(--surface2)',
    borderRadius: 8,
    '& .MuiAutocomplete-tag': {
      background: 'var(--accent)',
      color: '#fff',
    },
    '& fieldset': {
      borderColor: 'var(--border)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--accent)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--accent)',
    },
  },
  '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
    color: 'var(--text2)',
  },
  '& .MuiAutocomplete-listbox': {
    background: 'var(--surface) !important',
    color: 'var(--text) !important',
  },
  '& .MuiAutocomplete-option': {
    background: 'var(--surface) !important',
    color: 'var(--text) !important',
    '&[aria-selected="true"]': {
      background: 'var(--accentSoft) !important',
      color: 'var(--accent) !important',
    },
    '&.Mui-focused': {
      background: 'var(--accentSoft) !important',
      color: 'var(--accent) !important',
    },
  },
}));

const ItemModal = ({ open, onClose, onSave, type = 'item', initialData, wishlistOptions = [] }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [value, setValue] = useState(type === 'item' ? (initialData?.value ?? '') : '');
  const [description, setDescription] = useState(initialData?.description || '');
  function parseCategory(val) {
    let arr = [];
    if (Array.isArray(val)) arr = val;
    else if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) arr = parsed;
        else if (val) arr = [val];
      } catch {
        if (val) arr = [val];
      }
    }
    // Only allow valid options, no duplicates
    arr = arr.filter((v, i, self) => CATEGORY_OPTIONS.includes(v) && self.indexOf(v) === i);
    return arr;
  }
  const [category, setCategory] = useState(parseCategory(initialData?.category));
  // Remove emoji, add photos
  const [photos, setPhotos] = useState(initialData?.photos || []);
  function parseWants(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
    return [];
  }
  const [wants, setWants] = useState(parseWants(initialData?.wants));

  useEffect(() => {
    setTitle(initialData?.title || '');
    setValue(type === 'item' ? (initialData?.value ?? '') : '');
    setDescription(initialData?.description || '');
    setCategory(parseCategory(initialData?.category));
    setPhotos(initialData?.photos || []);
    setWants(parseWants(initialData?.wants));
  }, [initialData, open, type]);

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
    // Always save as array
    if (type === 'item') {
      onSave({ title, value: value === '' ? null : Number(value), description, category: [...category], photos, wants, type });
    } else {
      onSave({ title, description, category: [...category], photos, wants, type });
    }
  };

  // Auto Tag state and handler
  const [isAutoTagging, setIsAutoTagging] = useState(false);


  // Gemini Vision API for image+text tagging
  async function geminiVisionTag({ base64Image, prompt }) {
    const apiKey = "AIzaSyD1kRB6sJ8e8AI-u90DbBkZ5W3QVksEzTA";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/png", data: base64Image } },
            { text: prompt }
          ]
        }
      ]
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Gemini API error");
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async function handleAutoTag() {
    if (photos.length === 0 || isAutoTagging) return;
    setIsAutoTagging(true);
    try {
      const img = photos[0];
      const base64 = img.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      const prompt =
        "Given the following image, return ONLY a valid JSON object (no extra text, no markdown, no explanations) with these keys: title, value (USD numeric your best estimate must include), description, categories. Example format: {\"title\": \"...\", \"value\": 0, \"description\": \"...\", \"categories\": [\"...\"]}. Do not include any other text.";
      let response = await geminiVisionTag({ base64Image: base64, prompt });
      // Strip markdown/code block wrappers if present
      response = response.trim();
      if (response.startsWith('```json')) {
        response = response.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (response.startsWith('```')) {
        response = response.replace(/^```/, '').replace(/```$/, '').trim();
      }
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch {
        parsed = null;
      }
      if (parsed) {
        if (parsed.title) setTitle(parsed.title);
        if (parsed.value) setValue(parsed.value);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.categories) setCategory(Array.isArray(parsed.categories) ? parsed.categories : [parsed.categories]);
      } else {
        setTitle(response);
      }
    } catch (err) {
      alert('Auto Tag failed: ' + err.message);
    } finally {
      setIsAutoTagging(false);
    }
  }

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
        paddingTop: 24,
        paddingBottom: 24,
        boxSizing: 'border-box',
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
          maxWidth: 700,
          width: '96vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 32px rgba(0,0,0,0.13)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          fontFamily: 'var(--font-body)',
          /* Custom scrollbar styling */
          scrollbarColor: 'var(--accent) var(--surface2)',
          scrollbarWidth: 'thin',
        }}
      >
        <style>{`
          .item-modal::-webkit-scrollbar {
            width: 8px;
            background: var(--surface2);
          }
          .item-modal::-webkit-scrollbar-thumb {
            background: var(--accent);
            border-radius: 8px;
          }
          .item-modal::-webkit-scrollbar-thumb:hover {
            background: var(--accentSoft);
          }
        `}</style>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, color: 'var(--accent)' }}>
          {type === 'wishlist' ? 'Add Wishlist Entry' : 'Add Item'}
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 2 }}>
          <label style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>
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
          {type === 'item' && (
            <label style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>
              Value ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="0.00"
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
          )}
        </div>
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
        <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, position: 'relative' }}>
          Category
          <CustomAutocomplete
            multiple
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(_, newValue) => setCategory(newValue)}
            renderInput={(params) => (
              <CustomTextField
                {...params}
                variant="outlined"
                label="Select categories"
                placeholder={category.length === 0 ? "Categories" : ""}
              />
            )}
            PopperComponent={CustomPopper}
          />
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 2 }}>
          <label style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>
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
          <button
            type="button"
            onClick={handleAutoTag}
            disabled={photos.length === 0 || isAutoTagging}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: 15,
              cursor: photos.length === 0 || isAutoTagging ? 'not-allowed' : 'pointer',
              opacity: photos.length === 0 || isAutoTagging ? 0.6 : 1,
              marginBottom: 8,
              minWidth: 100,
              transition: 'background .15s',
            }}
          >
            {isAutoTagging ? 'Tagging...' : 'Auto Tag'}
          </button>
        </div>
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
        {type !== 'wishlist' && (
          <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
            Wants (from wishlist)
            <WantsAutocomplete
              multiple
              options={wishlistOptions}
              value={wants}
              onChange={(_, newValue) => setWants(newValue)}
              renderInput={(params) => (
                <CustomTextField
                  {...params}
                  variant="outlined"
                  label="Select wants"
                  placeholder={wants.length === 0 ? "Wants" : ""}
                />
              )}
              PopperComponent={CustomPopper}
            />
          </label>
        )}
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

function CustomPopper(props) {
  return <Popper {...props} style={{ ...props.style, zIndex: 1300 }} placement={props.placement} modifiers={props.modifiers} popperRef={props.popperRef}>
    <div style={{ background: 'var(--surface)', color: 'var(--text)' }}>{props.children}</div>
  </Popper>;
}

export default ItemModal;