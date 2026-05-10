import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Messages() {
  const { userId } = useParams(); // the other user's id
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const messagesEndRef = useRef(null);
  // Fetch other user's profile
  useEffect(() => {
    async function fetchOtherProfile() {
      if (!userId) return;
      let profile = null;
      const { data: mySession } = await supabase.auth.getSession();
      const myId = mySession?.session?.user?.id;
      // Always fetch the latest message between myId and userId
      if (myId && userId) {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .or(`and(from_user_id.eq.${myId},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${myId})`)
          .order('sent_at', { ascending: false })
          .limit(1);
        if (messages && messages.length > 0) {
          const msg = messages[0];
          const otherId = msg.from_user_id === myId ? msg.to_user_id : msg.from_user_id;
          if (otherId && otherId !== myId) {
            const { data: foundProfile } = await supabase
              .from('users')
              .select('id, username, first_name, last_name, profile_image_base64')
              .eq('id', otherId)
              .single();
            if (foundProfile) {
              profile = foundProfile;
            }
          }
        }
      }
      // Fallback: try direct lookup of userId
      if (!profile && userId) {
        const { data } = await supabase
          .from('users')
          .select('id, username, first_name, last_name, profile_image_base64')
          .eq('id', userId)
          .single();
        if (data) profile = data;
      }
      setOtherProfile(profile);
    }
    fetchOtherProfile();
  }, [userId]);

  useEffect(() => {
    async function fetchSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setMyId(session?.user?.id);
    }
    fetchSession();
  }, []);

  useEffect(() => {
    if (!myId) return;
    let subscription;
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(from_user_id.eq.${myId},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${myId})`)
        .order('sent_at', { ascending: true });
      if (!error) setMessages(data);
      setLoading(false);
    }
    fetchMessages();
    // Realtime subscription
    subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        fetchMessages();
      })
      .subscribe();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [myId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    // Optimistically add message
    const optimisticMsg = {
      id: Math.random().toString(36).slice(2), // temp id
      from_user_id: myId,
      to_user_id: userId,
      content,
      is_unread: true,
      sent_at: new Date().toISOString(),
    };
    setMessages(msgs => [...msgs, optimisticMsg]);
    await supabase.from('messages').insert([
      {
        from_user_id: myId,
        to_user_id: userId,
        content,
        is_unread: true,
      }
    ]);
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', background: 'var(--surface2)', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 0, minHeight: 500, display: 'flex', flexDirection: 'column', height: '80vh' }}>
      <div style={{ padding: 24, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar logic: prefer profile_image_base64, then avatar_url, fallback to initial */}
        {otherProfile && otherProfile.profile_image_base64 ? (
          <img src={otherProfile.profile_image_base64} alt={otherProfile.username || ''} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
        ) : otherProfile && otherProfile.avatar_url ? (
          <img src={otherProfile.avatar_url} alt={otherProfile.username || ''} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#aaa' }}>
            {(() => {
              let name = ((otherProfile?.first_name || '') + ' ' + (otherProfile?.last_name || '')).trim();
              if (!name) name = otherProfile?.username || '';
              if (!name) name = otherProfile?.id || '?';
              return name[0] ? name[0].toUpperCase() : '?';
            })()}
          </div>
        )}
        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>
          {(() => {
            if (!otherProfile) return 'Direct Messages';
            // Robust fallback: prefer first+last, then username, then ID
            let name = '';
            if (typeof otherProfile === 'object' && otherProfile !== null) {
              name = ((otherProfile.first_name || '') + ' ' + (otherProfile.last_name || '')).trim();
              if (!name && otherProfile.username) name = otherProfile.username;
              if (!name && otherProfile.id) name = otherProfile.id;
            }
            return name || 'Direct Messages';
          })()}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--surface)' }}>
        {loading ? <div>Loading...</div> : (
          messages.length === 0 ? <div style={{ color: 'var(--muted)' }}>No messages yet.</div> :
            messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.from_user_id === myId ? 'flex-end' : 'flex-start',
                marginBottom: 12
              }}>
                <div style={{
                  background: msg.from_user_id === myId ? 'var(--accent)' : 'var(--surface2)',
                  color: msg.from_user_id === myId ? '#fff' : 'var(--text)',
                  borderRadius: 12,
                  padding: '10px 18px',
                  maxWidth: 320,
                  fontSize: 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
                }}>
                  {msg.content}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                    {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', borderTop: '1px solid var(--border)', padding: 16, background: 'var(--surface2)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, fontSize: 16, padding: 10, borderRadius: 8, border: '1px solid var(--border)', marginRight: 12 }}
        />
        <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
}
