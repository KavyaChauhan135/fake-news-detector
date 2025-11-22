import * as cheerio from 'cheerio';

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

    if (url) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const urlResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!urlResponse.ok) {
          return Response.json(
            { error: "Failed to fetch content from URL" },
            { status: 400 }
          );
        }

        const html = await urlResponse.text();
        const $ = cheerio.load(html);
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';

        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('header').remove();
        $('footer').remove();
        
        const textContent = $('body').text()
          .replace(/\s+/g, ' ')
          .trim();
        
        contentToAnalyze = `Source: ${domain}\nTitle: ${title}\n\n${description}\n\n${textContent.substring(0, 2500)}`;
      } catch (urlError) {
        console.error("Error fetching URL:", urlError);
        
        let errorMessage = "Failed to fetch or parse URL content";
        if (urlError.name === 'AbortError') {
          errorMessage = "Request timeout - the website took too long to respond";
        } else if (urlError.message.includes('Invalid URL')) {
          errorMessage = "Invalid URL format";
        }
        
        return Response.json(
          { error: errorMessage },
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
            content: `You are an expert fake news detection system. Analyze the provided content and determine if it's likely fake news, real news, or uncertain.

IMPORTANT: Consider the source domain when provided. Established news organizations (BBC, Reuters, AP, CNN, Times of India, The Guardian, etc.) are generally credible unless the content itself shows clear manipulation.

For URL-based analysis: Consider both the source domain reputation AND the content quality.
For manual input: Focus on content analysis only.

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "Likely Fake" | "Likely Real" | "Uncertain",
  "confidence": <number between 60-95>,
  "reasons": [<array of 2-4 specific, actionable reasons as strings>]
}

Key indicators of FAKE news:
- Unknown or suspicious source domains
- Sensational/clickbait language ("SHOCKING", "You won't believe")
- Emotional manipulation and fear-mongering
- Implausible or extraordinary claims without evidence
- Poor grammar or unprofessional writing
- Lack of credible sources or attribution
- Conspiracy theory language
- Extreme bias or one-sided narrative

Key indicators of REAL news:
- Established, reputable news organization
- Professional, neutral tone
- Credible source attribution
- Balanced perspective
- Verifiable facts and data
- Proper grammar and structure
- Reasonable, plausible claims
- Multiple sources cited

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
