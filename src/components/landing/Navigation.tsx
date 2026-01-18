'use client';

import { useState, useEffect } from 'react';

interface NavigationProps {
  onExplore: () => void;
}

export function Navigation({ onExplore }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <div className="nav__brand">
          <span className="nav__version">v2.4.1</span>
          <span className="nav__divider">/</span>
          <span className="nav__name">LANDLOCK</span>
        </div>
        
        <div className="nav__status">
          <span className="nav__dot" />
          <span>SYSTEM READY</span>
        </div>

        <button className="nav__btn" onClick={onExplore}>
          ENTER
        </button>
      </div>

      <style jsx>{`
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0 24px;
          height: 48px;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
          border-bottom: 1px solid transparent;
        }

        .nav--scrolled {
          background: rgba(10, 15, 13, 0.95);
          backdrop-filter: blur(8px);
          border-bottom-color: var(--border);
        }

        .nav__inner {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav__brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.1em;
        }

        .nav__version {
          color: var(--muted);
        }

        .nav__divider {
          color: var(--border);
        }

        .nav__name {
          color: var(--foreground);
        }

        .nav__status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--muted);
        }

        .nav__dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .nav__btn {
          padding: 8px 20px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--foreground);
          font-family: inherit;
          font-size: 10px;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav__btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        @media (max-width: 640px) {
          .nav__status {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
