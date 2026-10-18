/**
 * Awareness — Phase 1 stub
 * Groundwater education content from a static data array.
 * Real open-dataset articles seeded in Phase 5.
 */
import { BookOpen, ExternalLink, Droplets } from 'lucide-react'
import Badge from '../components/ui/Badge.jsx'

const SAMPLE_ARTICLES = [
  {
    id: 1,
    title: 'Why Groundwater Levels Are Falling Across India',
    summary: 'Urban growth, over-extraction for agriculture, and reduced recharge zones are major contributors. This article explores the mechanisms and regional variation.',
    tag: 'Groundwater',
    readTime: '5 min read',
    source: 'India-WRIS',
    sourceUrl: 'https://indiawris.gov.in/',
  },
  {
    id: 2,
    title: 'Rainwater Harvesting: How It Works and Why It Matters',
    summary: 'A step-by-step look at rooftop rainwater collection systems — how to build one, typical yields, and how they recharge groundwater tables.',
    tag: 'Conservation',
    readTime: '4 min read',
    source: 'data.gov.in',
    sourceUrl: 'https://data.gov.in/',
  },
  {
    id: 3,
    title: 'The Water Footprint of Common Foods',
    summary: 'Producing 1 kg of rice requires roughly 1,670 litres of water. Understanding the hidden water cost of diet choices is a first step to reducing it.',
    tag: 'Awareness',
    readTime: '3 min read',
    source: 'WFN.org',
    sourceUrl: 'https://waterfootprint.org/',
  },
  {
    id: 4,
    title: 'How Cities Can Reduce Non-Revenue Water Loss',
    summary: 'Up to 40% of municipal water supply is lost to leaks and metering errors before it reaches the consumer. Smart metering and citizen reporting are proven solutions.',
    tag: 'Urban Water',
    readTime: '6 min read',
    source: 'OpenStreetMap / OSM',
    sourceUrl: 'https://www.openstreetmap.org/',
  },
]

const TAG_COLORS = {
  'Groundwater':  'var(--color-primary-600)',
  'Conservation': 'var(--color-success)',
  'Awareness':    'var(--color-warning)',
  'Urban Water':  'var(--color-info)',
}

export default function Awareness() {
  return (
    <div className="container page-enter" style={{ paddingBlock: 'var(--space-12)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-10)', maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <BookOpen size={28} aria-hidden="true" style={{ color: 'var(--color-primary-600)' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', margin: 0 }}>Groundwater Awareness</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          Evidence-based articles about water conservation, groundwater science, and what you can do.
          All statistics are sourced from open datasets — no invented figures.
        </p>
        <Badge variant="sample" style={{ marginTop: 'var(--space-3)' }}>Sample content — full dataset integration in Phase 5</Badge>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-10)',
          padding: 'var(--space-5)',
          background: 'var(--color-primary-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-primary-100)',
        }}
      >
        {[
          { value: '—', label: 'Districts with critical groundwater levels', note: 'India-WRIS (Phase 5)' },
          { value: '—', label: 'Litres per capita per day, urban avg.', note: 'data.gov.in (Phase 5)' },
          { value: '—', label: 'Rivers monitored for water quality', note: 'CPCB Open Data (Phase 5)' },
        ].map(({ value, label, note }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-primary-700)', lineHeight: 1, marginBottom: 4 }}>
              {value}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
            <Badge variant="sample" size="sm">{note}</Badge>
          </div>
        ))}
      </div>

      {/* Articles grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        {SAMPLE_ARTICLES.map((article) => (
          <article key={article.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: TAG_COLORS[article.tag] || 'var(--color-primary-600)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wider)',
                  }}
                >
                  {article.tag}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{article.readTime}</span>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, lineHeight: 'var(--leading-snug)', color: 'var(--text-primary)', flex: 1 }}>
                {article.title}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {article.summary}
              </p>
            </div>

            <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <Droplets size={12} aria-hidden="true" style={{ color: 'var(--color-primary-600)' }} />
                Source: {article.source}
              </div>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-link)', textDecoration: 'none', fontWeight: 500 }}
                aria-label={`Visit ${article.source} (opens in new tab)`}
              >
                Visit source
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
