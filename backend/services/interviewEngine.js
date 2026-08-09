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


/*
 * Select four curriculum topics for the interview.
 *
 * Priority:
 * 1. Failed missions
 * 2. Skipped missions
 * 3. Passed missions with more attempts
 * 4. Remaining candidate missions
 *
 * This uses the candidate's actual mission DAY
 * to connect directly to curriculum.days.
 */
function chooseTopics(candidate, curriculum) {

  const curriculumDays = Array.isArray(curriculum?.days)
    ? curriculum.days
    : []

  const curriculumByDay = new Map(
    curriculumDays.map((topic) => [
      Number(topic.day),
      topic,
    ])
  )


  const missions = Array.isArray(candidate?.missions)
    ? candidate.missions
    : []


  /*
   * Give every mission a priority score.
   */
  const rankedMissions = missions
    .map((mission) => {

      const attempts =
        Number(mission.attempts) || 1

      let priority = 0

      // Failed mission = highest priority
      if (mission.passed === false) {
        priority += 100
      }

      // Skipped mission = second priority
      if (mission.skipped === true) {
        priority += 80
      }

      // More attempts indicate more difficulty
      if (mission.passed === true) {
        priority += Math.min(attempts * 5, 40)
      }

      return {
        mission,
        priority,
      }
    })
    .sort((a, b) => b.priority - a.priority)


  const selected = []
  const seenDays = new Set()


  /*
   * First choose topics directly connected to
   * the candidate's mission history.
   */
  for (const item of rankedMissions) {

    const mission = item.mission
    const day = Number(mission.day)

    if (seenDays.has(day)) {
      continue
    }

    const curriculumTopic = curriculumByDay.get(day)

    if (!curriculumTopic) {
      continue
    }

    seenDays.add(day)

    selected.push(curriculumTopic)

    if (selected.length >= INTERVIEW_DAY_COUNT) {
      break
    }
  }


  /*
   * Safety fallback:
   * If fewer than four topics were found from the
   * candidate data, fill from the curriculum.
   */
  if (selected.length < INTERVIEW_DAY_COUNT) {

    for (const topic of curriculumDays) {

      const day = Number(topic.day)

      if (seenDays.has(day)) {
        continue
      }

      seenDays.add(day)

      selected.push(topic)

      if (selected.length >= INTERVIEW_DAY_COUNT) {
        break
      }
    }
  }


  return selected
}


/*
 * Create two questions for every selected topic.
 *
 * 4 topics × 2 questions = 8 base questions.
 */
function createQuestions(topics) {

  return topics.flatMap((topic) => {

    const objective =
      topic.objectives?.[0] ||
      `Explain the key concepts of ${topic.title}.`

    const tools =
      Array.isArray(topic.tools) && topic.tools.length > 0
        ? topic.tools.join(', ')
        : 'the listed technologies'


    return [

      {
        topic,

        prompt:
          `Day ${topic.day} — ${topic.title}: ` +
          `Explain how you would achieve this objective: ${objective}`,
      },

      {
        topic,

        prompt:
          `Day ${topic.day} — ${topic.title}: ` +
          `Which listed tools would you use for that objective, ` +
          `and how would they support it? (${tools})`,
      },

    ]
  })
}


/*
 * Fallback question if Gemini does not respond correctly.
 */
function questionReply(question) {
  return question.prompt
}


function turnMatchesTopic(turn, topic) {

  if (!turn || !topic) {
    return false
  }

  return (
    Number(turn.day) === Number(topic.day) &&
    typeof turn.topic === 'string' &&
    turn.topic.trim().toLowerCase() ===
      topic.title.trim().toLowerCase()
  )
}


/*
 * Context sent to Gemini.
 */
function buildGeminiContext(
  session,
  latestCandidateAnswer,
  nextQuestion
) {

  return {

    candidateProfile:
      session.candidate.member,

    personalizedTopicPlan:
      session.topicPlan,

    currentCurriculumTopic:
      session.currentTopic,

    nextCurriculumTopic:
      nextQuestion?.topic ?? null,

    previousConversationHistory:
      session.conversationHistory,

    latestCandidateAnswer,

    currentQuestion:
      session.currentQuestion,

    questionNumber:
      session.currentQuestionIndex + 1,

    remainingInterviewQuestions:
      Math.max(
        session.questions.length -
          session.currentQuestionIndex -
          1,
        0
      ),

  }
}


/*
 * Generate the first interviewer message.
 */
async function generateFirstReply(
  session,
  turnGenerator
) {

  const firstQuestion =
    session.questions[0]

  const nextQuestion =
    session.questions[1]


  const fallback =
    questionReply(firstQuestion)


  try {

    const result =
      await turnGenerator(
        buildGeminiContext(
          session,
          null,
          nextQuestion
        )
      )


    if (
      result?.ok &&
      result.turn?.action === 'ask_followup' &&
      turnMatchesTopic(
        result.turn,
        session.currentTopic
      )
    ) {

      setCurrentQuestion(
        session,
        result.turn.reply
      )

      return result.turn.reply
    }

  } catch (error) {

    console.error(
      'Gemini first-turn error:',
      error
    )

  }


  return fallback
}


