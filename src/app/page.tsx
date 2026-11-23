'use client';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';

export default function Home() {
  return (
    <div className="new-home-wrap">
      {/* ── Top Floating Navigation ── */}
      <Nav overlay />

      {/* ════════════════════════════════════════════════════════════
          1. HERO SECTION (100% matched to herosection.png artwork)
          ════════════════════════════════════════════════════════════ */}
      <section
        className="new-home-hero"
        style={{ backgroundImage: "url('/herosection.png')" }}
      >
        <div className="home-hero-overlay" />

        {/* Hero Left Content */}
        <div className="home-hero-content">
          {/* Badge */}
          <div className="home-pill-badge home-badge-glass">
            <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>●</span>
            <span>Virtual Business Marketplace</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5.2vw, 4.2rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 24px rgba(0,0,0,0.45)',
              margin: '0 0 16px',
            }}
          >
            Explore. Connect.<br />
            Grow in <span style={{ color: '#facc15' }}>THE CITY</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.92)',
              fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)',
              lineHeight: 1.55,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              margin: '0 0 28px',
              maxWidth: '520px',
            }}
          >
            Step into a vibrant virtual world where businesses, people and opportunities meet.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/city" className="home-hero-btn-primary">
              <span style={{ fontSize: '0.78rem' }}>▶</span>
              <span>Explore the City</span>
              <span style={{ fontSize: '1rem', marginLeft: '2px' }}>›</span>
            </Link>
            <Link href="/buy" className="home-hero-btn-secondary">
              <span>📍</span>
              <span>View Map</span>
            </Link>
          </div>
        </div>

        {/* Right Floating Badge attached to City Building */}
        <div className="home-hero-badge-right">
          <span style={{ fontSize: '1.25rem', marginBottom: '2px' }}>🛍️</span>
          <span>Shop</span>
          <span>Learn</span>
          <span>Network</span>
        </div>

        {/* Bottom Floating Glass Pill Bar */}
        <div className="home-hero-bottom-bar">
          <Link href="/buy" className="home-hero-bottom-item">
            <span style={{ fontSize: '1.3rem' }}>🏪</span>
            <span>Discover<br /><strong>Businesses</strong></span>
          </Link>
          <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.25)' }} />
          <Link href="/city" className="home-hero-bottom-item">
            <span style={{ fontSize: '1.3rem' }}>👥</span>
            <span>Meet<br /><strong>People</strong></span>
          </Link>
          <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.25)' }} />
          <Link href="/buy" className="home-hero-bottom-item">
            <span style={{ fontSize: '1.3rem' }}>🚀</span>
            <span>Explore<br /><strong>New Opportunities</strong></span>
          </Link>
          <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.25)' }} />
          <Link href="/about" className="home-hero-bottom-item">
            <span style={{ fontSize: '1.3rem' }}>🌐</span>
            <span>Be Part of a<br /><strong>Growing Community</strong></span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          2. WHY THE CITY? A Smarter Way to Explore & Grow
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff' }}>
        <div className="home-section-grid">
          {/* Left Title Column */}
          <div>
            <div className="home-pill-badge home-badge-green">
              Why THE CITY?
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                margin: '0 0 16px',
              }}
            >
              A Smarter Way to Explore & Grow
            </h2>
            <p
              style={{
                fontSize: '0.94rem',
                color: '#64748b',
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              Discover a world full of possibilities — from businesses and services to events and communities, all in one immersive virtual space.
            </p>
            <Link href="/about" className="home-green-btn">
              <span>Learn More</span>
              <span>›</span>
            </Link>
          </div>

          {/* Right 4 Cards Grid */}
          <div className="home-why-cards-grid">
            {/* Card 1 */}
            <div className="home-why-card">
              <div style={{ width: 48, height: 48, position: 'relative', marginBottom: '8px' }}>
                <Image
                  src="/images/home/icon-store.png"
                  alt="Discover Businesses"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Discover Businesses
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Explore top stores and services.
              </p>
            </div>

            {/* Card 2 */}
            <div className="home-why-card">
              <div style={{ width: 48, height: 48, position: 'relative', marginBottom: '8px' }}>
                <Image
                  src="/images/home/icon-meet.png"
                  alt="Meet People"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Meet People
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Connect with like-minded users.
              </p>
            </div>

            {/* Card 3 */}
            <div className="home-why-card">
              <div style={{ width: 48, height: 48, position: 'relative', marginBottom: '8px' }}>
                <Image
                  src="/images/home/icon-rocket.png"
                  alt="Explore Opportunities"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Explore Opportunities
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Find new ideas and opportunities.
              </p>
            </div>

            {/* Card 4 */}
            <div className="home-why-card">
              <div style={{ width: 48, height: 48, position: 'relative', marginBottom: '8px' }}>
                <Image
                  src="/images/home/icon-handshake.png"
                  alt="Be Part of Community"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Be Part of Community
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Join a growing community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. DISCOVER THE VIBRANT CITY (Interactive Map Artwork)
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div className="home-section-grid">
          {/* Left Title Column */}
          <div>
            <div className="home-pill-badge home-badge-green">
              Explore
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                margin: '0 0 16px',
              }}
            >
              Discover the Vibrant City
            </h2>
            <p
              style={{
                fontSize: '0.94rem',
                color: '#64748b',
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              Walk, explore and experience a dynamic city filled with shops, offices, restaurants and more.
            </p>
            <Link href="/buy" className="home-green-btn">
              <span>Open City Map</span>
              <span>›</span>
            </Link>
          </div>

          {/* Right City Artwork Card with Interactive Pins */}
          <div className="home-discover-card">
            <Image
              src="/discover.png"
              alt="Discover the Vibrant City 3D Map"
              width={1400}
              height={800}
              priority
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />

            {/* Pin 1: Shopping District */}
            <Link
              href="/buy?district=Retail"
              className="home-map-pin"
              style={{
                top: '18%',
                left: '12%',
                color: '#7e22ce',
                border: '1.5px solid #d8b4fe',
              }}
            >
              <span>🛍️</span>
              <span>Shopping District</span>
            </Link>

            {/* Pin 2: Civic Plaza */}
            <Link
              href="/city"
              className="home-map-pin"
              style={{
                top: '12%',
                left: '46%',
                color: '#1e3a8a',
                border: '1.5px solid #93c5fd',
              }}
            >
              <span>📍</span>
              <span>Civic Plaza</span>
            </Link>

            {/* Pin 3: Business Hub */}
            <Link
              href="/buy?district=Financial"
              className="home-map-pin"
              style={{
                top: '18%',
                right: '12%',
                color: '#6b21a8',
                border: '1.5px solid #d8b4fe',
              }}
            >
              <span>🏢</span>
              <span>Business Hub</span>
            </Link>

            {/* Pin 4: Food Zone */}
            <Link
              href="/buy?district=Commercial"
              className="home-map-pin"
              style={{
                bottom: '24%',
                left: '32%',
                color: '#c2410c',
                border: '1.5px solid #fdba74',
              }}
            >
              <span>🍽️</span>
              <span>Food Zone</span>
            </Link>

            {/* Pin 5: Entertainment */}
            <Link
              href="/buy?district=Innovation"
              className="home-map-pin"
              style={{
                bottom: '24%',
                right: '26%',
                color: '#1d4ed8',
                border: '1.5px solid #93c5fd',
              }}
            >
              <span>🎮</span>
              <span>Entertainment</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. VISIT OUR MARKETPLACES
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff' }}>
        <div className="home-section-grid">
          {/* Left Title Column */}
          <div>
            <div className="home-pill-badge home-badge-green">
              Our Marketplaces
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                margin: '0 0 16px',
              }}
            >
              Visit Our Marketplaces
            </h2>
            <p
              style={{
                fontSize: '0.94rem',
                color: '#64748b',
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              Explore and grow with the best markets for modern technology and services.
            </p>
            <Link href="/buy" className="home-green-btn">
              <span>Explore All Markets</span>
              <span>›</span>
            </Link>
          </div>

          {/* Right 5 Category Cards */}
          <div className="home-market-cards-grid">
            {/* Market 1 */}
            <Link href="/buy" className="home-market-card">
              <div style={{ width: 52, height: 50, position: 'relative', margin: '0 auto 12px' }}>
                <Image
                  src="/images/home/market-saas.png"
                  alt="SaaS Market"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                  SaaS<br />Market
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 2 */}
            <Link href="/buy" className="home-market-card">
              <div style={{ width: 52, height: 50, position: 'relative', margin: '0 auto 12px' }}>
                <Image
                  src="/images/home/market-web.png"
                  alt="Web Development"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                  Web<br />Development
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 3 */}
            <Link href="/buy" className="home-market-card">
              <div style={{ width: 52, height: 50, position: 'relative', margin: '0 auto 12px' }}>
                <Image
                  src="/images/home/market-ai.png"
                  alt="AI"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                  AI
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 4 */}
            <Link href="/buy" className="home-market-card">
              <div style={{ width: 52, height: 50, position: 'relative', margin: '0 auto 12px' }}>
                <Image
                  src="/images/home/market-mobile.png"
                  alt="Mobile App"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                  Mobile<br />App
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>

            {/* Market 5 */}
            <Link href="/buy" className="home-market-card">
              <div style={{ width: 52, height: 50, position: 'relative', margin: '0 auto 12px' }}>
                <Image
                  src="/images/home/market-windows.png"
                  alt="Windows App"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                  Windows<br />App
                </span>
                <span className="home-market-arrow">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. COMMUNITY BANNER & FREE BUILDING CLAIM
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', paddingTop: '40px' }}>
        <div className="home-community-grid">
          {/* Left Community Card */}
          <div className="home-community-banner">
            <div style={{ zIndex: 2, maxWidth: '420px' }}>
              <div className="home-pill-badge home-badge-glass" style={{ marginBottom: '14px' }}>
                Join the Movement
              </div>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 2.8vw, 2.3rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  margin: '0 0 12px',
                  letterSpacing: '-0.02em',
                }}
              >
                Be Part of a Growing Community
              </h2>
              <p style={{ fontSize: '0.94rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0, lineHeight: 1.5 }}>
                Connect, collaborate and grow with people across the world.
              </p>
            </div>

            {/* Characters Artwork */}
            <div
              style={{
                position: 'relative',
                width: 'clamp(180px, 28vw, 260px)',
                height: '135px',
                flexShrink: 0,
                alignSelf: 'flex-end',
              }}
            >
              <Image
                src="/images/home/community-avatars.png"
                alt="Community Members"
                fill
                style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
              />
            </div>
          </div>

          {/* Right Free Building Card */}
          <div className="home-gift-card">
            <div style={{ width: 48, height: 40, position: 'relative', margin: '0 auto 4px' }}>
              <Image
                src="/images/home/gift-icon.png"
                alt="Gift Ribbon"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Get Free<br />Building Now!
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px', lineHeight: 1.45, maxWidth: '200px' }}>
              Claim your own building and start your journey.
            </p>
            <Link href="/buy" className="home-green-btn" style={{ padding: '9px 24px', fontSize: '0.86rem' }}>
              <span>Claim Now</span>
              <span>›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. PRE-FOOTER READY TO EXPLORE CAPSULE
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '0 24px 40px' }}>
        <div className="home-prefooter-capsule">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.1rem',
              }}
            >
              C
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#0f172a' }}>
              THE CITY
            </span>
          </div>

          {/* Text Center */}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
              Ready to Explore THE CITY?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Step in, connect and be part of something bigger.
            </p>
          </div>

          {/* Action */}
          <Link href="/city" className="home-green-btn">
            <span>Start Exploring</span>
            <span>›</span>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          7. FOOTER
          ════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '36px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Top Row: Links & Social Icons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
              paddingBottom: '24px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            {/* Links */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Link href="/" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                Home
              </Link>
              <Link href="/city" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                Explore
              </Link>
              <Link href="/buy" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                Markets
              </Link>
              <Link href="/about" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                About
              </Link>
              <Link href="/faq" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', textDecoration: 'none' }}>
                FAQ
              </Link>
            </div>

            {/* Social Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b' }}>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="Discord">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="https://thecity.app" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="Web">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
            </div>
          </div>

          {/* Bottom Row */}
          <div
            style={{
              paddingTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '0.8rem',
              color: '#94a3b8',
            }}
          >
            <span>© 2026 THE CITY. All rights reserved.</span>
            <span style={{ fontWeight: 600, color: '#64748b' }}>Explore • Connect • Grow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
