/**
 * Awareness — AquaLoop Groundwater Awareness Page
 *
 * Evidence-based articles and groundwater education content from open datasets.
 * Features an editorial environmental hero, statistics overview, category & search filtering,
 * and responsive SVG visual cards.
 */
import { useState, useMemo } from 'react'
import {
  BookOpen,
  ExternalLink,
  Droplets,
  ArrowDown,
  Search,
  X,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import Badge from '../components/ui/Badge.jsx'

const SAMPLE_ARTICLES = [
  {
    id: 1,
    title: 'Why Groundwater Levels Are Falling Across India',
    summary:
      'Urban growth, over-extraction for agriculture, and reduced recharge zones are major contributors. This article explores the mechanisms and regional variation.',
    tag: 'Groundwater',
    readTime: '5 min read',
    source: 'India-WRIS',
    sourceUrl: 'https://indiawris.gov.in/',
  },
  {
    id: 2,
    title: 'Rainwater Harvesting: How It Works and Why It Matters',
    summary:
      'A step-by-step look at rooftop rainwater collection systems — how to build one, typical yields, and how they recharge groundwater tables.',
    tag: 'Conservation',
    readTime: '4 min read',
    source: 'data.gov.in',
    sourceUrl: 'https://data.gov.in/',
  },
  {
    id: 3,
    title: 'The Water Footprint of Common Foods',
    summary:
      'Producing 1 kg of rice requires roughly 1,670 litres of water. Understanding the hidden water cost of diet choices is a first step to reducing it.',
    tag: 'Awareness',
    readTime: '3 min read',
    source: 'WFN.org',
    sourceUrl: 'https://waterfootprint.org/',
  },
  {
    id: 4,
    title: 'How Cities Can Reduce Non-Revenue Water Loss',
    summary:
      'Up to 40% of municipal water supply is lost to leaks and metering errors before it reaches the consumer. Smart metering and citizen reporting are proven solutions.',
    tag: 'Urban Water',
    readTime: '6 min read',
    source: 'OpenStreetMap / OSM',
    sourceUrl: 'https://www.openstreetmap.org/',
  },
]

const TAG_THEMES = {
  Groundwater: {
    color: 'var(--color-primary-700)',
    bg: 'var(--color-primary-50)',
    border: 'var(--color-primary-200)',
  },
  Conservation: {
    color: 'var(--color-success)',
    bg: 'var(--color-success-bg)',
    border: '#a7f3d0',
  },
  Awareness: {
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  'Urban Water': {
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
}

/**
 * Editorial Hero SVG Artwork: Aquifer cross-section showing percolation & water table.
 */
function HeroAquiferArt() {
  return (
    <svg
      viewBox="0 0 340 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        height: 'auto',
        maxHeight: 220,
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))',
      }}
      aria-label="Aquifer cross-section diagram showing rainfall, soil percolation, and groundwater reservoir"
      role="img"
    >
      <defs>
        <linearGradient id="heroSoilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#455a64" />
          <stop offset="100%" stopColor="#263238" />
        </linearGradient>
        <linearGradient id="heroAquiferGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00838f" />
          <stop offset="100%" stopColor="#004d61" />
        </linearGradient>
        <linearGradient id="heroCloudGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f7fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b2ebf2" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* Frame border */}
      <rect
        width="340"
        height="220"
        rx="14"
        fill="#061a2f"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />

      {/* Cloud & Rain */}
      <path
        d="M40 38 C40 28 50 20 62 20 C72 20 80 25 84 32 C88 28 96 28 100 32 C106 32 112 37 112 44 C112 51 106 56 98 56 L44 56 C36 56 30 50 30 43 C30 38 34 38 40 38 Z"
        fill="url(#heroCloudGrad)"
      />
      <g stroke="#80deea" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4">
        <line x1="48" y1="64" x2="44" y2="82" />
        <line x1="68" y1="64" x2="64" y2="84" />
        <line x1="88" y1="64" x2="84" y2="82" />
        <line x1="104" y1="64" x2="100" y2="80" />
      </g>

      {/* Ground Surface */}
      <path d="M0 90 Q85 84 170 88 T340 86 L340 120 L0 120 Z" fill="url(#heroSoilGrad)" />
      <path d="M0 90 Q85 84 170 88 T340 86" stroke="#4caf50" strokeWidth="4" />

      {/* Flora */}
      <path d="M135 87 L140 76 L145 87 Z" fill="#81c784" />
      <path d="M148 87 L152 74 L156 87 Z" fill="#66bb6a" />
      <path d="M280 85 L285 74 L290 85 Z" fill="#81c784" />

      {/* Soil Strata Texture */}
      <g fill="#90a4ae" opacity="0.6">
        <circle cx="50" cy="104" r="2.5" />
        <circle cx="95" cy="110" r="3" />
        <circle cx="160" cy="102" r="2" />
        <circle cx="230" cy="108" r="3.5" />
        <circle cx="305" cy="105" r="2.5" />
      </g>

      {/* Water Table Boundary */}
      <line
        x1="0"
        y1="124"
        x2="340"
        y2="124"
        stroke="#00e5ff"
        strokeWidth="2.5"
        strokeDasharray="6 4"
      />
      <rect
        x="210"
        y="114"
        width="118"
        height="18"
        rx="4"
        fill="rgba(0, 229, 255, 0.2)"
        stroke="#00e5ff"
        strokeWidth="1"
      />
      <text
        x="269"
        y="127"
        fill="#e0f7fa"
        fontSize="9.5"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        WATER TABLE
      </text>

      {/* Saturated Deep Aquifer Layer */}
      <rect x="0" y="125" width="340" height="95" fill="url(#heroAquiferGrad)" />

      {/* Water Flow Currents */}
      <path
        d="M10 148 Q85 140 170 148 T330 144"
        stroke="#80deea"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        opacity="0.75"
      />
      <path
        d="M20 176 Q95 168 180 176 T320 172"
        stroke="#4dd0e1"
        strokeWidth="1.5"
        strokeDasharray="10 8"
        opacity="0.6"
      />
      <path d="M10 200 Q90 194 180 200 T330 196" stroke="#26c6da" strokeWidth="1.5" opacity="0.5" />

      {/* Borewell Shaft */}
      <rect x="200" y="70" width="8" height="110" fill="#cfd8dc" stroke="#37474f" strokeWidth="1.5" />
      <rect x="196" y="66" width="16" height="8" rx="2" fill="#78909c" />
      <line x1="202" y1="150" x2="206" y2="150" stroke="#00e5ff" strokeWidth="1.5" />
      <line x1="202" y1="158" x2="206" y2="158" stroke="#00e5ff" strokeWidth="1.5" />
      <line x1="202" y1="166" x2="206" y2="166" stroke="#00e5ff" strokeWidth="1.5" />

      {/* Recharge Arrows */}
      <g stroke="#00e5ff" strokeWidth="1.75" strokeLinecap="round">
        <path d="M70 94 L70 114 M67 110 L70 114 L73 110" />
        <path d="M110 94 L110 114 M107 110 L110 114 L113 110" />
      </g>
      <text x="90" y="106" fill="#80deea" fontSize="8" fontWeight="600" textAnchor="middle">
        Percolation
      </text>

      {/* Aquifer Label */}
      <rect
        x="16"
        y="186"
        width="140"
        height="20"
        rx="4"
        fill="rgba(0, 77, 97, 0.7)"
        stroke="#26c6da"
        strokeWidth="1"
      />
      <text x="86" y="200" fill="#e0f7fa" fontSize="9" fontWeight="700" textAnchor="middle">
        Saturated Aquifer Storage
      </text>
    </svg>
  )
}

