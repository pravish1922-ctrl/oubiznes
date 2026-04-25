import { NextRequest, NextResponse } from "next/server";

async function callGemini(model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  if (res.status === 429) {
    return { text: "", rateLimited: true, error: null };
  }
  if (!res.ok) {
    console.error(`Gemini API error (${model}):`, data);
    return { text: "", rateLimited: false, error: data.error?.message || "Failed to generate plan" };
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    return { text: "", rateLimited: false, error: "No response from Gemini" };
  }
  return { text, rateLimited: false, error: null };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    const prompt = `You are a business consultant specializing in Mauritian SMEs. Generate a professional business plan based on the following information:

Business Name: ${formData.name}
Owner: ${formData.owner}
Sector: ${formData.sector}
Location: ${formData.location}
Description: ${formData.description}

Market:
- Target customers: ${formData.targetCustomers}
- Competitors: ${formData.competitors}
- Customer acquisition: ${formData.customerAcquisition}

Operations:
- Employees planned: ${formData.employees}
- Key suppliers/partners: ${formData.suppliers}
- Challenges: ${formData.challenges}

Financials:
- Startup costs: Rs ${formData.startupCost}
- Year 1 revenue target: Rs ${formData.year1Revenue}
- Funding needed: ${formData.fundingNeeded ? `Rs ${formData.fundingAmount}` : "No"}

Export plans: ${formData.exportPlans ? "Yes - " + formData.exportDetails : "No"}

Create a structured business plan with these sections (use markdown formatting with ## for section headers):
1. Executive Summary (2-3 sentences)
2. Business Description
3. Market Analysis (Mauritius context)
4. Competitive Advantage
5. Operations & Implementation Plan
6. Financial Projections & Sustainability
7. Funding Requirements & Relevant Grants (mention SME Mauritius, TINNS, ICDS if applicable)

Make it practical, Mauritius-focused, and ready for bank/investor review. Reference MRA compliance and local regulations where relevant.`;

    const result = await callGemini("gemini-2.5-flash", prompt);

    if (result.rateLimited) {
      console.warn("gemini-2.5-flash rate limited, falling back to gemini-3.1-flash-lite-preview");
      const fallback = await callGemini("gemini-3.1-flash-lite-preview", prompt);
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error }, { status: 500 });
      }
      return NextResponse.json({ plan: fallback.text });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ plan: result.text });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
