"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

// Common sites to search
const COMMON_SITES = [
  { id: "reddit.com", name: "Reddit", icon: "🔴" },
  { id: "quora.com", name: "Quora", icon: "❓" },
  { id: "twitter.com", name: "X (Twitter)", icon: "𝕏" },
  { id: "medium.com", name: "Medium", icon: "📝" },
  { id: "stackoverflow.com", name: "Stack Overflow", icon: "💻" },
  { id: "producthunt.com", name: "Product Hunt", icon: "🚀" },
  { id: "indiehackers.com", name: "Indie Hackers", icon: "💡" },
  { id: "dev.to", name: "Dev.to", icon: "👨‍💻" },
];

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
  tailPhrase: string;
  count: number;
  examples: SearchResult[];
}

interface SearchResponse {
  results: SearchResult[];
  groupedIdeas: GroupedIdea[];
  totalResults: number;
  timeRange: string;
  commonHeads: string[];
}

// Function to extract date from snippet
function extractDateFromSnippet(snippet: string): string {
  // Common date patterns in snippets
  const datePatterns = [
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(?:posted|published|updated)\s+on\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return "";
}

export default function Home() {
  const [timeRange, setTimeRange] = useState("6 months");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(
    COMMON_HEADS.slice(0, 3)
  );
  const [selectedSites, setSelectedSites] = useState<string[]>(
    COMMON_SITES.map((site) => site.id)
  );

  // Initialize patterns when results are received
  useEffect(() => {
    if (searchResults?.commonHeads && selectedPatterns.length === 0) {
      setSelectedPatterns(searchResults.commonHeads);
    }
  }, [searchResults, selectedPatterns.length]);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeRange,
          maxResults: 10,
          headPhrases: selectedPatterns,
          sites: selectedSites,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data = await res.json();
      setSearchResults(data);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePattern = (pattern: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(pattern)
        ? prev.filter((p) => p !== pattern)
        : [...prev, pattern]
    );
  };

  const toggleSite = (siteId: string) => {
    setSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((s) => s !== siteId)
        : [...prev, siteId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Idea Miner
        </h1>

        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 mb-8 border border-gray-700">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="timeRange"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Time Range
              </label>
              <select
                id="timeRange"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="1 week">Last Week</option>
                <option value="1 month">Last Month</option>
                <option value="6 months">Last 6 Months</option>
                <option value="1 year">Last Year</option>
              </select>
            </div>

            {/* Search Patterns Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Patterns
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_HEADS.map((pattern, index) => (
                  <button
                    key={index}
                    onClick={() => togglePattern(pattern)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedPatterns.includes(pattern)
                        ? "bg-blue-500 text-white border border-blue-400"
                        : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                    }`}
                  >
                    {pattern}
                  </button>
                ))}
              </div>
            </div>

            {/* Sites Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Sites
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SITES.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => toggleSite(site.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedSites.includes(site.id)
                        ? "bg-purple-500 text-white border border-purple-400"
                        : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                    }`}
                  >
                    <span>{site.icon}</span>
                    <span>{site.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={
                isLoading ||
                selectedPatterns.length === 0 ||
                selectedSites.length === 0
              }
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Mining Ideas...
                </span>
              ) : (
                "Start Mining Ideas"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-xl mb-6"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {searchResults && (
          <div className="space-y-8">
            {/* Summary Section */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 text-gray-100">
                Search Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Total Results</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">
                    {searchResults.totalResults}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Time Range</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">
                    {searchResults.timeRange}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Unique Ideas</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">
                    {searchResults.groupedIdeas.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Patterns Used */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 text-gray-100">
                Search Patterns Used
              </h2>
              <div className="flex flex-wrap gap-3">
                {selectedPatterns.map((pattern, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded-full border border-gray-600 hover:bg-gray-600 transition-colors duration-200"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>

            {/* Sites Searched */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 text-gray-100">
                Sites Searched
              </h2>
              <div className="flex flex-wrap gap-3">
                {selectedSites.map((siteId) => {
                  const site = COMMON_SITES.find((s) => s.id === siteId);
                  return (
                    <span
                      key={siteId}
                      className="bg-gray-700 text-gray-200 text-sm font-medium px-4 py-2 rounded-full border border-gray-600 hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <span>{site?.icon}</span>
                      <span>{site?.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Top Ideas Section */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 text-gray-100">
                Top Trending Ideas
              </h2>
              <div className="space-y-8">
                {searchResults.groupedIdeas.map((idea, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-700 pb-8 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-medium text-gray-100">
                          <span className="text-gray-300">
                            {idea.examples[0].tailPhrase}
                          </span>
                        </h3>
                        <span className="bg-blue-500/20 text-blue-400 text-sm font-medium px-3 py-1 rounded-full border border-blue-500/30 whitespace-nowrap">
                          {idea.count} mentions
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {idea.examples.slice(0, 2).map((example, idx) => (
                        <a
                          key={idx}
                          href={example.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-gray-700/50 p-4 rounded-xl border border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 cursor-pointer group"
                        >
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {example.snippet
                              .split(example.headPhrase)
                              .map((part, i, arr) => (
                                <span key={i}>
                                  {i > 0 && (
                                    <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                      {example.headPhrase}
                                    </span>
                                  )}
                                  {part}
                                </span>
                              ))}
                          </p>
                          <div className="mt-3 flex items-center text-xs text-gray-400">
                            <span className="bg-gray-600 px-2 py-1 rounded-full">
                              {example.source}
                            </span>
                            {example.date && example.date !== "" && (
                              <>
                                <span className="mx-2">•</span>
                                <span>
                                  {new Date(
                                    example.date
                                  ).toLocaleDateString() === "Invalid Date"
                                    ? example.date
                                    : new Date(
                                        example.date
                                      ).toLocaleDateString()}
                                </span>
                              </>
                            )}
                            <span className="ml-auto text-blue-400 group-hover:text-blue-300 transition-colors duration-200">
                              View source →
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