/**
 * Article 1 Illustration: Groundwater Depletion & Drawdown
 */
function ArticleArtwork1() {
  return (
    <svg viewBox="0 0 340 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 100, display: 'block' }}>
      <defs>
        <linearGradient id="art1Grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f7fa" />
          <stop offset="100%" stopColor="#b2ebf2" />
        </linearGradient>
      </defs>
      <rect width="340" height="100" fill="url(#art1Grad)" />
      <path d="M0 32 L340 32" stroke="#80deea" strokeWidth="2" />
      <path d="M20 46 C100 48, 180 72, 320 84" stroke="#d97706" strokeWidth="2.5" strokeDasharray="5 3" />
      <path d="M20 46 C100 48, 180 72, 320 84 L320 100 L0 100 Z" fill="rgba(0, 151, 167, 0.15)" />
      <line x1="20" y1="46" x2="320" y2="46" stroke="#0097a7" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="24" y="42" fill="#00838f" fontSize="9" fontWeight="600">Historical Water Table</text>
      <text x="220" y="78" fill="#b45309" fontSize="9" fontWeight="700">Critical Drawdown ↓</text>
      <rect x="280" y="22" width="6" height="65" fill="#546e7a" rx="1" />
      <circle cx="283" cy="22" r="5" fill="#f59e0b" />
    </svg>
  )
}

