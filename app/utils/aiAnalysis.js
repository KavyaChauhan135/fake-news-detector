// AI Analysis Utility for Fake News Detection

export const analyzeContent = (text) => {
  if (!text || text.trim().length === 0) {
    return {
      verdict: 'Invalid Input',
      confidence: 0,
      reasons: ['No content provided for analysis'],
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  }

  const analysis = {
    sensationalWords: countSensationalWords(text),
    emotionalLanguage: analyzeEmotionalLanguage(text),
    sourceMentions: analyzeSourceMentions(text),
    writingQuality: analyzeWritingQuality(text),
    factCheckIndicators: analyzeFactCheckIndicators(text),
    clickbaitScore: analyzeClickbaitScore(text)
  }

  return calculateFinalVerdict(analysis)
}

const countSensationalWords = (text) => {
  const sensationalWords = [
    'shocking', 'unbelievable', 'incredible', 'amazing', 'outrageous',
    'devastating', 'explosive', 'breaking', 'urgent', 'must read',
    'you won\'t believe', 'this will blow your mind', 'viral', 'trending',
    'exclusive', 'leaked', 'secret', 'hidden', 'conspiracy', 'cover-up'
  ]
  
  const textLower = text.toLowerCase()
  let count = 0
  sensationalWords.forEach(word => {
    if (textLower.includes(word)) count++
  })
  
  return {
    count,
    score: Math.min(count * 10, 30)
  }
}

const analyzeEmotionalLanguage = (text) => {
  const emotionalWords = [
    'hate', 'love', 'angry', 'furious', 'devastated', 'heartbroken',
    'ecstatic', 'terrified', 'disgusted', 'outraged', 'shocked'
  ]
  
  const textLower = text.toLowerCase()
  let count = 0
  emotionalWords.forEach(word => {
    if (textLower.includes(word)) count++
  })
  
  const excessiveCaps = (text.match(/[A-Z]{3,}/g) || []).length
  const excessiveExclamation = (text.match(/!{2,}/g) || []).length
  
  return {
    emotionalWordCount: count,
    excessiveCaps,
    excessiveExclamation,
    score: Math.min((count * 5) + (excessiveCaps * 10) + (excessiveExclamation * 8), 25)
  }
}

const analyzeSourceMentions = (text) => {
  const credibleSources = [
    'according to', 'study shows', 'research indicates', 'experts say',
    'official report', 'confirmed by', 'verified by', 'documents show',
    'data reveals', 'statistics indicate'
  ]
  
  const textLower = text.toLowerCase()
  let count = 0
  credibleSources.forEach(phrase => {
    if (textLower.includes(phrase)) count++
  })
  
  return {
    sourceMentions: count,
    score: Math.min(count * 15, 30)
  }
}

const analyzeWritingQuality = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  
  const avgWordsPerSentence = words.length / sentences.length
  const shortSentences = sentences.filter(s => s.split(/\s+/).length < 5).length
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length
  
  const grammarIssues = (text.match(/\b\w+\b\s+\b\w+\b/g) || []).filter(phrase => {
    return phrase.split(/\s+/).some(word => word.length > 15)
  }).length
  
  return {
    avgWordsPerSentence,
    shortSentences,
    longSentences,
    grammarIssues,
    score: Math.max(0, 20 - (shortSentences * 2) - (longSentences * 1) - (grammarIssues * 3))
  }
}

const analyzeFactCheckIndicators = (text) => {
  const factCheckPhrases = [
    'fact check', 'verified', 'confirmed', 'authentic', 'genuine',
    'corroborated', 'substantiated', 'validated', 'cross-referenced'
  ]
  
  const warningPhrases = [
    'rumor has it', 'allegedly', 'supposedly', 'reportedly', 'claims',
    'sources say', 'unconfirmed reports', 'speculation', 'conspiracy theory'
  ]
  
  const textLower = text.toLowerCase()
  let factCheckCount = 0
  let warningCount = 0
  
  factCheckPhrases.forEach(phrase => {
    if (textLower.includes(phrase)) factCheckCount++
  })
  
  warningPhrases.forEach(phrase => {
    if (textLower.includes(phrase)) warningCount++
  })
  
  return {
    factCheckCount,
    warningCount,
    score: Math.max(0, (factCheckCount * 10) - (warningCount * 5))
  }
}

