"use client";
import Link from 'next/link'

const NAVY = '#0A1628'
const CORAL = '#E94F37'
const GOLD = '#F4C430'
const GREEN = '#0F7B3F'
const BLUE = '#1E5AA0'

const tools = [
  {
    group: 'Funding & Growth',
    items: [
      { href: '/grants', label: 'Grants Finder', desc: 'Find every SME scheme you qualify for', emoji: '💰' },
      { href: '/apply', label: 'Grant Application Generator', desc: 'AI-drafted application letter in minutes', emoji: '📝' },
    ],
  },
  {
    group: 'Compliance & Operations',
    items: [
      { href: '/calendar', label: 'Compliance Calendar', desc: 'Every MRA deadline for 2026', emoji: '📅' },
      { href: '/vat', label: 'VAT Calculator', desc: 'MRA VAT at 15% — invoice in, breakdown out', emoji: '🧮' },
      { href: '/paye', label: 'PAYE Calculator', desc: 'Employee net pay + CSG/NSF/FSC', emoji: '💼' },
    ],
  },
  {
    group: 'Business Setup',
    items: [
      { href: '/lookup', label: 'BRN Lookup', desc: 'Search any Mauritian registered company', emoji: '🔍' },
    ],
  },
]

export default function Home() {
  return (
    <div style={{ background: 'linear-gradient(to bottom, #FAF5EE, #fff)', colorScheme: 'light', minHeight: '100vh' }}>
      {/* Flag bar */}
      <div style={{ height: 8, display: 'flex' }}>
        <div style={{ flex: 1, background: CORAL }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: 20, color: CORAL }}>OuBiznes</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: NAVY }}>.mu</span>
        </div>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Ou biznes, nou lafors.</span>
      </header>

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 32px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: NAVY, marginBottom: 12, lineHeight: 1.2 }}>
          <span style={{ display: 'block' }}>Free tools for</span>
          <span style={{ display: 'block', color: CORAL }}>Mauritian businesses.</span>
        </h1>
        <p style={{ fontSize: 17, color: '#4b5563', maxWidth: 560 }}>
          Find grants, track MRA deadlines, calculate VAT and PAYE — all free, built in Mauritius 🇲🇺
        </p>
      </div>

      {/* Tool groups */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 64px' }}>
        {tools.map(group => (
          <div key={group.group} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              {group.group}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {group.items.map(tool => (
                <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 14,
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'border-color 0.15s',
                    cursor: 'pointer',
                  }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = CORAL)}
                    onMouseOut={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <span style={{ fontSize: 28 }}>{tool.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: 16 }}>{tool.label}</div>
                      <div style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }}>{tool.desc}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: '#d1d5db', fontSize: 20 }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#9ca3af' }}>
          © 2026 OuBiznes.mu · Built in Mauritius 🇲🇺 ·{' '}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL }}>Contact us</a>
        </p>
      </footer>
    </div>
  )
}
