import { NextRequest, NextResponse } from "next/server";

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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Failed to generate plan" },
        { status: response.status }
      );
    }

    if (data.content && data.content[0] && data.content[0].type === "text") {
      return NextResponse.json({ plan: data.content[0].text });
    } else {
      return NextResponse.json(
        { error: "No response from Claude" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
