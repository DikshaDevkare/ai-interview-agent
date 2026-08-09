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
followUpCount:
  session.followUpCount,

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
      typeof result.turn?.reply === 'string' &&
      result.turn.reply.trim() &&
      (
        result.turn.action === 'ask_next' ||
        result.turn.action === 'ask_followup'
      ) &&
      turnMatchesTopic(
        result.turn,
        firstQuestion.topic
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
 *
 * The flow is:
 *
 * Candidate answer
 *       ↓
 * Gemini assessment
 *       ↓
 * Strong → next question
 * Partial/Weak → follow-up
 *
 * Maximum one follow-up for each base question.
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
  // Q8 is the final base question.
// After its follow-up has been used, finish the interview.
if (!nextQuestion && session.followUpCount >= 1) {
  return {
    reply: null,
    advance: true,
    finish: true,

    answerAssessment: 'weak',

    assessmentReason:
      'The candidate did not demonstrate sufficient understanding after the final follow-up.',
  }
}

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
   * Debug information.
   * This helps us verify that Gemini is actually
   * assessing the candidate's answer.
   */
  console.log(
    'Answer assessment:',
    result?.turn?.answerAssessment,
    result?.turn?.assessmentReason
  )
  /*
 * HARD LIMIT:
 * Only one follow-up is allowed for each question.
 *
 * If a follow-up has already been asked,
 * force progression to the next base question.
 */
if (
  session.followUpCount >= 1 &&
  nextQuestion
) {
  return {
    reply: questionReply(nextQuestion),
    advance: true,

    answerAssessment:
      result?.turn?.answerAssessment || 'weak',

    assessmentReason:
      result?.turn?.assessmentReason ||
      'The candidate did not demonstrate sufficient understanding after the follow-up question.',
  }
}

  /*
   * Allow one follow-up question for the
   * current topic.
   *
   * Follow-up is triggered when Gemini explicitly
   * asks for one OR when the answer is partial/weak.
   */
  if (
    result?.ok &&
    (
      result.turn?.action === 'ask_followup' ||
      result.turn?.answerAssessment === 'partial' ||
      result.turn?.answerAssessment === 'weak'
    ) &&
    session.followUpCount < 1 &&
    turnMatchesTopic(
      result.turn,
      session.currentTopic
    ) &&
    typeof result.turn.reply === 'string' &&
    result.turn.reply.trim()
  ) {
    session.followUpCount += 1

    setCurrentQuestion(
      session,
      result.turn.reply
    )

    return {
      reply: result.turn.reply,
      advance: false,
isFollowUp: true,
      answerAssessment:
        result.turn.answerAssessment || 'partial',

      assessmentReason:
        result.turn.assessmentReason || '',
    }
  }


  /*
   * Backend controls progression.
   *
   * If Gemini gives a valid next question,
   * use it.
   *
   * Otherwise use our deterministic fallback
   * question from the selected curriculum.
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
      ) &&
      typeof result.turn.reply === 'string' &&
      result.turn.reply.trim()
        ? result.turn.reply
        : fallback

    return {
      reply,
      advance: true,

      answerAssessment:
        result?.turn?.answerAssessment || 'strong',

      assessmentReason:
        result?.turn?.assessmentReason || '',
    }
  }


  /*
   * No next question remains.
   */
  return {
    advance: true,

    answerAssessment:
      result?.turn?.answerAssessment || 'strong',

    assessmentReason:
      result?.turn?.assessmentReason || '',
  }
}


/*
 * Final feedback.
 */
function buildFeedback(session) {
  const uniqueDays = new Set(
    session.answers.map(
      (answer) => answer.day
    )
  )

  const plan = session.topicPlan

  const strengths = (
    plan.completedStrong || []
  )
    .map(
      (topic) =>
        `Demonstrated progress in ${topic.title}.`
    )
    .slice(0, 5)

  const gaps = [
    ...(plan.failedAttempts || []).map(
      (topic) =>
        `Revisit ${topic.title} because previous attempts indicate this area needs reinforcement.`
    ),

    ...(plan.skippedTopics || []).map(
      (topic) =>
        `Review ${topic.title} because this topic was skipped in the learning journey.`
    ),
  ].slice(0, 5)

  const next = (
    plan.deeperQuestioning || []
  )
    .map(
      (topic) =>
        `Practice explaining ${topic.title} using a practical example or implementation scenario.`
    )
    .slice(0, 5)

  if (strengths.length === 0) {
    strengths.push(
      'Completed the interview across multiple curriculum-linked topics.'
    )
  }

  if (gaps.length === 0) {
    gaps.push(
      'Continue practicing explanations that connect concepts to real implementation decisions.'
    )
  }

  if (next.length === 0) {
    next.push(
      'Review the interviewed curriculum topics and practice answering deeper follow-up questions.'
    )
  }

  return {
    summary:
      `Interview completed successfully across ` +
      `${uniqueDays.size} curriculum days with ` +
      `${session.answers.length} recorded responses. ` +
      `The interview used the candidate learning journey ` +
      `to select relevant technical areas and allowed ` +
      `the conversation to adapt through follow-up reasoning.`,

    answersRecorded:
      session.answers.length,

    strengths,

    gaps,

    next,
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
   * Select directly from candidate missions
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

  /*
   * Make sure the follow-up counter starts clean.
   */
  session.followUpCount = 0

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
    topic: session.currentTopic.title,
    day: session.currentTopic.day,
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

  /*
   * Record candidate answer before asking Gemini
   * so conversation history contains the response.
   */
  recordAnswer(
  session,
  message
)

/*
 * FINAL QUESTION SAFETY:
 *
 * If this is the last base question and its
 * one allowed follow-up has already happened,
 * finish the interview immediately.
 *
 * Do not ask Gemini for another question.
 */
const isFinalQuestion =
  session.currentQuestionIndex >=
  session.questions.length - 1

if (
  isFinalQuestion &&
  session.followUpCount >= 1
) {
  completeSession(session)

  const feedback =
    buildFeedback(session)

  return {
    reply: 'Interview completed.',
    done: true,
    feedback,
  }
}

const generated =
  await generateReplyAfterAnswer(
    session,
    message,
    turnGenerator
  )


  /*
   * Follow-up question:
   * stay on the same topic and do NOT advance
   * the base-question index.
   */
  if (!generated.advance) {
    recordInterviewerQuestion(
      session,
      generated.reply
    )

    return {
      reply: generated.reply,
      topic: session.currentTopic.title,
      day: session.currentTopic.day,
      done: false,

      answerAssessment:
        generated.answerAssessment,

      assessmentReason:
        generated.assessmentReason,
    }
  }


  /*
   * Move to next base question.
   */
  advanceSession(session)

  /*
   * Reset follow-up allowance for the new
   * base question/topic.
   */
  session.followUpCount = 0

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

    topic:
      nextQuestion.topic.title,

    day:
      nextQuestion.topic.day,

    done: false,

    answerAssessment:
      generated.answerAssessment,

    assessmentReason:
      generated.assessmentReason,
  }
}