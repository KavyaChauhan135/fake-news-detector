"use client";

import { useState } from "react";
import Link from "next/link";

export default function Detector() {
  const [articleText, setArticleText] = useState("");
  const [headline, setHeadline] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  const detectFakeNews = async () => {
    if (!articleText.trim() && !headline.trim() && !url.trim()) {
      setShowEmptyModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: articleText,
          headline: headline,
          url: url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze content");
      }

      const analysis = await response.json();
      setResult(analysis);

      // Store result in localStorage for dashboard
      const history = JSON.parse(
        localStorage.getItem("detectionHistory") || "[]"
      );
      history.unshift({
        id: Date.now(),
        headline: headline || articleText.substring(0, 100) + "...",
        result: analysis,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(
        "detectionHistory",
        JSON.stringify(history.slice(0, 50))
      );
    } catch (err) {
      console.error("Error detecting fake news:", err);
      setError(err.message || "Failed to analyze content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors">
                  FakeNewsDetector
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/detector"
                className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium font-semibold"
              >
                Detector
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Fake News Detector
            </h2>
            <p className="text-gray-600">
              Analyze news articles and headlines with AI-powered detection
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                News URL <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news-article"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
              <p className="mt-1 text-xs text-gray-500">Enter a URL to automatically fetch and analyze the article</p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter news headline..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Text <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={articleText}
                onChange={(e) => setArticleText(e.target.value)}
                placeholder="Paste article text here for more detailed analysis..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none"
              />
            </div>

            <div className="text-center pt-2">
              <button
                onClick={detectFakeNews}
                disabled={loading}
                className="bg-indigo-600 text-white px-10 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? "Analyzing..." : "Detect Fake News"}
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-8 text-center animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-800">
                Analyzing with AI...
              </p>
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                  <p>Examining content authenticity</p>
                </div>
                <div className="flex items-center justify-center space-x-2" style={{animationDelay: '0.2s'}}>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <p>Detecting bias and manipulation</p>
                </div>
                <div className="flex items-center justify-center space-x-2" style={{animationDelay: '0.4s'}}>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  <p>Verifying source credibility</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 p-6 rounded-lg border-2 border-red-200 bg-red-50 animate-fade-in">
              <h3 className="text-xl font-bold text-red-600 mb-2">Error</h3>
              <p className="text-gray-700">{error}</p>
            </div>
          )}

          {result && (
            <div
              className={`mt-8 p-6 rounded-lg border-2 ${result.borderColor} ${result.bgColor} animate-fade-in`}
            >
              <h3 className="text-xl font-bold mb-4">Analysis Results</h3>
              <div className="mb-4">
                <span className="text-lg font-semibold">Verdict: </span>
                <span className={`text-xl font-bold ${result.color}`}>
                  {result.verdict}
                </span>
              </div>
              <div className="mb-4">
                <span className="text-lg font-semibold">Confidence: </span>
                <span className={result.color}>
                  {Number.isInteger(result.confidence) ? result.confidence : result.confidence.toFixed(1)}%
                </span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Key Findings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.reasons.map((reason, index) => (
                    <li key={index} className="text-gray-700">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Empty Input Modal */}
      {showEmptyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Input Required
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Please enter a URL, headline, or article text to analyze.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEmptyModal(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
