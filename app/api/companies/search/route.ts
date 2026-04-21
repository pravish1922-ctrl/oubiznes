import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  try {
    const res = await fetch('https://onlinesearch.mns.mu/onlinesearch/company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://onlinesearch.mns.mu',
        'Referer': 'https://onlinesearch.mns.mu/',
      },
      body: JSON.stringify({
        mainOption: 'companyName',
        searchValue: q,
        dateIncorporatedFrom: null,
        dateIncorporatedTo: null,
        pageNumber: 0,
        pageSize: 10,
        sortBy: 'ORG_NAME',
        sortOrder: 'ASC',
      }),
    });
    const data = await res.json();
    const results = (data.result || []).map((c: any) => ({
      orgNo: c.orgNo,                        // ← added
      name: c.companyName,
      company_number: c.fileNumber,
      current_status: c.status,
      incorporation_date: c.incorporationDate,
      company_type: c.nature,
      category: c.category,
    }));
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] });
  }
}
