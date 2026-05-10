import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function MessagesList() {
  const [threads, setThreads] = useState([]);
  const [myId, setMyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let subscription;
    async function fetchSessionAndThreads() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      setMyId(userId);
      if (!userId) return;
      // Fetch all messages where user is sender or recipient
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('sent_at', { ascending: false });
      if (error) { setLoading(false); return; }
      // Group by other user (show both sent and received)
      const threadMap = {};
      for (const msg of messages) {
        // Don't group with yourself
        if (msg.from_user_id === userId && msg.to_user_id === userId) continue;
        const otherId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;
        if (!threadMap[otherId] || new Date(msg.sent_at) > new Date(threadMap[otherId].sent_at)) {
          threadMap[otherId] = msg;
        }
      }
      // Always show a tile, even if no profile
      const otherIds = Object.keys(threadMap);
      let profiles = {};
      if (otherIds.length > 0) {
        console.log('Fetching user profiles for otherIds:', otherIds);
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name, profile_image_base64')
          .in('id', otherIds);
        if (usersError) console.error('Error fetching users:', usersError);
        console.log('Fetched users for threads:', users);
        (users||[]).forEach(u => { profiles[u.id] = u; });
      }
      // Build thread list with robust fallback
      const threadList = otherIds.map(id => {
        const user = profiles[id] || { id, username: id, avatar_url: '', first_name: '', last_name: '', profile_image_base64: '' };
        return {
          user,
          lastMessage: threadMap[id]
        };
      }).sort((a, b) => new Date(b.lastMessage.sent_at) - new Date(a.lastMessage.sent_at));
      console.log('Thread list to render:', threadList);
      setThreads(threadList);
      setLoading(false);
    }
    fetchSessionAndThreads();
    // Realtime subscription
    subscription = supabase
      .channel('messages-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        fetchSessionAndThreads();
      })
      .subscribe();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', background: 'var(--surface2)', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 0, minHeight: 500 }}>
      <div style={{ padding: 24, borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>
        Messages
      </div>
      <div style={{ padding: 0 }}>
        {loading ? <div style={{ padding: 24 }}>Loading...</div> : (
          threads.length === 0 ? <div style={{ color: 'var(--muted)', padding: 24 }}>No conversations yet.</div> :
            threads.map(thread => {
              // Robust name fallback
              let name = ((thread.user.first_name || '') + ' ' + (thread.user.last_name || '')).trim();
              if (!name) name = thread.user.username || '';
              if (!name) name = thread.user.id;
              return (
                <div
                  key={thread.user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '24px 28px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: 'var(--surface2)',
                  }}
                  onClick={() => navigate(`/messages/${thread.user.id}`)}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--surface1)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'var(--surface2)')}
                >
                  {thread.user.profile_image_base64 ? (
                    <img src={thread.user.profile_image_base64} alt={name} style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 22, objectFit: 'cover' }} />
                  ) : thread.user.avatar_url ? (
                    <img src={thread.user.avatar_url} alt={name} style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 22, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 22, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#aaa' }}>
                      {name[0] ? name[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 2, color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 16, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                      {thread.lastMessage.content}
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 14, marginLeft: 18, minWidth: 70, textAlign: 'right', fontWeight: 500 }}>
                    {new Date(thread.lastMessage.sent_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
