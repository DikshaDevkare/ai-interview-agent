import express from 'express'
import { findCandidateById, getCurriculum } from './data/interviewData.js'
import { initializeInterview, processInterviewAnswer } from './services/interviewEngine.js'
import { createTopicPlan } from './services/topicPlan.js'
import { getSession } from './sessions/sessionStore.js'

const app = express()
const port = process.env.PORT || 3001

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/candidates/:candidateId/plan', (req, res) => {
  const candidate = findCandidateById(req.params.candidateId)

  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  res.json(createTopicPlan(candidate, getCurriculum()))
})

app.post('/api/interview', (req, res) => {
  const { sessionId, candidate, message } = req.body ?? {}

  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    return res.status(400).json({ error: 'sessionId must be a non-empty string' })
  }

  const session = getSession(sessionId)
  if (!session) {
    if (!candidate) {
      return res.status(400).json({ error: 'candidate is required when creating a new session' })
    }

    try {
      return res.json(initializeInterview({ sessionId, candidate, curriculum: getCurriculum() }))
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  if (candidate) {
    return res.status(400).json({ error: 'session already exists; send a message to continue it' })
  }
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message must be a non-empty string for an existing session' })
  }

  return res.json(processInterviewAnswer(session, message))
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