/**
 * Article 2 Illustration: Rainwater Rooftop Collection & Recharge
 */
function ArticleArtwork2() {
  return (
    <svg viewBox="0 0 340 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 100, display: 'block' }}>
      <defs>
        <linearGradient id="art2Grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8f5e9" />
          <stop offset="100%" stopColor="#c8e6c9" />
        </linearGradient>
      </defs>
      <rect width="340" height="100" fill="url(#art2Grad)" />
      <g stroke="#2e7d32" strokeWidth="1.5" strokeDasharray="2 3">
        <line x1="40" y1="10" x2="36" y2="22" />
        <line x1="65" y1="8" x2="61" y2="24" />
        <line x1="90" y1="12" x2="86" y2="26" />
      </g>
      <path d="M20 40 L80 18 L140 40" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 40 L30 75 L130 75 L130 40" fill="#ffffff" stroke="#2e7d32" strokeWidth="1.5" />
      <path d="M140 38 L146 38 L146 68 L200 68 L200 80" stroke="#0097a7" strokeWidth="2.5" fill="none" />
      <rect x="188" y="80" width="24" height="18" rx="2" fill="#80deea" stroke="#00838f" strokeWidth="1.5" />
      <g stroke="#00838f" strokeWidth="1" strokeLinecap="round">
        <line x1="194" y1="92" x2="206" y2="92" />
        <line x1="196" y1="95" x2="204" y2="95" />
      </g>
      <text x="220" y="92" fill="#1b5e20" fontSize="9" fontWeight="700">Recharge Pit</text>
      <text x="148" y="58" fill="#00695c" fontSize="8" fontWeight="600">Runoff Flow →</text>
    </svg>
  )
}

/**
 * Article 3 Illustration: Virtual Water Footprint Measurement
 */
function ArticleArtwork3() {
  return (
    <svg viewBox="0 0 340 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 100, display: 'block' }}>
      <defs>
        <linearGradient id="art3Grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff8e1" />
          <stop offset="100%" stopColor="#ffecb3" />
        </linearGradient>
      </defs>
      <rect width="340" height="100" fill="url(#art3Grad)" />
      <circle cx="90" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="90" cy="50" r="26" fill="rgba(245, 158, 11, 0.15)" stroke="#d97706" strokeWidth="1.5" />
      <circle cx="90" cy="50" r="14" fill="#f59e0b" opacity="0.3" />
      <path d="M90 38 C90 38 82 48 82 54 C82 58.4 85.6 62 90 62 C94.4 62 98 58.4 98 54 C98 48 90 38 90 38 Z" fill="#d97706" />
      <rect x="150" y="32" width="165" height="38" rx="6" fill="#ffffff" stroke="#fde68a" strokeWidth="1.5" />
      <text x="162" y="47" fill="#b45309" fontSize="11" fontWeight="800">1 kg Rice = 1,670 Litres</text>
      <text x="162" y="60" fill="#78350f" fontSize="8.5" fontWeight="500">Embedded Virtual Water Cost</text>
    </svg>
  )
}

/**
 * Article 4 Illustration: Smart Urban Pipeline & Telemetry Grid
 */
function ArticleArtwork4() {
  return (
    <svg viewBox="0 0 340 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 100, display: 'block' }}>
      <defs>
        <linearGradient id="art4Grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
      </defs>
      <rect width="340" height="100" fill="url(#art4Grad)" />
      <path d="M180 45 L195 45 L195 25 L215 25 L215 45 L235 35 L255 35 L255 45 L285 20 L300 20 L300 45 L320 45" stroke="#94a3b8" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M20 60 L140 60 L140 85 L260 85 L260 60 L320 60" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="80" cy="60" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
      <circle cx="200" cy="85" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
      <circle cx="290" cy="60" r="6" fill="#0369a1" stroke="#ffffff" strokeWidth="2" />
      <circle cx="80" cy="60" r="11" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
      <text x="24" y="44" fill="#0369a1" fontSize="9.5" fontWeight="800">Smart Grid Telemetry</text>
      <text x="24" y="80" fill="#0c4a6e" fontSize="8" fontWeight="600">Acoustic Leak Sensors &amp; Pressure Regulators</text>
    </svg>
  )
}

