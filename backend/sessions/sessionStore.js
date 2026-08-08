const sessions = new Map()

export function getSession(sessionId) {
  return sessions.get(sessionId)
}

export function createSession({ sessionId, candidate, topicPlan, questions }) {
  const session = {
    sessionId,
    candidate,
    topicPlan,
    questions,
    currentQuestionIndex: 0,
    currentTopic: questions[0]?.topic ?? null,
    conversationHistory: [],
    answers: [],
    status: 'in_progress',
  }

  sessions.set(sessionId, session)
  return session
}

export function addTurn(session, role, message) {
  session.conversationHistory.push({ role, message, timestamp: new Date().toISOString() })
}

export function recordAnswer(session, message) {
  const question = session.questions[session.currentQuestionIndex]
  session.answers.push({
    questionIndex: session.currentQuestionIndex,
    day: question.topic.day,
    topic: question.topic.title,
    answer: message,
  })
  addTurn(session, 'candidate', message)
}

export function advanceSession(session) {
  session.currentQuestionIndex += 1
  session.currentTopic = session.questions[session.currentQuestionIndex]?.topic ?? null
}

export function completeSession(session) {
  session.status = 'completed'
  session.currentTopic = null
}
