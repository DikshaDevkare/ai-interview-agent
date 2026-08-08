import express from 'express'
import { findCandidateById, getCurriculum } from './data/interviewData.js'
import { createTopicPlan } from './services/topicPlan.js'

const app = express()
const port = process.env.PORT || 3001

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

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
