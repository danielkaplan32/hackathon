import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Requests() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    async function fetchTradesAndItems() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      let { data: incomingTrades } = await supabase
        .from('trades')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false });
      let { data: outgoingTrades } = await supabase
        .from('trades')
        .select('*')
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false });

      const allItemIds = new Set();
      [...(incomingTrades||[]), ...(outgoingTrades||[])].forEach(trade => {
        (trade.item_ids||[]).forEach(id => allItemIds.add(id));
        (trade.offered_item_ids||[]).forEach(id => allItemIds.add(id));
      });
      let itemMap = {};
      if (allItemIds.size > 0) {
        const { data: items } = await supabase
          .from('items')
          .select('*')
          .in('id', Array.from(allItemIds));
        (items||[]).forEach(item => { itemMap[item.id] = item; });
      }
      setItemMap(itemMap);
      setIncoming(incomingTrades || []);
      setOutgoing(outgoingTrades || []);
      setLoading(false);
    }
    fetchTradesAndItems();
  }, []);

  function TradeCard({ trade, isIncoming }) {
    const [accepted, setAccepted] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const otherUserId = isIncoming ? trade.from_user_id : trade.to_user_id;
    // Delete trade handler
    async function handleDelete() {
      const { error } = await supabase.from('trades').delete().eq('id', trade.id);
      if (!error) setDeleted(true);
      else alert('Failed to delete trade: ' + error.message);
    }
    if (deleted) return null;
    return (
      <div style={{ marginBottom: 18, opacity: accepted ? 0.5 : 1, pointerEvents: accepted ? 'none' : 'auto' }}>
        {/* Date/time above card, right-aligned */}
        <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>
          {new Date(trade.created_at).toLocaleString()}
        </div>
        <div
          style={{
            background: 'var(--surface2)',
            borderRadius: 14,
            padding: 18,
            border: '1px solid var(--border)',
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            minHeight: 100,
            flexWrap: 'nowrap',
            position: 'relative',
            cursor: accepted ? 'default' : 'pointer',
            overflow: 'visible',
            flexDirection: 'row',
          }}
          onClick={() => !accepted && setSelectedRequest(trade)}
        >
          {/* Requested items (left) */}
          <div style={{ flex: 1, minWidth: 0, maxWidth: 260 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Requested</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto' }}>
              {(trade.item_ids||[]).map(id => {
                const item = itemMap[id];
                return item ? (
                  <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 70 }}>
                    {Array.isArray(item.photos) && item.photos.length > 0 ? (
                      <img src={item.photos[0]} alt={item.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, marginBottom: 4 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#eee', borderRadius: 8, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 18 }}>?</div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', maxWidth: 70, wordBreak: 'break-word' }}>{item.title}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          {/* Trade arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
            <span style={{ fontSize: 28, color: 'var(--accent)', marginBottom: 4 }}>⇄</span>
          </div>
          {/* Offered items (right) */}
          <div style={{ flex: 1, minWidth: 0, maxWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Offered</span>
              {trade.cash_amount > 0 && (
                <span style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '4px 14px',
                  fontWeight: 700,
                  fontSize: 15,
                  marginLeft: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  wordBreak: 'break-word',
                  whiteSpace: 'nowrap',
                }}>
                  +${trade.cash_amount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto' }}>
              {(trade.offered_item_ids||[]).map(id => {
                const item = itemMap[id];
                return item ? (
                  <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 70 }}>
                    {Array.isArray(item.photos) && item.photos.length > 0 ? (
                      <img src={item.photos[0]} alt={item.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, marginBottom: 4 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#eee', borderRadius: 8, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 18 }}>?</div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', maxWidth: 70, wordBreak: 'break-word' }}>{item.title}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
        {/* Action buttons below the card */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 10 }}>
          {isIncoming && (
            <>
              <button style={{
                background: 'var(--surface2)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 8,
                padding: '7px 18px',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
                onClick={() => {
                  window.location.href = `/counter/${trade.id}`;
                }}
              >Counter</button>
              <button style={{
                background: 'var(--surface2)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 8,
                padding: '7px 18px',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
                onClick={handleDelete}
              >Decline</button>
              <button style={{
                background: accepted ? 'var(--muted)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 18px',
                fontWeight: 700,
                fontSize: 15,
                cursor: accepted ? 'default' : 'pointer',
                transition: 'background 0.2s',
              }}
                disabled={accepted}
                onClick={() => setAccepted(true)}
              >Accept</button>
            </>
          )}
          {!isIncoming && (
            <button style={{
              background: 'var(--surface2)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '7px 18px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
              onClick={handleDelete}
            >Cancel</button>
          )}
          <button style={{
            background: 'var(--surface2)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: '7px 18px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
            onClick={() => window.location.href = `/messages/${otherUserId}`}
          >DM</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontWeight: 800, fontSize: 32, marginBottom: 10 }}>Requests</h1>
      <div style={{ color: 'var(--muted)', fontSize: 18, marginBottom: 28 }}>
        Manage your trade requests.
      </div>
      <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 24 }}>Trade Requests</h2>
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Incoming */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Incoming</h3>
          {incoming.length === 0 && <div style={{ color: 'var(--muted)' }}>No incoming requests.</div>}
          {incoming.map(trade => (
            <TradeCard key={trade.id} trade={trade} isIncoming={true} />
          ))}
        </div>
        {/* Outgoing */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Outgoing</h3>
          {outgoing.length === 0 && <div style={{ color: 'var(--muted)' }}>No outgoing requests.</div>}
          {outgoing.map(trade => (
            <TradeCard key={trade.id} trade={trade} isIncoming={false} />
          ))}
        </div>
      </div>
      {/* Modal for request details */}
      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.32)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedRequest(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 32, minWidth: 400, maxWidth: 600, width: '95vw', boxShadow: '0 4px 32px rgba(0,0,0,0.13)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedRequest(null)} style={{ position: 'absolute', top: 16, right: 18, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 22, cursor: 'pointer', zIndex: 10 }}>×</button>
            <h3 style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Request Details</h3>
            <pre style={{ fontSize: 15, background: 'var(--surface2)', padding: 16, borderRadius: 8, overflowX: 'auto' }}>{JSON.stringify(selectedRequest, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}