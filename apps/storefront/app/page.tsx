import React from 'react';
import { loginAction } from '../lib/actions';

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form
        action={loginAction}
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          width: 360,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Brand Beats</h1>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 14 }}>
          Merchant sign in
        </p>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 12 }}>
          Email
          <input
            name="email"
            type="email"
            required
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ddd',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 20 }}>
          Password
          <input
            name="password"
            type="password"
            required
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ddd',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: 'none',
            background: '#111',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
