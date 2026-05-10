import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';


const AuthScreen = () => {
  // alert('[DEBUG] AuthScreen component mounted');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // alert('[DEBUG] AuthScreen useEffect running');
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        await ensureUserProfile(session.user);
        navigate('/profile', { replace: true });
      }
      setLoading(false);
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureUserProfile(session.user);
        navigate('/profile', { replace: true });
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  // Ensure user profile exists in users table
  async function ensureUserProfile(user) {
    // Debug removed
    // Defensive: always provide all required fields and generate a unique username
    const email = user.email || user.user_metadata?.email || '';
    let firstName = 'New';
    let lastName = 'User';
    if (user.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      firstName = parts[0] || 'New';
      lastName = parts.slice(1).join(' ') || 'User';
    }
    let username = user.user_metadata?.user_name || user.user_metadata?.preferred_username;
    if (!username && email) {
      username = '@' + email.split('@')[0];
    }
    if (!username) {
      username = 'user_' + user.id.slice(0, 8);
    }

    // Try to find by id first
    let { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    // Debug removed

    // Debug removed
    if (data) {
      // User exists by id, update profile
      const updatePayload = {
        email,
        first_name: firstName,
        last_name: lastName,
        username,
      };
      // Debug removed
      // Debug removed
      const { error: updateError } = await supabase.from('users').update(updatePayload).eq('id', user.id);
      // Debug removed
      if (updateError) {
        alert('[DEBUG] Supabase user update error:\n' + JSON.stringify(updateError, null, 2));
        console.error('Supabase user update error:', updateError);
        alert('Database error: ' + updateError.message);
      }
      // Debug removed
      return;
    }

    // If not found by id, try by email
    // Debug removed
    if (error && error.code === 'PGRST116' && email) {
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      // Debug removed
      // Debug removed
      if (emailUser) {
        // User exists by email, update id and profile
        const updatePayload = {
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          username,
        };
        // Debug removed
        // Debug removed
        const { error: updateError } = await supabase.from('users').update(updatePayload).eq('email', email);
        // Debug removed
        if (updateError) {
          alert('[DEBUG] Supabase user update-by-email error:\n' + JSON.stringify(updateError, null, 2));
          console.error('Supabase user update-by-email error:', updateError);
          alert('Database error: ' + updateError.message);
        }
        // Debug removed
        return;
      }
      // If not found by email, insert new user
      let uniqueUsername = username;
      let tries = 0;
      while (tries < 3) {
        const { data: existing } = await supabase.from('users').select('id').eq('username', uniqueUsername).single();
        if (!existing) break;
        uniqueUsername = username + Math.floor(Math.random() * 10000);
        tries++;
      }
      const insertPayload = {
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        username: uniqueUsername,
      };
      const { error: insertError } = await supabase.from('users').insert([insertPayload]);
      if (insertError) {
        // If unique violation, try to fetch and update
        if (insertError.message && insertError.message.includes('duplicate key value')) {
          // Try to fetch by email and update
          const { data: dupeUser } = await supabase.from('users').select('id').eq('email', email).single();
          if (dupeUser) {
            const updatePayload = {
              id: user.id,
              first_name: firstName,
              last_name: lastName,
              username: uniqueUsername,
            };
            await supabase.from('users').update(updatePayload).eq('email', email);
            return;
          }
        }
        console.error('Supabase user insert error:', insertError);
        alert('Database error: ' + insertError.message);
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      alert('Google sign-in error: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="screen active" id="screen-auth" role="main" aria-label="Authentication Screen" style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div className="auth-logo" aria-label="Traloop Logo" style={{textAlign: 'center'}}>Tra<span>loop</span></div>
      <div className="auth-tag" style={{textAlign: 'center'}}>Trade smart. Live green.</div>
      <div className="auth-card" role="form" aria-labelledby="auth-form-title" style={{margin: '0 auto'}}>
        <button className="btn btn--primary" style={{marginBottom: 16}} onClick={handleGoogleSignIn} aria-label="Sign in with Google" disabled={loading}>
          <span style={{marginRight: 8}}>🔒</span> Sign in with Google
        </button>
        <div style={{color: 'var(--muted)', fontSize: 13, textAlign: 'center'}}>No password required. Secure Google login only.</div>
        {loading && <div className="loading">Checking session...</div>}
      </div>
    </div>
  );
};

export default AuthScreen;
