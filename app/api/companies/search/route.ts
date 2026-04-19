import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    const res = await fetch(
      `https://cbrd.govmu.org/cbrd/SearchBusiness?searchValue=${encodeURIComponent(q)}&searchType=name`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OuBiznes/1.0; +https://oubiznes.mu)',
          'Accept': 'application/json, text/html',
        },
        next: { revalidate: 3600 }
      }
    );

    const text = await res.text();

    // Try JSON first
    try {
      const data = JSON.parse(text);
      const companies = Array.isArray(data) ? data : (data.results || data.companies || []);
      const results = companies.slice(0, 10).map((c: any) => ({
        name: c.businessName || c.name || c.companyName || '',
        company_number: c.brn || c.registrationNumber || c.companyNumber || '',
        current_status: c.status || c.businessStatus || '',
        incorporation_date: c.incorporationDate || c.registrationDate || '',
        company_type: c.businessType || c.companyType || '',
      }));
      return NextResponse.json({ results });
    } catch {
      // Not JSON — return empty so we can inspect and fix
      console.error('CBRD response:', text.slice(0, 500));
      return NextResponse.json({ results: [], debug: text.slice(0, 200) });
    }

  } catch (err) {
    return NextResponse.json({ error: 'Registry unavailable' }, { status: 500 });
  }
}