/*
 * Generate the response after a candidate answer.
 */
async function generateReplyAfterAnswer(
  session,
  latestCandidateAnswer,
  turnGenerator
) {

  const nextQuestion =
    session.questions[
      session.currentQuestionIndex + 1
    ]


  let result = null


  try {

    result =
      await turnGenerator(
        buildGeminiContext(
          session,
          latestCandidateAnswer,
          nextQuestion
        )
      )

  } catch (error) {

    console.error(
      'Gemini answer-turn error:',
      error
    )

  }


  /*
   * Allow one follow-up question for the
   * current topic.
   */
  if (
    result?.ok &&
    result.turn?.action === 'ask_followup' &&
    session.followUpCount < 1 &&
    turnMatchesTopic(
      result.turn,
      session.currentTopic
    )
  ) {

    session.followUpCount += 1

    setCurrentQuestion(
      session,
      result.turn.reply
    )

    return {
      reply: result.turn.reply,
      advance: false,
    }
  }


  /*
   * Backend controls progression.
   */
  if (nextQuestion) {

    const fallback =
      questionReply(nextQuestion)


    const reply =
      result?.ok &&
      result.turn?.action === 'ask_next' &&
      turnMatchesTopic(
        result.turn,
        nextQuestion.topic
      )
        ? result.turn.reply
        : fallback


    return {
      reply,
      advance: true,
    }
  }


  return {
    advance: true,
  }
}


/*
 * Final feedback.
 */
function buildFeedback(session) {

  const uniqueDays =
    new Set(
      session.answers.map(
        (answer) => answer.day
      )
    )


  const plan =
    session.topicPlan


  return {

    summary:
      `Completed a deterministic interview ` +
      `covering ${uniqueDays.size} curriculum days ` +
      `with ${session.answers.length} recorded answers. ` +
      `No answer scoring is performed in this phase.`,

    strengths:
      plan.completedStrong
        .map((topic) => topic.title),

    gaps:
      [
        ...plan.failedAttempts,
        ...plan.skippedTopics,
      ].map((topic) => topic.title),

    next:
      plan.deeperQuestioning
        .map((topic) => topic.title),

  }
}


/*
 * Start a new interview.
 */
export async function initializeInterview({
  sessionId,
  candidate,
  curriculum,
  turnGenerator = generateInterviewTurn,
}) {

  validateCandidate(candidate)


  const topicPlan =
    createTopicPlan(
      candidate,
      curriculum
    )


  /*
   * IMPORTANT:
   * We now select directly from candidate missions
   * + curriculum.days rather than relying only on
   * topicPlan.availableCurriculumTopics.
   */
  const selectedTopics =
    chooseTopics(
      candidate,
      curriculum
    )


  console.log(
    'Selected interview topics:',
    selectedTopics.map(
      (topic) =>
        `Day ${topic.day}: ${topic.title}`
    )
  )


  const questions =
    createQuestions(
      selectedTopics
    )


  console.log(
    'Generated interview questions:',
    questions.length
  )


  if (questions.length === 0) {

    throw new Error(
      'candidate has no curriculum-linked topics available for an interview'
    )
  }


  const session =
    createSession({
      sessionId,
      candidate,
      topicPlan,
      questions,
    })


  const firstQuestion =
    await generateFirstReply(
      session,
      turnGenerator
    )


  const reply =
    `Welcome. Let's begin your interview. ${firstQuestion}`


  recordInterviewerQuestion(
    session,
    reply
  )


  return {
    reply,
    done: false,
  }
}


/*
 * Process candidate answer.
 */
export async function processInterviewAnswer(
  session,
  message,
  turnGenerator = generateInterviewTurn
) {

  if (session.status === 'completed') {

    return {
      reply: 'Interview completed.',
      done: true,
      feedback:
        buildFeedback(session),
    }
  }


  recordAnswer(
    session,
    message
  )


  const generated =
    await generateReplyAfterAnswer(
      session,
      message,
      turnGenerator
    )


  /*
   * Follow-up question:
   * stay on the same topic.
   */
  if (!generated.advance) {

    recordInterviewerQuestion(
      session,
      generated.reply
    )


    return {
      reply: generated.reply,
      done: false,
    }
  }


  /*
   * Move to next base question.
   */
  advanceSession(session)


  const nextQuestion =
    session.questions[
      session.currentQuestionIndex
    ]


  /*
   * No more questions.
   */
  if (!nextQuestion) {

    completeSession(session)


    const reply =
      'Interview completed.'


    addTurn(
      session,
      'interviewer',
      reply
    )


    return {
      reply,
      done: true,
      feedback:
        buildFeedback(session),
    }
  }


  const reply =
    generated.reply


  setCurrentQuestion(
    session,
    reply
  )


  recordInterviewerQuestion(
    session,
    reply
  )


  return {
    reply,
    done: false,
  }
}