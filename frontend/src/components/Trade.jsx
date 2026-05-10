import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Trade() {
  const query = useQuery();
  const navigate = useNavigate();
  const offerType = query.get('type') || 'item';
  const theirItemId = query.get('item') ? String(query.get('item')) : '';
  const [theirItem, setTheirItem] = useState(null);
  const [theirInventory, setTheirInventory] = useState([]);
  const [selectedTheirItems, setSelectedTheirItems] = useState([]); // array of selected their item ids
  const [myItems, setMyItems] = useState([]);
  const [selectedMyItems, setSelectedMyItems] = useState([]); // array of selected item ids
  const [cashAmount, setCashAmount] = useState('');
  const [loading, setLoading] = useState(true);
    const [carouselIdx, setCarouselIdx] = useState(0);

  // Fetch their item and inventories
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch their item
      let theirItemData = null;
      if (theirItemId) {
        const { data, error } = await supabase.from('items').select('*').eq('id', theirItemId).single();
        theirItemData = data;
        setTheirItem(data);
        if (!data) {
          console.warn('No item found for id', theirItemId, error);
        }
      }
      // Fetch their inventory (other items by same owner)
      if (theirItemData?.owner_id) {
        const { data } = await supabase.from('items').select('*').eq('owner_id', theirItemData.owner_id);
        setTheirInventory(data ? data.map(i => ({ ...i, id: String(i.id) })) : []);
      }
      // Fetch my items
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('items').select('*').eq('owner_id', session.user.id);
        setMyItems(data ? data.map(i => ({ ...i, id: String(i.id) })) : []);
      }
      setLoading(false);
    }
    fetchData();
  }, [theirItemId]);

  // UI for left/right columns
  // Exclude the selected item from the inventory grid below
  const theirInventoryWithoutSelected = theirInventory.filter(i => i.id !== theirItemId);
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)', fontFamily: 'var(--font-body)' }}>
      {/* Left: Their item and inventory */}
      <div style={{ flex: 1, borderRight: '1px solid var(--border)', padding: 32, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: 'var(--accent)' }}>Their Item</div>
        {/* Selected item at top, big */}
        {theirItem && (
          <div style={{
            background: 'var(--surface2)',
            borderRadius: 14,
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            padding: 18,
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 340,
            marginLeft: 'auto',
            marginRight: 'auto',
            border: '2px solid var(--accent)'
          }}>
            {Array.isArray(theirItem.photos) && theirItem.photos.length > 0 ? (
              <img src={theirItem.photos[0]} alt={theirItem.title} style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
            ) : (
              <div style={{ width: 180, height: 180, background: '#eee', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 40 }}>?</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: 22, marginBottom: 4, width: '100%', justifyContent: 'space-between' }}>
              <span>{theirItem.title}</span>
              {typeof theirItem.value !== 'undefined' && theirItem.value !== null && (
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)', marginLeft: 8 }}>${theirItem.value}</span>
              )}
            </div>
            {Array.isArray(theirItem.category) && theirItem.category.length > 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 4 }}>{theirItem.category.join(', ')}</div>
            )}
            <div style={{ fontSize: 16, marginBottom: 8 }}>{theirItem.description}</div>
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 12, color: 'var(--accent)' }}>Their Other Items</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          {theirInventoryWithoutSelected.map(i => {
            const selected = selectedTheirItems.includes(i.id);
            return (
              <div
                key={i.id}
                onClick={() => {
                  setSelectedTheirItems(prev =>
                    selected ? prev.filter(id => id !== i.id) : [...prev, i.id]
                  );
                }}
                style={{
                  border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 10,
                  background: selected ? 'var(--surface1)' : 'var(--surface2)',
                  cursor: 'pointer',
                  minWidth: 110,
                  maxWidth: 140,
                  position: 'relative',
                  boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  marginBottom: 8
                }}
              >
                {selected && (
                  <span style={{
                    position: 'absolute', top: 6, left: 6, background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, zIndex: 2
                  }}>✓</span>
                )}
                {Array.isArray(i.photos) && i.photos.length > 0 ? (
                  <img src={i.photos[0]} alt={i.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />
                ) : (
                  <div style={{ width: 60, height: 60, background: '#eee', borderRadius: 8, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 22 }}>?</div>
                )}
                <div style={{ position: 'relative', width: '100%', minHeight: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', wordBreak: 'break-word', display: 'block' }}>{i.title}</span>
                  {typeof i.value !== 'undefined' && i.value !== null && (
                    <span style={{ position: 'absolute', right: 0, bottom: 0, fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>${i.value}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Right: My offer */}
      <div style={{ flex: 1, padding: 32, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: 'var(--accent)' }}>Your Offer</div>
        {(offerType === 'item' || offerType === 'hybrid') && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Choose one of your items</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
              {myItems.map(i => {
                const selected = selectedMyItems.includes(i.id);
                return (
                  <div
                    key={i.id}
                    onClick={() => {
                      setSelectedMyItems(prev =>
                        selected ? prev.filter(id => id !== i.id) : [...prev, i.id]
                      );
                    }}
                    style={{
                      border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 10,
                      background: selected ? 'var(--surface1)' : 'var(--surface2)',
                      cursor: 'pointer',
                      minWidth: 110,
                      maxWidth: 140,
                      position: 'relative',
                      boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}
                  >
                    {selected && (
                      <span style={{
                        position: 'absolute', top: 6, left: 6, background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, zIndex: 2
                      }}>✓</span>
                    )}
                    {Array.isArray(i.photos) && i.photos.length > 0 ? (
                      <img src={i.photos[0]} alt={i.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />
                    ) : (
                      <div style={{ width: 60, height: 60, background: '#eee', borderRadius: 8, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 22 }}>?</div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', wordBreak: 'break-word' }}>{i.title}</div>
                  </div>
                );
              })}
            </div>
            {offerType === 'hybrid' && (
              <>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Plus Cash Amount</div>
                <input type="number" min="0" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="$" style={{ fontSize: 16, padding: 8, borderRadius: 6, border: '1px solid var(--border)', width: 120, marginBottom: 18 }} />
              </>
            )}
          </>
        )}
        {offerType === 'cash' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Cash Offer</div>
            <input type="number" min="0" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="$" style={{ fontSize: 16, padding: 8, borderRadius: 6, border: '1px solid var(--border)', width: 120, marginBottom: 18 }} />
          </>
        )}
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Your Other Items</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          {myItems.filter(i => !selectedMyItems.includes(i.id)).map(i => (
            <div key={i.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: 10, minWidth: 90, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {Array.isArray(i.photos) && i.photos.length > 0 ? (
                <img src={i.photos[0]} alt={i.title} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, marginBottom: 4 }} />
              ) : (
                <div style={{ width: 36, height: 36, background: '#eee', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 15 }}>?</div>
              )}
              <div style={{ position: 'relative', width: '100%', minHeight: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 13, textAlign: 'center', wordBreak: 'break-word', display: 'block' }}>{i.title}</span>
                {typeof i.value !== 'undefined' && i.value !== null && (
                  <span style={{ position: 'absolute', right: 0, bottom: 0, fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>${i.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', width: 180 }}
          onClick={async () => {
            if (!theirItem || (!selectedMyItems.length && offerType !== 'cash')) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return;
            const toUser = theirItem.owner_id;
            const fromUser = session.user.id;
            // Compose arrays for multi-item support
            // Always include the selected item at top, plus any additional selected items from their inventory
            const itemIds = [theirItem.id, ...selectedTheirItems.filter(id => id !== theirItem.id)];
            const offeredItemIds = offerType !== 'cash' ? selectedMyItems : [];
            // Insert trade (use 'trades' table, not 'requests')
            const { error } = await supabase.from('trades').insert([
              {
                from_user_id: fromUser,
                to_user_id: toUser,
                item_ids: itemIds,
                offered_item_ids: offeredItemIds,
                offer_type: offerType,
                cash_amount: offerType !== 'item' ? Number(cashAmount) || 0 : 0,
                status: 'pending',
                created_at: new Date().toISOString(),
              }
            ]);
            if (!error) {
              navigate('/requests');
            } else {
              alert('Failed to send offer.');
            }
          }}
        >Send Offer</button>
      </div>
    </div>
  );
}
