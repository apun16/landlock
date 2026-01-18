'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
        <Link href="/" className="nav__logo">
          <span className="nav__logo-text">LandLock</span>
        </Link>
        <button className="nav__cta" onClick={onExplore}>
          Open App
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 24px;
          transition: all 0.3s ease;
        }

        .nav--scrolled {
          background: rgba(9, 9, 11, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav__inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fafafa;
        }

        .nav__logo-icon {
          width: 32px;
          height: 32px;
        }

        .nav__logo-text {
          font-family: var(--font-charis), serif;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .nav__links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav__link {
          padding: 10px 16px;
          color: #a1a1aa;
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.9rem;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .nav__link:hover {
          color: #fafafa;
          background: rgba(255, 255, 255, 0.05);
        }

        .nav__cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0;
          color: #fafafa;
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav__cta:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .nav__links { display: none; }
        }
      `}</style>
    </nav>
  );
}
