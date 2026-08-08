import { createTopicPlan } from './topicPlan.js'
import {
  addTurn,
  advanceSession,
  completeSession,
  createSession,
  recordAnswer,
} from '../sessions/sessionStore.js'

const INTERVIEW_DAY_COUNT = 4

function validateCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    throw new Error('candidate must be an object')
  }
  if (!candidate.member || typeof candidate.member.id !== 'string') {
    throw new Error('candidate.member.id must be a string')
  }
  if (!Array.isArray(candidate.missions)) {
    throw new Error('candidate.missions must be an array')
  }
}

function chooseTopics(topicPlan) {
  // Prioritize explicit evidence of difficulty, then fill from the remaining plan.
  const orderedTopics = [
    ...topicPlan.failedAttempts,
    ...topicPlan.skippedTopics,
    ...topicPlan.deeperQuestioning,
    ...topicPlan.completedStrong,
    ...topicPlan.availableCurriculumTopics,
  ]
  const curriculumByDay = new Map(topicPlan.availableCurriculumTopics.map((topic) => [topic.day, topic]))
  const selected = []
  const seenDays = new Set()

  for (const topic of orderedTopics) {
    if (seenDays.has(topic.day)) continue
    const curriculumTopic = curriculumByDay.get(topic.day)
    if (!curriculumTopic) continue
    seenDays.add(topic.day)
    selected.push(curriculumTopic)
    if (selected.length === INTERVIEW_DAY_COUNT) break
  }

  return selected
}

function createQuestions(topics) {
  return topics.flatMap((topic) => {
    const objective = topic.objectives[0]
    const tools = topic.tools.join(', ')

    // Both prompts only reference objectives and tools supplied by curriculum.json.
    return [
      {
        topic,
        prompt: `Day ${topic.day} — ${topic.title}: Explain how you would achieve this objective: ${objective}`,
      },
      {
        topic,
        prompt: `Day ${topic.day} — ${topic.title}: Which listed tools would you use for that objective, and how would they support it? (${tools})`,
      },
    ]
  })
}

function questionReply(question) {
  return question.prompt
}

function buildFeedback(session) {
  const uniqueDays = new Set(session.answers.map((answer) => answer.day))
  const plan = session.topicPlan

  return {
    summary: `Completed a deterministic interview covering ${uniqueDays.size} curriculum days with ${session.answers.length} recorded answers. No answer scoring is performed in this phase.`,
    strengths: plan.completedStrong.map((topic) => topic.title),
    gaps: [...plan.failedAttempts, ...plan.skippedTopics].map((topic) => topic.title),
    next: plan.deeperQuestioning.map((topic) => topic.title),
  }
}

export function initializeInterview({ sessionId, candidate, curriculum }) {
  validateCandidate(candidate)
  const topicPlan = createTopicPlan(candidate, curriculum)
  const questions = createQuestions(chooseTopics(topicPlan))

  if (questions.length === 0) {
    throw new Error('candidate has no curriculum-linked topics available for an interview')
  }

  const session = createSession({ sessionId, candidate, topicPlan, questions })
  const reply = `Welcome. Let's begin your interview. ${questionReply(questions[0])}`
  addTurn(session, 'interviewer', reply)
  return { reply, done: false }
}

export function processInterviewAnswer(session, message) {
  if (session.status === 'completed') {
    return { reply: 'Interview completed.', done: true, feedback: buildFeedback(session) }
  }

  recordAnswer(session, message)
  advanceSession(session)

  const nextQuestion = session.questions[session.currentQuestionIndex]
  if (!nextQuestion) {
    completeSession(session)
    const reply = 'Interview completed.'
    addTurn(session, 'interviewer', reply)
    return { reply, done: true, feedback: buildFeedback(session) }
  }

  const reply = questionReply(nextQuestion)
  addTurn(session, 'interviewer', reply)
  return { reply, done: false }
}
