import { NextResponse } from "next/server";
import axios from "axios";

// Common head phrases for idea mining
const COMMON_HEADS = [
  "is there a tool for",
  "how can I automate",
  "what's the best way to",
  "looking for a solution to",
  "need help with",
  "tired of",
  "wish there was a",
  "is there an app that",
];

// Time range to Google's dateRestrict parameter mapping
const TIME_RANGE_MAP = {
  "1 week": "w1",
  "1 month": "m1",
  "6 months": "m6",
  "1 year": "y1",
};

interface SearchResult {
  headPhrase: string;
  tailPhrase: string;
  snippet: string;
  link: string;
  source: string;
  date: string;
  relevance: number;
}

interface GroupedIdea {
  headPhrase: string;
  tailPhrase: string;
  count: number;
  examples: SearchResult[];
}

interface GoogleSearchItem {
  title?: string;
  snippet?: string;
  link?: string;
  pagemap?: {
    metatags?: Array<{
      "article:published_time"?: string;
      "og:updated_time"?: string;
      date?: string;
      "last-modified"?: string;
      datePublished?: string;
      dateModified?: string;
    }>;
  };
}

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Google API key is not configured" },
        { status: 500 }
      );
    }
    if (!process.env.GOOGLE_SEARCH_ENGINE_ID) {
      return NextResponse.json(
        { error: "Google Search Engine ID is not configured" },
        { status: 500 }
      );
    }

    const {
      timeRange = "6 months",
      maxResults = 10,
      headPhrases = COMMON_HEADS,
      sites = [],
    } = await request.json();

    // Validate time range
    if (!TIME_RANGE_MAP[timeRange as keyof typeof TIME_RANGE_MAP]) {
      return NextResponse.json(
        { error: "Invalid time range" },
        { status: 400 }
      );
    }

    // Fetch results for all head phrases in parallel
    const searchPromises = headPhrases.map(async (head: string) => {
      let searchQuery = head;

      // Add site filtering if sites are specified
      if (sites.length > 0) {
        // Take only first 3 sites to avoid query length issues
        const limitedSites = sites.slice(0, 3);
        const siteFilter = limitedSites
          .map((site: string) => `site:${site}`)
          .join(" OR ");
        searchQuery = `${searchQuery} (${siteFilter})`;
      }

      const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
      searchUrl.searchParams.append("key", process.env.GOOGLE_API_KEY!);
      searchUrl.searchParams.append("cx", process.env.GOOGLE_SEARCH_ENGINE_ID!);
      searchUrl.searchParams.append("q", searchQuery);
      searchUrl.searchParams.append(
        "dateRestrict",
        TIME_RANGE_MAP[timeRange as keyof typeof TIME_RANGE_MAP]
      );
      searchUrl.searchParams.append("num", maxResults.toString());

      console.log("Search URL:", searchUrl.toString()); // Debug log

      const response = await fetch(searchUrl.toString());
      if (!response.ok) {
        const error = await response.json();
        console.error("Google API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: error,
          url: searchUrl.toString(),
        });
        throw new Error(
          error.error?.message || "Failed to fetch search results"
        );
      }
      return response.json();
    });

    const searchResults = await Promise.all(searchPromises);
    const allResults = searchResults.flatMap(
      (result) => result.items || []
    ) as GoogleSearchItem[];

    // Process and group results
    const processedResults = allResults.map((item) => {
      const title = item.title || "";
      const snippet = item.snippet || "";
      const link = item.link || "";
      const source = new URL(link).hostname;

      // Enhanced date extraction
      let date = "";
      if (item.pagemap?.metatags?.[0]) {
        const metatags = item.pagemap.metatags[0];
        date =
          metatags["article:published_time"] ||
          metatags["og:updated_time"] ||
          metatags["date"] ||
          metatags["last-modified"] ||
          metatags["datePublished"] ||
          metatags["dateModified"] ||
          "";
      }

      // If no date in metatags, try to extract from snippet
      if (!date) {
        const dateMatch =
          snippet.match(
            /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i
          ) ||
          snippet.match(/(\d{1,2}\/\d{1,2}\/\d{4})/) ||
          snippet.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          date = dateMatch[1];
        }
      }

      // Extract head and tail phrases
      const headPhrase =
        headPhrases.find(
          (h: string) =>
            title.toLowerCase().includes(h.toLowerCase()) ||
            snippet.toLowerCase().includes(h.toLowerCase())
        ) || headPhrases[0];

      const tailPhrase = title
        .toLowerCase()
        .replace(headPhrase.toLowerCase(), "")
        .replace(/^[^a-zA-Z0-9]+/, "")
        .trim();

      return {
        headPhrase,
        tailPhrase,
        snippet,
        link,
        source,
        date,
        relevance: calculateRelevance(snippet, headPhrase),
      };
    });

    // Group similar ideas using groupSimilarTails instead
    const groupedIdeas = groupSimilarTails(processedResults);

    return NextResponse.json({
      results: processedResults,
      groupedIdeas,
      totalResults: processedResults.length,
      timeRange,
      commonHeads: COMMON_HEADS,
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Utility function to fetch and process results from PSE
async function fetchFromPSE(
  headPhrase: string,
  timeRange: string,
  maxResults: number
) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.SEARCH_ENGINE_ID;

  // Debug logging
  console.log("Environment variables:", {
    hasApiKey: !!apiKey,
    hasSearchEngineId: !!cx,
    apiKeyLength: apiKey?.length,
    searchEngineIdLength: cx?.length,
  });

  if (!apiKey || !cx) {
    console.error("Missing credentials:", {
      apiKey: apiKey ? "present" : "missing",
      cx: cx ? "present" : "missing",
    });
    throw new Error(
      "Missing API credentials. Please check your environment variables."
    );
  }

  // Normalize the head phrase to match common patterns
  const normalizedHead = normalizeHeadPhrase(headPhrase);
  const query = encodeURIComponent(`"${normalizedHead}"`);
  const dateRestrict = TIME_RANGE_MAP[timeRange as keyof typeof TIME_RANGE_MAP];
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&dateRestrict=${dateRestrict}&num=${maxResults}`;

  try {
    const res = await axios.get(url);

    if (!res.data.items) {
      console.warn(`No items found for query: ${normalizedHead}`);
      return { results: [], totalResults: 0 };
    }

    // Process and analyze results
    const processedResults = res.data.items.map((item: any) => {
      const snippet = item.snippet;
      const tail = extractTailPhrase(snippet, normalizedHead);

      return {
        headPhrase: normalizedHead,
        tailPhrase: tail,
        snippet,
        link: item.link,
        source: item.displayLink,
        date: extractDate(item),
        relevance: calculateRelevance(snippet, normalizedHead),
      };
    });

    return {
      results: processedResults,
      totalResults: res.data.searchInformation?.totalResults || 0,
    };
  } catch (error: any) {
    console.error(
      `Error in fetchFromPSE for "${normalizedHead}":`,
      error.message
    );
    throw error;
  }
}

// Normalize head phrase to match common patterns
function normalizeHeadPhrase(phrase: string): string {
  const lowerPhrase = phrase.toLowerCase().trim();

  // Check if the phrase starts with any common head
  const matchingHead = COMMON_HEADS.find((head) =>
    lowerPhrase.startsWith(head.toLowerCase())
  );

  return matchingHead || phrase;
}

// Extract the tail phrase after the head phrase
function extractTailPhrase(snippet: string, headPhrase: string): string {
  const lowerSnippet = snippet.toLowerCase();
  const lowerHead = headPhrase.toLowerCase();
  const tail = lowerSnippet.split(lowerHead)[1]?.trim() || "";
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

// Try to extract date from the result
function extractDate(item: any): Date {
  try {
    // Try to get date from metatags
    const date =
      item.pagemap?.metatags?.[0]?.["article:published_time"] ||
      item.pagemap?.metatags?.[0]?.["og:updated_time"];
    return date ? new Date(date) : new Date();
  } catch {
    return new Date();
  }
}

// Calculate relevance score for the result
function calculateRelevance(snippet: string, headPhrase: string): number {
  const lowerSnippet = snippet.toLowerCase();
  const lowerHead = headPhrase.toLowerCase();

  // Check if head phrase appears in the snippet
  if (!lowerSnippet.includes(lowerHead)) return 0;

  // Calculate relevance based on position and length
  const position = lowerSnippet.indexOf(lowerHead);
  const positionScore = 1 - position / lowerSnippet.length;

  return positionScore;
}

// Group similar tail phrases
function groupSimilarTails(results: any[]): any[] {
  const groups = new Map<string, any[]>();

  results.forEach((result) => {
    const tail = result.tailPhrase.toLowerCase();
    if (!groups.has(tail)) {
      groups.set(tail, []);
    }
    groups.get(tail)?.push(result);
  });

  return Array.from(groups.entries())
    .map(([tail, items]) => ({
      tailPhrase: tail,
      count: items.length,
      examples: items,
    }))
    .sort((a, b) => b.count - a.count);
}
