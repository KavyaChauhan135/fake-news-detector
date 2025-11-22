// Import cheerio for easy HTML parsing (no complex regex needed)
import * as cheerio from 'cheerio';

// This API endpoint handles fake news detection requests
export async function POST(request) {
  try {
    // Step 1: Get the data sent from the frontend (URL, headline, or article text)
    const { text, headline, url } = await request.json();

    // Step 2: Check if user provided at least one input
    if (!text && !headline && !url) {
      return Response.json(
        { error: "Please provide URL, text, or headline" },
        { status: 400 }
      );
    }

    // Step 3: Start with headline or text if provided
    let contentToAnalyze = headline || text;

    // Step 4: If user provided a URL, fetch the article from that URL
    if (url) {
      try {
        // Step 4a: Extract the domain name (e.g., "bbc.com" from "https://bbc.com/article")
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        // Step 4b: Fetch the webpage HTML with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const urlResponse = await fetch(url, {
          headers: {
            // Pretend to be a browser so websites don't block us
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if the fetch was successful
        if (!urlResponse.ok) {
          return Response.json(
            { error: "Failed to fetch content from URL" },
            { status: 400 }
          );
        }

        // Step 4c: Get the HTML content as text
        const html = await urlResponse.text();
        
        // Step 4d: Use cheerio to parse HTML (easier than regex)
        const $ = cheerio.load(html);
        
        // Step 4e: Extract the page title (what shows in browser tab)
        const title = $('title').text().trim();

        // Step 4f: Extract the meta description (summary of the article)
        const description = $('meta[name="description"]').attr('content') || '';

        // Step 4g: Remove unwanted elements (scripts, styles, nav, header, footer)
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('header').remove();
        $('footer').remove();
        
        // Step 4h: Get just the text content (no HTML tags)
        const textContent = $('body').text()
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .trim();               // Remove leading/trailing spaces
        
        // Step 4i: Combine everything into one text for analysis
        contentToAnalyze = `Source: ${domain}\nTitle: ${title}\n\n${description}\n\n${textContent.substring(0, 2500)}`;
      } catch (urlError) {
        console.error("Error fetching URL:", urlError);
        
        // Provide specific error messages
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
    
    // Step 5: Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;

    // Check if API key exists
    if (!apiKey) {
      return Response.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Step 6: Send the content to OpenAI for analysis
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use GPT-4o-mini model (fast and cost-effective)
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
        temperature: 0.3,  // Lower temperature = more focused and consistent responses
        max_tokens: 500,   // Limit response length
      }),
    });

    // Step 7: Check if OpenAI request was successful
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

    // Step 8: Get the AI's response
    const data = await response.json();
    const analysisText = data.choices[0].message.content.trim();
    
    // Step 9: Parse the AI's JSON response
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

    // Step 10: Add colors based on the verdict (Fake = red, Real = green, Uncertain = yellow)
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

    // Step 11: Send the final result back to the frontend
    return Response.json({
      ...analysis,  // verdict, confidence, reasons
      ...colors,    // color, bgColor, borderColor
    });
  } catch (error) {
    // If anything goes wrong, return an error
    console.error("Error in detect API:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
