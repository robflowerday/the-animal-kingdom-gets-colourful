'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AnimalResponse {
  name: string;
  scientific_name: string;
  hex: string;
  why: string;
  origin: string;
  habitat: string;
  speed: string;
  colours: string;
  weight: string;
  gender: string;
  facts: string[];
  animal_id: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function textColorForHex(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return luminance(r, g, b) > 128 ? '#000000' : '#ffffff';
}

const INFO_ROWS: { label: string; key: keyof AnimalResponse }[] = [
  { label: 'Origin', key: 'origin' },
  { label: 'Habitat', key: 'habitat' },
  { label: 'Speed', key: 'speed' },
  { label: 'Colours', key: 'colours' },
  { label: 'Weight', key: 'weight' },
  { label: 'Gender', key: 'gender' },
];

// Some animal names need a more specific Wikipedia article title
const WIKI_TITLES: Record<string, string> = {
  'blue_dragon':      'Glaucus atlanticus',
  'fossa':            'Fossa (animal)',
  'secretary_bird':   'Secretarybird',
  'manta_ray':        'Oceanic manta ray',
  'glass_frog':       'Glass frog',
  'leafy_sea_dragon': 'Leafy seadragon',
  'mantis_shrimp':    'Mantis shrimp',
  'aye_aye':          'Aye-aye',
  'star_nosed_mole':  'Star-nosed mole',
};

async function fetchWikipediaImage(animalId: string, animalName: string): Promise<string | null> {
  const title = WIKI_TITLES[animalId] ?? animalName;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.originalimage?.source ?? data.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export default function AnimalPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<AnimalResponse | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAnimal(name: string) {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/animal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: AnimalResponse = await res.json();
      setResult(data);
      // Fetch Wikipedia image in parallel — don't block the result
      fetchWikipediaImage(data.animal_id, data.name).then(setImageUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchAnimal(input);
  }

  const bgColor = result?.hex ?? '#111111';
  const textColor = result ? textColorForHex(result.hex) : '#ffffff';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: bgColor,
        transition: 'background 0.7s cubic-bezier(.4,0,.2,1)',
        padding: '2rem',
      }}
    >
      {/* Nav */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          marginBottom: '1.5rem',
          transition: 'color 0.7s',
        }}
      >
        <Link
          href="/"
          style={{
            color: textColor,
            opacity: 0.6,
            fontSize: '0.85rem',
            textDecoration: 'none',
            letterSpacing: '0.01em',
            transition: 'opacity 0.2s, color 0.7s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.opacity = '1')}
          onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.opacity = '0.6')}
        >
          ← what colour is this word?
        </Link>
      </div>

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
        What animal are you?
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your name…"
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
          key={result.animal_id}
          style={{
            marginTop: '2.5rem',
            padding: '2rem 2.5rem',
            borderRadius: '20px',
            background: `${textColor}10`,
            border: `1.5px solid ${textColor}20`,
            color: textColor,
            maxWidth: '600px',
            width: '100%',
            animation: 'fadeUp 0.4s ease both',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Animal name */}
          <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
            <h2
              style={{
                fontSize: 'clamp(2rem, 6vw, 3rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {result.name}
            </h2>
            <p
              style={{
                fontSize: '1rem',
                fontStyle: 'italic',
                opacity: 0.6,
                margin: '0.4rem 0 0',
                letterSpacing: '0.01em',
              }}
            >
              {result.scientific_name}
            </p>
          </div>

          {/* Photo */}
          {imageUrl && (
            <div
              style={{
                width: '100%',
                marginBottom: '1.8rem',
                borderRadius: '12px',
                overflow: 'hidden',
                maxHeight: '340px',
              }}
            >
              <img
                src={imageUrl}
                alt={result.name}
                style={{
                  width: '100%',
                  height: '340px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* Why — poetic quote */}
          <blockquote
            style={{
              fontStyle: 'italic',
              fontSize: '1rem',
              lineHeight: 1.65,
              opacity: 0.82,
              textAlign: 'center',
              margin: '0 0 2rem',
              padding: '0 0.5rem',
              borderLeft: 'none',
            }}
          >
            {result.why}
          </blockquote>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: `${textColor}20`,
              marginBottom: '1.5rem',
            }}
          />

          {/* Info rows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              marginBottom: '2rem',
            }}
          >
            {INFO_ROWS.map(({ label, key }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    opacity: 0.5,
                    textTransform: 'uppercase',
                    minWidth: '72px',
                    paddingTop: '0.15rem',
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    opacity: 0.85,
                    background: `${textColor}10`,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    flex: 1,
                  }}
                >
                  {result[key] as string}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: `${textColor}20`,
              marginBottom: '1.5rem',
            }}
          />

          {/* 5 facts */}
          <div>
            <h3
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                opacity: 0.5,
                margin: '0 0 1rem',
              }}
            >
              5 things about {result.name}
            </h3>
            <ul
              style={{
                margin: 0,
                padding: '0 0 0 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              {result.facts.map((fact, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    opacity: 0.82,
                    paddingLeft: '0.25rem',
                  }}
                >
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
