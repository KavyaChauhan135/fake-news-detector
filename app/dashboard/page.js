'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [detectionHistory, setDetectionHistory] = useState([])
  const [statistics, setStatistics] = useState({
    total: 0,
    fake: 0,
    real: 0,
    uncertain: 0
  })

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('detectionHistory') || '[]')
    setDetectionHistory(history)
    
    // Calculate statistics
    const stats = history.reduce((acc, item) => {
      acc.total++
      if (item.result.verdict === 'Likely Fake') acc.fake++
      else if (item.result.verdict === 'Likely Real') acc.real++
      else if (item.result.verdict === 'Uncertain') acc.uncertain++
      return acc
    }, { total: 0, fake: 0, real: 0, uncertain: 0 })
    
    setStatistics(stats)
  }, [])

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all detection history?')) {
      localStorage.removeItem('detectionHistory')
      setDetectionHistory([])
      setStatistics({ total: 0, fake: 0, real: 0, uncertain: 0 })
    }
  }

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'Likely Fake': return 'text-red-600 bg-red-100'
      case 'Likely Real': return 'text-green-600 bg-green-100'
      case 'Uncertain': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

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
              <Link href="/detector" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Detector
              </Link>
              <Link href="/dashboard" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium font-semibold">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Track your fake news detection history and analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <div className="bg-white p-6 rounded-lg shadow-md hover-lift">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Analysis</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Likely Fake</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.fake}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Likely Real</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.real}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uncertain</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.uncertain}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detection History */}
        <div className="bg-white rounded-lg shadow-md animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Detection History</h3>
              {detectionHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
          
          {detectionHistory.length === 0 ? (
            <div className="p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-gray-600">No detection history available</p>
              <Link href="/detector" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                Start Detecting
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {detectionHistory.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {item.headline}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerdictColor(item.result.verdict)}`}>
                          {item.result.verdict}
                        </span>
                        <span>Confidence: {item.result.confidence.toFixed(1)}%</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}