const ARTICLE_ARTWORKS = {
  1: ArticleArtwork1,
  2: ArticleArtwork2,
  3: ArticleArtwork3,
  4: ArticleArtwork4,
}

export default function Awareness() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = useMemo(() => {
    const set = new Set(SAMPLE_ARTICLES.map((a) => a.tag))
    return ['All', ...Array.from(set)]
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = { All: SAMPLE_ARTICLES.length }
    for (const a of SAMPLE_ARTICLES) {
      counts[a.tag] = (counts[a.tag] || 0) + 1
    }
    return counts
  }, [])

  const filteredArticles = useMemo(() => {
    return SAMPLE_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === 'All' || article.tag === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.source.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const scrollToArticles = () => {
    const el = document.getElementById('articles-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="container page-enter" style={{ paddingBlock: 'var(--space-8)' }}>
      {/* ── 1. Editorial Environmental Hero ─────────────────────── */}
      <section
        aria-labelledby="awareness-hero-heading"
        style={{
          background: 'linear-gradient(145deg, #091e3a 0%, #004d61 50%, #006064 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(var(--space-8), 5vw, var(--space-12))',
          marginBottom: 'var(--space-10)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Subtle Water Shimmer Gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            pointerEvents: 'none',
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(38, 198, 218, 0.4) 0%, transparent 40%),
                             radial-gradient(circle at 80% 70%, rgba(128, 222, 234, 0.3) 0%, transparent 50%)`,
          }}
          aria-hidden="true"
        />

        <div className="awareness-hero-grid" style={{ position: 'relative', zIndex: 1 }}>
          {/* Left Column: Heading, Context, and CTA */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-pill)',
                marginBottom: 'var(--space-4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <BookOpen size={14} aria-hidden="true" style={{ color: '#80deea' }} />
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-wider)',
                  textTransform: 'uppercase',
                  color: '#e0f7fa',
                }}
              >
                Groundwater Science &amp; Action
              </span>
            </div>

            <h1
              id="awareness-hero-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2rem, 4.5vw, var(--text-4xl))',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.15,
                margin: '0 0 var(--space-4) 0',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              Groundwater Awareness
            </h1>

            <p
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                color: 'rgba(255, 255, 255, 0.88)',
                margin: '0 0 var(--space-6) 0',
                maxWidth: '56ch',
              }}
            >
              Evidence-based articles about water conservation, groundwater science, and what you can do.
              All statistics are sourced from open datasets — no invented figures.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={scrollToArticles}
                className="btn btn-primary"
                style={{
                  background: '#26c6da',
                  color: 'var(--color-navy-900)',
                  borderColor: '#26c6da',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(38, 198, 218, 0.35)',
                }}
              >
                Explore the guides
                <ArrowDown size={16} aria-hidden="true" />
              </button>

              <Badge variant="sample" size="sm">
                Sample content — full dataset integration in Phase 5
              </Badge>
            </div>
          </div>

          {/* Right Column: Aquifer Artwork */}
          <div className="awareness-hero-art" style={{ display: 'flex', justifyContent: 'center' }}>
            <HeroAquiferArt />
          </div>
        </div>
      </section>

      {/* ── 2. Groundwater Statistics Strip ──────────────────────── */}
      <section aria-label="Groundwater key indicators">
        <div className="awareness-stats-grid">
          {[
            {
              value: '—',
              label: 'Districts with critical groundwater levels',
              note: 'India-WRIS (Phase 5)',
              icon: AlertTriangle,
              iconBg: '#fffbeb',
              iconColor: '#d97706',
            },
            {
              value: '—',
              label: 'Litres per capita per day, urban avg.',
              note: 'data.gov.in (Phase 5)',
              icon: Droplets,
              iconBg: 'var(--color-primary-50)',
              iconColor: 'var(--color-primary-600)',
            },
            {
              value: '—',
              label: 'Rivers monitored for water quality',
              note: 'CPCB Open Data (Phase 5)',
              icon: Activity,
              iconBg: 'var(--color-success-bg)',
              iconColor: 'var(--color-success)',
            },
          ].map(({ value, label, note, icon: StatIcon, iconBg, iconColor }) => (
            <div key={label} className="card interactive-card awareness-stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm)',
                    background: iconBg,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <StatIcon size={20} />
                </div>
                <Badge variant="sample" size="sm">
                  {note}
                </Badge>
              </div>

              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 800,
                    color: 'var(--color-primary-700)',
                    lineHeight: 1,
                    margin: '0 0 var(--space-1) 0',
                  }}
                  aria-label={`${label}: no data yet`}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    fontWeight: 500,
                    lineHeight: 'var(--leading-snug)',
                  }}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Filter & Search Controls ─────────────────────────── */}
      <section
        id="articles-section"
        aria-label="Filter and browse groundwater guides"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-8)',
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--surface-border)',
        }}
      >
        {/* Category Filter Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
          role="tablist"
          aria-label="Filter articles by category"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat)}
                className="btn btn-sm"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  padding: 'var(--space-2) var(--space-4)',
                  transition: 'all var(--duration-quick) var(--ease-standard)',
                  background: isSelected ? 'var(--color-primary-600)' : 'var(--surface-base)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  borderColor: isSelected ? 'var(--color-primary-600)' : 'var(--surface-border)',
                  boxShadow: isSelected ? '0 2px 8px rgba(0, 151, 167, 0.3)' : 'none',
                }}
              >
                {cat}{' '}
                <span style={{ opacity: isSelected ? 0.9 : 0.6, marginLeft: 4 }}>
                  ({categoryCounts[cat] || 0})
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Field */}
        <div
          style={{
            position: 'relative',
            minWidth: 240,
            maxWidth: 340,
            flex: 1,
          }}
        >
          <Search
            size={16}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="form-input"
            style={{
              paddingLeft: 'var(--space-8)',
              paddingRight: searchQuery ? 'var(--space-8)' : 'var(--space-3)',
              paddingBlock: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              borderRadius: 'var(--radius-pill)',
            }}
            aria-label="Search articles by title, description or source"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {/* ── 4. Empty Search State ──────────────────────────────── */}
      {filteredArticles.length === 0 && (
        <div
          style={{
            padding: 'var(--space-12) var(--space-6)',
            textAlign: 'center',
            background: 'var(--surface-base)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--surface-border)',
            maxWidth: 500,
            margin: 'var(--space-8) auto',
          }}
        >
          <Search
            size={36}
            aria-hidden="true"
            style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)', marginInline: 'auto' }}
          />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', margin: '0 0 var(--space-2) 0' }}>
            No articles found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            No articles matched &ldquo;{searchQuery}&rdquo; in category &ldquo;{selectedCategory}&rdquo;.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedCategory('All')
              setSearchQuery('')
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── 5. Responsive Articles Grid ─────────────────────────── */}
      <div className="awareness-articles-grid">
        {filteredArticles.map((article) => {
          const theme = TAG_THEMES[article.tag] || TAG_THEMES.Groundwater
          const ArtworkComponent = ARTICLE_ARTWORKS[article.id] || ArticleArtwork1

          return (
            <article
              key={article.id}
              className="card interactive-card awareness-article-card"
            >
              {/* Visual Header SVG Artwork */}
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <ArtworkComponent />
              </div>

              {/* Card Body */}
              <div
                style={{
                  padding: 'var(--space-5)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: theme.color,
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wider)',
                    }}
                  >
                    {article.tag}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {article.readTime}
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    lineHeight: 'var(--leading-snug)',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {article.title}
                </h2>

                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: 'var(--leading-relaxed)',
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {article.summary}
                </p>
              </div>

              {/* Card Footer */}
              <div
                className="card-footer"
                style={{
                  padding: 'var(--space-4) var(--space-5)',
                  background: 'var(--surface-raised)',
                  borderTop: '1px solid var(--surface-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                  }}
                >
                  <Droplets size={13} aria-hidden="true" style={{ color: 'var(--color-primary-600)' }} />
                  <span>Source: {article.source}</span>
                </div>

                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-primary-700)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                  aria-label={`Visit ${article.source} (opens in new tab)`}
                >
                  Visit source
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
