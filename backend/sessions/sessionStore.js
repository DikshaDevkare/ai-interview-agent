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
    currentQuestion: questions[0]?.prompt ?? null,
    askedQuestionCount: 0,
    followUpCount: 0,
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
  session.answers.push({
    questionIndex: session.currentQuestionIndex,
    day: session.currentTopic.day,
    topic: session.currentTopic.title,
    question: session.currentQuestion,
    answer: message,
  })
  addTurn(session, 'candidate', message)
}

export function advanceSession(session) {
  session.currentQuestionIndex += 1
  session.currentTopic = session.questions[session.currentQuestionIndex]?.topic ?? null
  session.currentQuestion = session.questions[session.currentQuestionIndex]?.prompt ?? null
  session.followUpCount = 0
}

export function setCurrentQuestion(session, prompt) {
  session.currentQuestion = prompt
}

export function recordInterviewerQuestion(session, message) {
  session.askedQuestionCount += 1
  addTurn(session, 'interviewer', message)
}

export function completeSession(session) {
  session.status = 'completed'
  session.currentTopic = null
}