const analyzeClickbaitScore = (text) => {
  const clickbaitIndicators = {
    numbers: (text.match(/\b\d+\b/g) || []).length,
    questions: (text.match(/\?/g) || []).length,
    superlatives: ['best', 'worst', 'most', 'biggest', 'smallest', 'first', 'last'].filter(word => 
      text.toLowerCase().includes(word)
    ).length,
    urgencyWords: ['now', 'today', 'immediately', 'urgent', 'asap'].filter(word =>
      text.toLowerCase().includes(word)
    ).length
  }
  
  const score = Object.values(clickbaitIndicators).reduce((sum, val) => sum + val, 0) * 2
  
  return {
    ...clickbaitIndicators,
    score: Math.min(score, 20)
  }
}

const calculateFinalVerdict = (analysis) => {
  const totalScore = (
    analysis.sensationalWords.score +
    analysis.emotionalLanguage.score +
    analysis.writingQuality.score +
    analysis.factCheckIndicators.score -
    analysis.sourceMentions.score +
    analysis.clickbaitScore.score
  )
  
  const confidence = Math.min(Math.abs(totalScore) + 60, 95)
  
  if (totalScore > 40) {
    return {
      verdict: 'Likely Fake',
      confidence,
      reasons: generateFakeNewsReasons(analysis),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  } else if (totalScore < -20) {
    return {
      verdict: 'Likely Real',
      confidence,
      reasons: generateRealNewsReasons(analysis),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  } else {
    return {
      verdict: 'Uncertain',
      confidence: Math.max(confidence - 20, 50),
      reasons: generateUncertainReasons(analysis),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  }
}

const generateFakeNewsReasons = (analysis) => {
  const reasons = []
  
  if (analysis.sensationalWords.count > 2) {
    reasons.push('Contains excessive sensational language')
  }
  if (analysis.emotionalLanguage.score > 15) {
    reasons.push('Uses highly emotional and manipulative language')
  }
  if (analysis.clickbaitScore.score > 10) {
    reasons.push('Shows strong clickbait characteristics')
  }
  if (analysis.writingQuality.score < 10) {
    reasons.push('Poor writing quality and structure')
  }
  if (analysis.factCheckIndicators.warningCount > 0) {
    reasons.push('Contains unverified claims and speculation')
  }
  
  if (reasons.length === 0) {
    reasons.push('Multiple fake news indicators detected')
  }
  
  return reasons.slice(0, 3)
}

const generateRealNewsReasons = (analysis) => {
  const reasons = []
  
  if (analysis.sourceMentions.sourceMentions > 0) {
    reasons.push('Cites credible sources and references')
  }
  if (analysis.writingQuality.score > 15) {
    reasons.push('Professional writing quality and structure')
  }
  if (analysis.factCheckIndicators.factCheckCount > 0) {
    reasons.push('Contains fact-checking indicators')
  }
  if (analysis.sensationalWords.count === 0) {
    reasons.push('Uses neutral, professional language')
  }
  
  if (reasons.length === 0) {
    reasons.push('Shows characteristics of legitimate journalism')
  }
  
  return reasons.slice(0, 3)
}

const generateUncertainReasons = (analysis) => {
  const reasons = []
  
  if (analysis.sensationalWords.count > 0 && analysis.sourceMentions.sourceMentions > 0) {
    reasons.push('Mixed signals: sensational language with sources')
  }
  if (analysis.writingQuality.score >= 10 && analysis.writingQuality.score <= 15) {
    reasons.push('Average writing quality, needs more analysis')
  }
  if (analysis.emotionalLanguage.score > 0 && analysis.emotionalLanguage.score < 15) {
    reasons.push('Some emotional language but not excessive')
  }
  
  if (reasons.length === 0) {
    reasons.push('Insufficient evidence for clear classification')
    reasons.push('Requires human fact-checking')
    reasons.push('Mixed credibility indicators')
  }
  
  return reasons.slice(0, 3)
}