export async function POST(request) {
  try {
    const { text, headline, url } = await request.json();

    if (!text && !headline && !url) {
      return Response.json(
        { error: "Please provide URL, text, or headline" },
        { status: 400 }
      );
    }

    let contentToAnalyze = headline || text;

    // If URL is provided, fetch the content
    if (url) {
      try {
        const urlResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!urlResponse.ok) {
          return Response.json(
            { error: "Failed to fetch content from URL" },
            { status: 400 }
          );
        }

        const html = await urlResponse.text();
        
        // Extract text content from HTML (basic extraction)
        const textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        contentToAnalyze = textContent.substring(0, 3000); // Limit to first 3000 chars
      } catch (urlError) {
        console.error("Error fetching URL:", urlError);
        return Response.json(
          { error: "Failed to fetch or parse URL content" },
          { status: 400 }
        );
      }
    }
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert fake news detection system. Analyze the provided content (headline or article) and determine if it's likely fake news, real news, or uncertain.

For headlines alone: Look for red flags like sensationalism, clickbait patterns, emotional manipulation, implausible claims, and lack of credible source indicators. Be decisive - only mark as "Uncertain" if truly ambiguous.

For full articles: Analyze writing quality, source citations, factual consistency, bias, and credibility indicators.

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "Likely Fake" | "Likely Real" | "Uncertain",
  "confidence": <number between 60-95>,
  "reasons": [<array of 2-4 specific, actionable reasons as strings>]
}

Key indicators of FAKE news:
- Sensational/clickbait language ("SHOCKING", "You won't believe")
- Emotional manipulation and fear-mongering
- Implausible or extraordinary claims without evidence
- Poor grammar or unprofessional writing
- Lack of credible sources or attribution
- Conspiracy theory language
- Extreme bias or one-sided narrative

Key indicators of REAL news:
- Professional, neutral tone
- Credible source attribution
- Balanced perspective
- Verifiable facts and data
- Proper grammar and structure
- Reasonable, plausible claims

Only use "Uncertain" when the content is genuinely ambiguous or needs more context to determine credibility.`,
          },
          {
            role: "user",
            content: contentToAnalyze,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { message: "Unknown error" };
      }
      console.error("OpenAI API error:", error);
      return Response.json(
        { error: "Failed to analyze content" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content.trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error("Failed to parse AI response:", analysisText);
      return Response.json(
        { error: "Invalid response from AI" },
        { status: 500 }
      );
    }

    const verdictColors = {
      "Likely Fake": {
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      },
      "Likely Real": {
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      },
      Uncertain: {
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      },
    };

    const colors = verdictColors[analysis.verdict] || verdictColors["Uncertain"];

    return Response.json({
      ...analysis,
      ...colors,
    });
  } catch (error) {
    console.error("Error in detect API:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
