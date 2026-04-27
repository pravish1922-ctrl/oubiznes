"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, Search, ExternalLink, RotateCcw } from "lucide-react";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

export default function BRNLookup() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [enriched, setEnriched] = useState(null);
  const [enrichedLoading, setEnrichedLoading] = useState(false);
  const [enrichedError, setEnrichedError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    setSelected(null);
    setEnriched(null);
    setEnrichedError(false);
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.error) {
        setError("failed");
      } else {
        setResults(data.results || []);
      }
    } catch {
      setError("failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(company) {
    setSelected(company);
    setEnriched(null);
    setEnrichedError(false);
    if (!company.orgNo) return;
    setEnrichedLoading(true);
    try {
      const res = await fetch(`/api/companies/detail?orgNo=${encodeURIComponent(company.orgNo)}`);
      const data = await res.json();
      if (data.error) {
        setEnrichedError(true);
      } else {
        setEnriched(data);
      }
    } catch {
      setEnrichedError(true);
    } finally {
      setEnrichedLoading(false);
    }
  }

  function reset() {
    setQuery("");
    setResults(null);
    setSelected(null);
    setEnriched(null);
    setEnrichedError(false);
    setError("");
  }

  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", colorScheme: "light", minHeight: "100vh" }}>
      {/* Flag bar */}
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
              <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>BRN Lookup</span>
            </div>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
              <RotateCcw size={14} /> Reset
            </button>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: NAVY, border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
              <Home size={14} /> Home
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
          <span style={{ display: "block" }}>Mauritian Company</span>
          <span style={{ display: "block", color: CORAL }}>BRN Lookup</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 28 }}>
          Search any Mauritius-registered company by name or BRN number. Powered by the official Mauritius company registry.
        </p>

        {/* Search form */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Company name or BRN number..."
              style={{ width: "100%", padding: "13px 14px 13px 40px", fontSize: 15, border: "2px solid #e5e7eb", borderRadius: 12, outline: "none", color: NAVY, boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = CORAL)}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{ padding: "13px 22px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading || !query.trim() ? "not-allowed" : "pointer", opacity: loading || !query.trim() ? 0.6 : 1, whiteSpace: "nowrap" }}
          >
            {loading ? "..." : "Search"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#dc2626", fontSize: 14 }}>
            Search failed. Please try again.
          </div>
        )}

        {/* Selected company detail */}
        {selected && (
          <div style={{ background: "#fff", border: `2px solid ${CORAL}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: 0 }}>{selected.name}</h2>
              <button onClick={() => { setSelected(null); setEnriched(null); setEnrichedError(false); }} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", marginLeft: 12, whiteSpace: "nowrap" }}>
                ← Back to results
              </button>
            </div>

            {/* Core fields — always available from search result */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "File Number / BRN", value: selected.company_number },
                { label: "Status", value: selected.current_status || "—" },
                { label: "Nature", value: selected.company_type || "—" },
                { label: "Category", value: selected.category || "—" },
                { label: "Incorporated", value: selected.incorporation_date || "—" },
                { label: "Jurisdiction", value: "Mauritius 🇲🇺" },
              ].map(row => (
                <div key={row.label} style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Enriched detail — from PDF detail API */}
            {enrichedLoading && (
              <div style={{ marginTop: 20, textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "12px 0" }}>
                Loading full details…
              </div>
            )}

            {enrichedError && (
              <div style={{ marginTop: 16, fontSize: 13, color: "#9ca3af" }}>
                Full details available on the{" "}
                <a href={`https://onlinesearch.mns.mu/?q=${encodeURIComponent(selected.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline" }}>
                  official registry
                </a>.
              </div>
            )}

            {enriched && !enrichedLoading && (
              <div style={{ marginTop: 20 }}>
                {/* Registered Address */}
                {enriched.registeredAddress && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ background: "#1a2332", color: "#fff", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: "6px 6px 0 0", letterSpacing: "0.05em" }}>
                      REGISTERED ADDRESS
                    </div>
                    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 6px 6px", padding: "10px 12px", fontSize: 14, color: NAVY, fontWeight: 500 }}>
                      {enriched.registeredAddress}
                    </div>
                  </div>
                )}

                {/* Business Activities */}
                {enriched.natureOfBusiness && enriched.natureOfBusiness.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ background: "#1a2332", color: "#fff", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: "6px 6px 0 0", letterSpacing: "0.05em" }}>
                      BUSINESS ACTIVITIES
                    </div>
                    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 6px 6px", padding: "10px 12px" }}>
                      {enriched.natureOfBusiness.map((act, i) => (
                        <div key={i} style={{ fontSize: 14, color: NAVY, fontWeight: 500, padding: "3px 0", borderBottom: i < enriched.natureOfBusiness.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          {act}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Office Bearers */}
                {enriched.officeBearers && enriched.officeBearers.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ background: "#1a2332", color: "#fff", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: "6px 6px 0 0", letterSpacing: "0.05em" }}>
                      DIRECTORS &amp; OFFICERS
                    </div>
                    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 6px 6px", padding: "4px 12px" }}>
                      {enriched.officeBearers.map((b, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < enriched.officeBearers.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{b.name}</span>
                            <span style={{ marginLeft: 8, fontSize: 12, background: "#e0f2f1", color: "#0D9488", fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
                              {b.position}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>
                            {b.appointedDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <a
                href="https://onlinesearch.mns.mu/onlinesearch/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: CORAL, fontWeight: 600, textDecoration: "underline" }}
              >
                View on official registry <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}

        {/* Search results */}
        {results && !selected && (
          <>
            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                No companies found. Try a different name or BRN.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </p>
                {results.map(c => (
                  <button
                    key={c.company_number}
                    onClick={() => handleSelect(c)}
                    style={{
                      textAlign: "left", background: "#fff", border: "1.5px solid #e5e7eb",
                      borderRadius: 12, padding: "14px 18px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = CORAL)}
                    onMouseOut={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                        BRN: {c.company_number} · {c.current_status || "Status unknown"}
                      </div>
                    </div>
                    <span style={{ color: "#d1d5db", fontSize: 18, flexShrink: 0, marginLeft: 12 }}>→</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 28, background: "#f9fafb", borderRadius: 12, padding: "14px 18px" }}>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Data from the official Mauritius company registry.{" "}
            <a href="https://onlinesearch.mns.mu" target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 2 }}>
              Search on onlinesearch.mns.mu <ExternalLink size={11} />
            </a>. 🇲🇺
          </p>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
