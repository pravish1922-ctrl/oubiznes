import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
   const apiKey = process.env.OPENCORPORATES_API_KEY;
   const url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(q)}&jurisdiction_code=mu&per_page=10${apiKey ? `&api_token=${apiKey}` : ''}`;
   const res = await fetch(url, { next: { revalidate: 3600 } });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error || `OpenCorporates error ${res.status}`;
      return NextResponse.json({ error: msg, status: res.status }, { status: 502 });
    }

    const results = (data.results?.companies || []).map(c => ({
      name: c.company.name,
      company_number: c.company.company_number,
      current_status: c.company.current_status,
      incorporation_date: c.company.incorporation_date,
      company_type: c.company.company_type,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: 'OpenCorporates unreachable' }, { status: 500 });
  }
}
