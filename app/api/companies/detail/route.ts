import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgNo = searchParams.get("orgNo");

  if (!orgNo) {
    return NextResponse.json({ error: "orgNo is required" }, { status: 400 });
  }

  try {
    // MNS detail endpoint — POST with orgNo in body
    const res = await fetch(
      "https://onlinesearch.mns.mu/onlinesearch/viewCompanyDetails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://onlinesearch.mns.mu/",
          "Origin": "https://onlinesearch.mns.mu",
        },
        body: JSON.stringify({ orgNo: Number(orgNo) }),
      }
    );

    if (!res.ok) {
      // Fallback: try GET with query param
      const res2 = await fetch(
        `https://onlinesearch.mns.mu/onlinesearch/viewCompanyDetails?orgNo=${orgNo}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://onlinesearch.mns.mu/",
            "Origin": "https://onlinesearch.mns.mu",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (!res2.ok) {
        const text = await res2.text();
        return NextResponse.json(
          { error: `MNS API error: ${res2.status}`, detail: text },
          { status: res2.status }
        );
      }

      const data2 = await res2.json();
      return NextResponse.json(data2);
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("Detail fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
