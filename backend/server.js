import express from 'express'
import { findCandidateById, getCurriculum } from './data/interviewData.js'
import {
  initializeInterview,
  processInterviewAnswer,
} from './services/interviewEngine.js'
import { createTopicPlan } from './services/topicPlan.js'
import { getSession } from './sessions/sessionStore.js'

const app = express()
const port = process.env.PORT || 3001

// Allow the React frontend to communicate with the backend
app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    'http://localhost:5173'
  )

  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,OPTIONS'
  )

  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type'
  )

  // Handle browser CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json())


// ---------------------------------------------------------
// Health check
// ---------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})


// ---------------------------------------------------------
// Get candidate
// ---------------------------------------------------------

app.get('/api/candidates/:candidateId', (req, res) => {
  const candidate = findCandidateById(req.params.candidateId)

  if (!candidate) {
    return res.status(404).json({
      error: 'Candidate not found',
    })
  }

  res.json(candidate)
})


// ---------------------------------------------------------
// Get candidate topic plan
// ---------------------------------------------------------

app.get('/api/candidates/:candidateId/plan', (req, res) => {
  const candidate = findCandidateById(req.params.candidateId)

  if (!candidate) {
    return res.status(404).json({
      error: 'Candidate not found',
    })
  }

  res.json(
    createTopicPlan(
      candidate,
      getCurriculum()
    )
  )
})


// ---------------------------------------------------------
// Interview API
// ---------------------------------------------------------

app.post('/api/interview', async (req, res) => {
  const {
    sessionId,
    candidate,
    message,
  } = req.body ?? {}


  // Validate session ID
  if (
    typeof sessionId !== 'string' ||
    !sessionId.trim()
  ) {
    return res.status(400).json({
      error: 'sessionId must be a non-empty string',
    })
  }


  // Check whether this session already exists
  const session = getSession(sessionId)


  // -------------------------------------------------------
  // CREATE NEW INTERVIEW SESSION
  // -------------------------------------------------------

  if (!session) {

    if (!candidate) {
      return res.status(400).json({
        error:
          'candidate is required when creating a new session',
      })
    }

    try {
      const result = await initializeInterview({
        sessionId,
        candidate,
        curriculum: getCurriculum(),
      })

      return res.json(result)

    } catch (error) {
      console.error(
        'Interview initialization failed:',
        error
      )

      return res.status(400).json({
        error: error.message,
      })
    }
  }


  // -------------------------------------------------------
  // EXISTING SESSION
  // -------------------------------------------------------

  if (candidate) {
    return res.status(400).json({
      error:
        'session already exists; send a message to continue it',
    })
  }


  // Validate candidate answer
  if (
    typeof message !== 'string' ||
    !message.trim()
  ) {
    return res.status(400).json({
      error:
        'message must be a non-empty string for an existing session',
    })
  }


  // Process candidate answer
  try {
    const result = await processInterviewAnswer(
      session,
      message
    )

    return res.json(result)

  } catch (error) {
    console.error(
      'Interview answer processing failed:',
      error
    )

    return res.status(400).json({
      error: error.message,
    })
  }
})


// ---------------------------------------------------------
// Start server
// ---------------------------------------------------------

app.listen(port, () => {
  console.log(
    `Backend listening on http://localhost:${port}`
  )
})