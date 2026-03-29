'use client';

import { useState, useRef } from 'react';

interface ColorResponse {
  hex: string;
  rgb: number[];
  hsl: number[];
  name: string | null;
  is_named_color: boolean;
  word: string;
  reasoning: string;
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ColorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function fetchColor(word: string) {
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: ColorResponse = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchColor(input);
  }

  const bgColor = result?.hex ?? '#111111';
  const textColor =
    result
      ? luminance(result.rgb[0], result.rgb[1], result.rgb[2]) > 128
        ? '#000000'
        : '#ffffff'
      : '#ffffff';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        transition: 'background 0.7s cubic-bezier(.4,0,.2,1)',
        padding: '2rem',
      }}
    >
      {/* Nav */}
      <a
        href="/animal"
        style={{
          position: 'fixed',
          top: '1.2rem',
          right: '1.5rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: textColor,
          opacity: 0.55,
          textDecoration: 'none',
          letterSpacing: '0.04em',
          transition: 'opacity 0.2s, color 0.7s',
        }}
        onMouseOver={e => (e.currentTarget.style.opacity = '1')}
        onMouseOut={e => (e.currentTarget.style.opacity = '0.55')}
      >
        what animal are you? →
      </a>

      {/* Title */}
      <h1
        style={{
          fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: textColor,
          marginBottom: '2.5rem',
          textAlign: 'center',
          opacity: 0.92,
          transition: 'color 0.7s',
          animation: 'fadeUp 0.5s ease both',
        }}
      >
        What colour is this word?
      </h1>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '480px',
          animation: 'fadeUp 0.5s 0.1s ease both',
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type any word…"
          autoFocus
          style={{
            flex: 1,
            padding: '0.85rem 1.1rem',
            fontSize: '1.1rem',
            borderRadius: '12px',
            border: `2px solid ${textColor}40`,
            background: `${textColor}15`,
            color: textColor,
            outline: 'none',
            transition: 'border-color 0.3s, color 0.7s, background 0.7s',
          }}
          onFocus={(e) => (e.target.style.borderColor = `${textColor}90`)}
          onBlur={(e) => (e.target.style.borderColor = `${textColor}40`)}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '0.85rem 1.4rem',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '12px',
            border: 'none',
            background: textColor,
            color: bgColor,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.45 : 1,
            transition: 'opacity 0.2s, background 0.7s, color 0.7s',
          }}
        >
          {loading ? '…' : 'Go'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <p
          style={{
            marginTop: '1rem',
            color: textColor,
            opacity: 0.7,
            fontSize: '0.9rem',
            animation: 'fadeUp 0.3s ease both',
          }}
        >
          {error} — is the backend running?
        </p>
      )}

      {/* Result card */}
      {result && !loading && (
        <div
          key={result.hex}
          style={{
            marginTop: '2.5rem',
            padding: '2rem 2.5rem',
            borderRadius: '20px',
            background: `${textColor}10`,
            border: `1.5px solid ${textColor}20`,
            color: textColor,
            maxWidth: '480px',
            width: '100%',
            animation: 'fadeUp 0.4s ease both',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Swatch + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.4rem' }}>
            {/* Swatch with pulse-ring */}
            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  background: result.hex,
                  opacity: 0.35,
                  animation: 'pulse-ring 2s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: result.hex,
                  border: `3px solid ${textColor}30`,
                  position: 'relative',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {result.is_named_color && result.name
                  ? result.name.charAt(0).toUpperCase() + result.name.slice(1)
                  : result.hex}
              </div>
              {result.is_named_color && (
                <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: 2 }}>
                  named CSS colour
                </div>
              )}
            </div>
          </div>

          {/* Reasoning */}
          <p
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.6,
              opacity: 0.75,
              marginBottom: '1.4rem',
              fontStyle: 'italic',
            }}
          >
            {result.reasoning}
          </p>

          {/* Color values */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: 'HEX', value: result.hex },
              {
                label: 'RGB',
                value: `rgb(${result.rgb[0]}, ${result.rgb[1]}, ${result.rgb[2]})`,
              },
              {
                label: 'HSL',
                value: `hsl(${result.hsl[0]}°, ${result.hsl[1]}%, ${result.hsl[2]}%)`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.5, letterSpacing: '0.06em' }}>
                  {label}
                </span>
                <span
                  style={{
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    background: `${textColor}12`,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                  title="Click to copy"
                  onClick={() => navigator.clipboard.writeText(value)}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
