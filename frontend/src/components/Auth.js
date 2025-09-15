import { useState, useEffect } from 'react';
import { getSupabase, initializeSupabase } from '../supabaseClient';
import logo from '../logo.svg';

export default function Auth() {
  const [session, setSession] = useState(null);
  const [supabase, setSupabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { supabase: client, config: cfg } = await initializeSupabase();
        setSupabase(client);
        setConfig(cfg);
        
        // Get initial session
        const { data: { session } } = await client.auth.getSession();
        setSession(session);
        
        // Listen for auth changes
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });
        
        setLoading(false);
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth setup error:', error);
        setLoading(false);
      }
    };
    
    setupAuth();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    const siteUrl = config?.deployUrl || config?.siteUrl || window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });
    if (error) console.error('Error:', error);
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error:', error);
  };

  if (loading) {
    return (
      <>
        <img src={logo} className="App-logo" alt="logo" />
        <p>Loading Supabase configuration...</p>
      </>
    );
  }

  if (session) {
    return (
      <>
        <img src={logo} className="App-logo" alt="logo" />
        <p>Welcome, {session.user.email}!</p>
        <button onClick={signOut}>Sign Out</button>
      </>
    );
  }

  return (
    <>
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Welcome to <code>[APP_NAME]</code> - Supabase OAuth Demo
      </p>
      <button 
        onClick={signInWithGoogle} 
        disabled={!supabase}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>
      {!config && <p style={{color: 'red', fontSize: '12px'}}>Config not loaded</p>}
      <p>
        <a
          className="App-link"
          href="https://supabase.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Supabase
        </a>
      </p>
    </>
  );
}