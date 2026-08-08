import { createTopicPlan } from './topicPlan.js'
import { generateInterviewTurn } from './gemini.js'
import {
  addTurn,
  advanceSession,
  completeSession,
  createSession,
  recordInterviewerQuestion,
  recordAnswer,
  setCurrentQuestion,
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

function turnMatchesTopic(turn, topic) {
  return turn.day === topic.day && turn.topic.trim().toLowerCase() === topic.title.toLowerCase()
}

function buildGeminiContext(session, latestCandidateAnswer, nextQuestion) {
  return {
    candidateProfile: session.candidate.member,
    personalizedTopicPlan: session.topicPlan,
    currentCurriculumTopic: session.currentTopic,
    nextCurriculumTopic: nextQuestion?.topic ?? null,
    previousConversationHistory: session.conversationHistory,
    latestCandidateAnswer,
    currentQuestion: session.currentQuestion,
    questionNumber: session.askedQuestionCount + 1,
    remainingInterviewQuestions: session.questions.length - session.currentQuestionIndex - 1,
  }
}

async function generateFirstReply(session, turnGenerator) {
  const fallback = questionReply(session.questions[0])
  const result = await turnGenerator(buildGeminiContext(session, null, session.questions[1]))
  if (result.ok && result.turn.action === 'ask_followup' && turnMatchesTopic(result.turn, session.currentTopic)) {
    setCurrentQuestion(session, result.turn.reply)
    return result.turn.reply
  }
  return fallback
}

async function generateReplyAfterAnswer(session, latestCandidateAnswer, turnGenerator) {
  const nextQuestion = session.questions[session.currentQuestionIndex + 1]
  const result = await turnGenerator(buildGeminiContext(session, latestCandidateAnswer, nextQuestion))

  if (result.ok && result.turn.action === 'ask_followup' && session.followUpCount < 1 && turnMatchesTopic(result.turn, session.currentTopic)) {
    session.followUpCount += 1
    setCurrentQuestion(session, result.turn.reply)
    return { reply: result.turn.reply, advance: false }
  }

  // The backend, not Gemini, controls when the plan advances and when it completes.
  if (nextQuestion) {
    const fallback = questionReply(nextQuestion)
    const reply = result.ok && result.turn.action === 'ask_next' && turnMatchesTopic(result.turn, nextQuestion.topic)
      ? result.turn.reply
      : fallback
    return { reply, advance: true }
  }

  return { advance: true }
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

export async function initializeInterview({ sessionId, candidate, curriculum, turnGenerator = generateInterviewTurn }) {
  validateCandidate(candidate)
  const topicPlan = createTopicPlan(candidate, curriculum)
  const questions = createQuestions(chooseTopics(topicPlan))

  if (questions.length === 0) {
    throw new Error('candidate has no curriculum-linked topics available for an interview')
  }

  const session = createSession({ sessionId, candidate, topicPlan, questions })
  const firstQuestion = await generateFirstReply(session, turnGenerator)
  const reply = `Welcome. Let's begin your interview. ${firstQuestion}`
  recordInterviewerQuestion(session, reply)
  return { reply, done: false }
}

export async function processInterviewAnswer(session, message, turnGenerator = generateInterviewTurn) {
  if (session.status === 'completed') {
    return { reply: 'Interview completed.', done: true, feedback: buildFeedback(session) }
  }

  recordAnswer(session, message)
  const generated = await generateReplyAfterAnswer(session, message, turnGenerator)
  if (!generated.advance) {
    recordInterviewerQuestion(session, generated.reply)
    return { reply: generated.reply, done: false }
  }

  advanceSession(session)

  const nextQuestion = session.questions[session.currentQuestionIndex]
  if (!nextQuestion) {
    completeSession(session)
    const reply = 'Interview completed.'
    addTurn(session, 'interviewer', reply)
    return { reply, done: true, feedback: buildFeedback(session) }
  }

  const reply = generated.reply
  setCurrentQuestion(session, reply)
  recordInterviewerQuestion(session, reply)
  return { reply, done: false }
}
