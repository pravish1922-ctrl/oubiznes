import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgNo = searchParams.get("orgNo");

  if (!orgNo) {
    return NextResponse.json({ error: "orgNo is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://onlinesearch.mns.mu/onlinesearch/viewCompanyDetails?orgNo=${orgNo}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          Referer: "https://onlinesearch.mns.mu/",
          Origin: "https://onlinesearch.mns.mu",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `MNS API error: ${res.status}` },
        { status: res.status }
      );
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
