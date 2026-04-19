import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number');
  if (!number) return NextResponse.json({ error: 'Missing company number' }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.opencorporates.com/v0.4/companies/mu/${encodeURIComponent(number)}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    const c = data.results?.company;
    if (!c) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    return NextResponse.json({
      name: c.name,
      company_number: c.company_number,
      current_status: c.current_status,
      incorporation_date: c.incorporation_date,
      company_type: c.company_type,
      registered_address_in_full: c.registered_address_in_full,
      opencorporates_url: c.opencorporates_url,
    });
  } catch (err) {
    return NextResponse.json({ error: 'OpenCorporates API error' }, { status: 500 });
  }
}
