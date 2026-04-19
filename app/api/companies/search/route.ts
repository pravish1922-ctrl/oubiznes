import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(q)}&jurisdiction_code=mu&per_page=10`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const results = (data.results?.companies || []).map(c => ({
      name: c.company.name,
      company_number: c.company.company_number,
      current_status: c.company.current_status,
      incorporation_date: c.company.incorporation_date,
      company_type: c.company.company_type,
    }));
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: 'OpenCorporates API error' }, { status: 500 });
  }
}
