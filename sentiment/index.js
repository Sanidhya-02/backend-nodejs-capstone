require('dotenv').config()
const express = require('express')
const axios = require('axios')
const logger = require('./logger')
const expressPino = require('express-pino-logger')({ logger })
const natural = require('natural')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(expressPino)

// POST /sentiment
app.post('/sentiment', async (req, res) => {
  const { sentence } = req.query

  // ❌ No sentence
  if (!sentence) {
    logger.error('No sentence provided')
    return res.status(400).json({ error: 'No sentence provided' })
  }

  // Setup analyzer
  const Analyzer = natural.SentimentAnalyzer
  const stemmer = natural.PorterStemmer
  const analyzer = new Analyzer('English', stemmer, 'afinn')

  try {
    const analysisResult = analyzer.getSentiment(sentence.split(' '))

    let sentiment = 'neutral'

    if (analysisResult < 0) {
      sentiment = 'negative'
    } else if (analysisResult > 0.33) {
      sentiment = 'positive'
    }

    logger.info(`Sentiment analysis result: ${analysisResult}`)

    res.status(200).json({
      sentimentScore: analysisResult,
      sentiment
    })
  } catch (error) {
    logger.error(`Error performing sentiment analysis: ${error}`)
    res.status(500).json({ message: 'Error performing sentiment analysis' })
  }
})

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
