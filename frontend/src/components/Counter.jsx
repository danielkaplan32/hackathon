
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Counter() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [myInventory, setMyInventory] = useState([]); // all items owned by me (the counter user)
  const [theirInventory, setTheirInventory] = useState([]); // all items owned by the original sender
  const [selectedMyItems, setSelectedMyItems] = useState([]); // items I'm offering (original item_ids)
  const [selectedTheirItems, setSelectedTheirItems] = useState([]); // items I'm requesting (original offered_item_ids)
  const [offerType, setOfferType] = useState('item');
  const [cashAmount, setCashAmount] = useState('');
  const [myMainItem, setMyMainItem] = useState(null); // main item from my offer (original item_ids)
  const [theirMainItem, setTheirMainItem] = useState(null); // main item from their offer (original offered_item_ids)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTradeAndInventories() {
      setLoading(true);
      const { data: tradeData, error } = await supabase.from('trades').select('*').eq('id', tradeId).single();
      if (error) { setError(error.message); setLoading(false); return; }
      setTrade(tradeData);
      setOfferType(tradeData.offer_type || 'item');
      setCashAmount(tradeData.cash_amount ? String(tradeData.cash_amount) : '');
      setSelectedMyItems(tradeData.item_ids || []); // items I'm offering (original item_ids)
      setSelectedTheirItems(tradeData.offered_item_ids || []); // items I'm requesting (original offered_item_ids)

      // Fetch my main item (first in item_ids)
      let myMainItemData = null;
      if (tradeData.item_ids && tradeData.item_ids.length > 0) {
        const { data } = await supabase.from('items').select('*').eq('id', tradeData.item_ids[0]).single();
        myMainItemData = data;
        setMyMainItem(data);
      }
      // Fetch their main item (first in offered_item_ids)
      let theirMainItemData = null;
      if (tradeData.offered_item_ids && tradeData.offered_item_ids.length > 0) {
        const { data } = await supabase.from('items').select('*').eq('id', tradeData.offered_item_ids[0]).single();
        theirMainItemData = data;
        setTheirMainItem(data);
      }
      // Fetch my inventory (all items by me, the counter user)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('items').select('*').eq('owner_id', session.user.id);
        setMyInventory(data ? data.map(i => ({ ...i, id: String(i.id) })) : []);
      }
      // Fetch their inventory (all items by the original sender)
      if (theirMainItemData?.owner_id) {
        const { data } = await supabase.from('items').select('*').eq('owner_id', theirMainItemData.owner_id);
        setTheirInventory(data ? data.map(i => ({ ...i, id: String(i.id) })) : []);
      }
      setLoading(false);
    }
    fetchTradeAndInventories();
  }, [tradeId]);

  if (loading) return <div style={{padding:32}}>Loading...</div>;
  if (error) return <div style={{padding:32, color:'red'}}>Error: {error}</div>;
  if (!trade) return <div style={{padding:32}}>Trade not found.</div>;

  // Exclude the main selected item from each inventory grid (always exclude the item that matches myMainItem?.id)
  const myMainItemId = myMainItem?.id;
  const myInventoryWithoutSelected = myInventory.filter(i => i.id !== myMainItemId);
  const theirMainItemId = selectedTheirItems[0];
  const theirInventoryWithoutSelected = theirInventory.filter(i => i.id !== theirMainItemId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)', fontFamily: 'var(--font-body)' }}>
      {/* Left: Their Item (your item) and inventory */}
      <div style={{ flex: 1, borderRight: '1px solid var(--border)', padding: 32, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: 'var(--accent)' }}>Your Item</div>
        {myMainItem && (
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
            {Array.isArray(myMainItem.photos) && myMainItem.photos.length > 0 ? (
              <img src={myMainItem.photos[0]} alt={myMainItem.title} style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
            ) : (
              <div style={{ width: 180, height: 180, background: '#eee', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 40 }}>?</div>
            )}
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>{myMainItem.title}</div>
            <div style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 4 }}>{myMainItem.category}</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>{myMainItem.description}</div>
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 12, color: 'var(--accent)' }}>Your Other Items</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          {myInventory.filter(i => i.id !== myMainItemId).map(i => {
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
                <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', wordBreak: 'break-word' }}>{i.title}</div>
              </div>
            );
          })}
        </div>
        {/* Counter button at the bottom of the left column */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '14px 38px',
              fontWeight: 800,
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
            onClick={async () => {
              if (!trade) return;
              // Delete the original trade
              const { error: delError } = await supabase.from('trades').delete().eq('id', trade.id);
              if (delError) {
                alert('Failed to delete original trade: ' + delError.message);
                return;
              }
              // Get current user
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user?.id) {
                alert('Not logged in');
                return;
              }
              // Compose new trade (counter-offer)
              const newTrade = {
                from_user_id: session.user.id, // the countering user
                to_user_id: trade.from_user_id, // original sender now receives the counter
                item_ids: selectedMyItems, // your items (now being offered)
                offered_item_ids: selectedTheirItems, // their items (now being requested)
                offer_type: offerType,
                cash_amount: offerType !== 'item' ? Number(cashAmount) || 0 : 0,
                status: 'pending',
                created_at: new Date().toISOString(),
              };
              const { error: insError } = await supabase.from('trades').insert([newTrade]);
              if (insError) {
                alert('Failed to send counter-offer: ' + insError.message);
                return;
              }
              navigate('/requests');
            }}
          >Counter</button>
        </div>
      </div>
      {/* Right: Your Offer (other person's items/inventory) */}
      <div style={{ flex: 1, padding: 32, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: 'var(--accent)' }}>Their Offer</div>
        {/* Offer type selection buttons, as in Trade.jsx */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <button
            style={{
              background: offerType === 'item' ? 'var(--accent)' : 'var(--surface2)',
              color: offerType === 'item' ? '#fff' : 'var(--accent)',
              border: '1.5px solid var(--accent)',
              borderRadius: 8,
              padding: '8px 22px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s',
            }}
            onClick={() => { setOfferType('item'); setCashAmount(''); }}
          >Trade</button>
          <button
            style={{
              background: offerType === 'cash' ? 'var(--accent)' : 'var(--surface2)',
              color: offerType === 'cash' ? '#fff' : 'var(--accent)',
              border: '1.5px solid var(--accent)',
              borderRadius: 8,
              padding: '8px 22px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s',
            }}
            onClick={() => { setOfferType('cash'); setSelectedMyItems([]); }}
          >Cash</button>
          <button
            style={{
              background: offerType === 'hybrid' ? 'var(--accent)' : 'var(--surface2)',
              color: offerType === 'hybrid' ? '#fff' : 'var(--accent)',
              border: '1.5px solid var(--accent)',
              borderRadius: 8,
              padding: '8px 22px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s',
            }}
            onClick={() => setOfferType('hybrid')}
          >Hybrid</button>
        </div>
        {/* Removed redundant offer type/cash display below buttons */}
        {/* Show cash input if needed */}
        {offerType === 'cash' || offerType === 'hybrid' ? (
          <div style={{ marginBottom: 16 }}>
            <input
              type="number"
              min="0"
              value={cashAmount}
              onChange={e => setCashAmount(e.target.value)}
              placeholder="$"
              style={{ fontSize: 16, padding: 8, borderRadius: 6, border: '1px solid var(--border)', width: 120 }}
            />
          </div>
        ) : null}
        {/* No main card on right side; just 'Your Other Items' with original trade items highlighted, and cash field if needed */}
        {offerType !== 'cash' && (
          <>
            <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 12, color: 'var(--accent)' }}>Your Other Items</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
              {theirInventory.map(i => {
                // Highlight items that were in the original trade (selectedTheirItems)
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
                    <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', wordBreak: 'break-word' }}>{i.title}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
