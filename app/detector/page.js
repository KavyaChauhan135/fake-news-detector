'use client'

import { useState } from 'react'
import Link from 'next/link'
import { analyzeContent } from '../utils/aiAnalysis.js'

export default function Detector() {
  const [articleText, setArticleText] = useState('')
  const [headline, setHeadline] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const detectFakeNews = async () => {
    if (!articleText.trim() && !headline.trim()) {
      alert('Please enter either a headline or article text')
      return
    }

    setLoading(true)
    
    // Use enhanced AI analysis
    setTimeout(() => {
      const contentToAnalyze = headline || articleText
      const analysis = analyzeContent(contentToAnalyze)
      setResult(analysis)
      setLoading(false)
      
      // Store result in localStorage for dashboard
      const history = JSON.parse(localStorage.getItem('detectionHistory') || '[]')
      history.unshift({
        id: Date.now(),
        headline: headline || articleText.substring(0, 100) + '...',
        result: analysis,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('detectionHistory', JSON.stringify(history.slice(0, 50)))
    }, 2000)
  }

  // Removed old simulation function - now using enhanced AI analysis from utils

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">FakeNewsDetector</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/detector" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium font-semibold">
                Detector
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Fake News Detector</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headline (Optional)
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter news headline..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Text (Optional)
              </label>
              <textarea
                value={articleText}
                onChange={(e) => setArticleText(e.target.value)}
                placeholder="Paste article text here..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="text-center">
              <button
                onClick={detectFakeNews}
                disabled={loading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Detect Fake News'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-8 text-center animate-fade-in">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600 animate-pulse">AI is analyzing the content...</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>• Analyzing language patterns...</p>
                <p>• Checking for sensational content...</p>
                <p>• Evaluating credibility indicators...</p>
              </div>
            </div>
          )}

          {result && (
            <div className={`mt-8 p-6 rounded-lg border-2 ${result.borderColor} ${result.bgColor} animate-fade-in`}>
              <h3 className="text-xl font-bold mb-4">Analysis Results</h3>
              <div className="mb-4">
                <span className="text-lg font-semibold">Verdict: </span>
                <span className={`text-xl font-bold ${result.color}`}>{result.verdict}</span>
              </div>
              <div className="mb-4">
                <span className="text-lg font-semibold">Confidence: </span>
                <span className={result.color}>{result.confidence.toFixed(1)}%</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Key Findings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.reasons.map((reason, index) => (
                    <li key={index} className="text-gray-700">{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}