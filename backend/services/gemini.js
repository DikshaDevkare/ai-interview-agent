import { GoogleGenAI } from '@google/genai'
import { fileURLToPath } from 'node:url'

const MODEL = 'gemini-3.6-flash'
const TIMEOUT_MS = 15_000

// The backend process reads the root .env once; the key is never sent to clients or logged.
try {
 process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)))
} catch {
  // A missing .env is handled as a normal, deterministic-fallback condition below.
}

const responseSchema = {
  type: 'object',
  properties: {
    reply: { type: 'string' },

    action: {
      type: 'string',
      enum: ['ask_followup', 'ask_next', 'finish'],
    },

    topic: {
      type: 'string',
    },

    day: {
      type: ['integer', 'null'],
    },

    answerAssessment: {
      type: 'string',
      enum: ['strong', 'partial', 'weak', 'not_assessed'],
    },

    assessmentReason: {
      type: 'string',
    },
  },

  required: [
    'reply',
    'action',
    'topic',
    'day',
    'answerAssessment',
    'assessmentReason',
  ],

  additionalProperties: false,
}

function isValidTurn(turn) {
  return turn
    && typeof turn.reply === 'string'
    && turn.reply.trim()
    && ['ask_followup', 'ask_next', 'finish'].includes(turn.action)
    && typeof turn.topic === 'string'
    && (Number.isInteger(turn.day) || turn.day === null)
    && ['strong', 'partial', 'weak', 'not_assessed'].includes(
      turn.answerAssessment
    )
    && typeof turn.assessmentReason === 'string'
}

function buildPrompt(context) {
  return `
You are a technical AI interviewer conducting a personalized interview.

Return ONLY valid JSON matching the supplied response schema.

Your job is to assess the candidate's technical understanding based on
their actual learning journey and the supplied curriculum.

IMPORTANT INTERVIEW RULES:

1. Ask exactly ONE concise, interview-style technical question in "reply".
   Do not answer the question yourself.

2. The question MUST be directly related to "currentCurriculumTopic".
   Do not replace the curriculum topic with a generic question about Gemini,
   AI, or interviewing.

3. Use ONLY the supplied curriculum topics, objectives, tools,
   candidate profile, and topic plan.

4. Use the actual candidate profile and topic plan.
   Never invent candidate achievements, knowledge, attempts, or experience.

5. Consider the conversation history and the candidate's latest answer.

6. If latestCandidateAnswer is missing:
   - Ask the supplied current question.
   - Use action "ask_followup".

7. After the candidate answers:
   - If their answer gives you a useful opportunity to test deeper
     understanding of the SAME currentCurriculumTopic, use "ask_followup".
   - A follow-up must remain on the SAME curriculum topic.
   - Do NOT suddenly switch to Gemini AI or another unrelated topic.

8. Use "ask_next" ONLY when you are ready to move from
   currentCurriculumTopic to nextCurriculumTopic.

9. After receiving a candidate answer, assess its quality against
   the current curriculum topic, objective, and the question asked.

10. Set "answerAssessment" to:
    - "strong" when the answer is technically correct, relevant,
      and demonstrates clear understanding.
    - "partial" when the answer is partly correct but misses
      important concepts, reasoning, or details.
    - "weak" when the answer is incorrect, irrelevant, unclear,
      or shows little understanding.

11. Set "assessmentReason" to a short explanation of why the
    answer received that assessment. Do not invent facts about
    the candidate.

12. If the answer is "partial" or "weak", normally use
    "ask_followup" and ask a useful question that helps test or
    clarify the SAME current curriculum topic.

13. If the answer is "strong", you may use "ask_next" to move
    to the next curriculum question/topic.

14. A follow-up question must directly respond to the candidate's
    previous answer. Do not ask a random question.

15. Never treat every non-empty answer as correct. Evaluate the
    actual technical content of the answer before choosing
    "ask_next".

16. If the candidate says "I don't know", gives an unrelated answer,
    or provides no meaningful technical explanation, classify it
    as "weak" and normally ask a follow-up or clarification question.

17. Keep "answerAssessment" and "assessmentReason" consistent with
    the candidate's actual answer and the current curriculum topic.

CURRENT INTERVIEW CONTEXT:

${JSON.stringify(context)}
`
}

function safeGoogleErrorMessage(error, apiKey) {
  const raw = String(error?.message ?? error?.body ?? 'Unknown Gemini API error')
  let message = raw

  try {
    const parsed = JSON.parse(raw)
    message = parsed?.error?.message ?? raw
  } catch {
    // SDK errors are not always JSON; the raw message is redacted below.
  }

  return message
    .replaceAll(apiKey, '[REDACTED]')
    .replace(/AIza[\w-]{20,}/g, '[REDACTED]')
}
function createFallbackTurn(context) {
 const currentTopic =
  context?.currentCurriculumTopic

const nextTopic =
  context?.nextCurriculumTopic

const answer =
  String(
    context?.latestCandidateAnswer ?? ''
  ).trim()

const followUpCount =
  Number(context?.followUpCount) || 0

  // First question: there is no answer to assess yet.
  if (!answer) {
    const question =
      context?.currentQuestion ||
      `Explain the key concepts of ${
        currentTopic?.title || 'this topic'
      }.`

    return {
      ok: true,
      turn: {
        reply: question,
        action: 'ask_followup',

        topic:
          currentTopic?.title ||
          'Current Topic',

        day:
          Number.isInteger(
            Number(currentTopic?.day)
          )
            ? Number(currentTopic.day)
            : null,

        answerAssessment:
          'not_assessed',

        assessmentReason:
          'Initial interview question; no candidate answer has been assessed yet.',
      },
    }
  }

  // Clearly weak answers.
  const weakPatterns = [
    'i dont know',
    "i don't know",
    'dont know',
    "don't know",
    'no idea',
    'not sure',
    'i have no idea',
    'idk',
    'nothing',
  ]
  /*
 * Only one follow-up is allowed for each base question.
 * If a follow-up has already happened, move forward.
 */
if (followUpCount >= 1 && nextTopic) {
  return {
    ok: true,

    turn: {
      reply:
        `Let's move on. Explain how you would approach ${
          nextTopic.title || 'the next topic'
        }.`,

      action: 'ask_next',

      topic:
        nextTopic.title ||
        'Next Topic',

      day:
        Number.isInteger(
          Number(nextTopic.day)
        )
          ? Number(nextTopic.day)
          : null,

      answerAssessment:
        'weak',

      assessmentReason:
        'The candidate did not provide a meaningful answer after the available follow-up, so the interview is progressing to the next curriculum topic.',
    },
  }
}

  const normalizedAnswer =
    answer
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .trim()

  const isClearlyWeak =
    weakPatterns.includes(
      normalizedAnswer
    )

  if (isClearlyWeak) {
    return {
      ok: true,
      turn: {
        reply:
          `Can you explain the basic idea of ${
            currentTopic?.title || 'this topic'
          } in your own words?`,

        action: 'ask_followup',

        topic:
          currentTopic?.title ||
          'Current Topic',

        day:
          Number.isInteger(
            Number(currentTopic?.day)
          )
            ? Number(currentTopic.day)
            : null,

        answerAssessment:
          'weak',

        assessmentReason:
          'The candidate did not provide a meaningful technical answer.',
      },
    }
  }

  // Gemini unavailable: use a safe follow-up
  // instead of falsely marking the answer correct.
  return {
    ok: true,
    turn: {
      reply:
        `Can you explain your answer in more technical detail and give a practical example related to ${
          currentTopic?.title || 'this topic'
        }?`,

      action: 'ask_followup',

      topic:
        currentTopic?.title ||
        'Current Topic',

      day:
        Number.isInteger(
          Number(currentTopic?.day)
        )
          ? Number(currentTopic.day)
          : null,

      answerAssessment:
        'partial',

      assessmentReason:
        'Gemini was unavailable, so the answer was not automatically marked as correct. A follow-up is used to assess the candidate further.',
    },
  }
}
export async function generateInterviewTurn(context) {
  const apiKey = process.env.GEMINI_API_KEY
  console.log(`Gemini API key loaded: ${apiKey ? 'yes' : 'no'}`)
  console.log(`Gemini model: ${MODEL}`)
  if (!apiKey) {
    return { ok: false, reason: 'Gemini is not configured' }
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(context),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: responseSchema,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    })
    console.log('Gemini API call succeeded')
    const text = response.text?.trim()
    if (!text) return { ok: false, reason: 'Gemini returned an empty response' }

    let turn
    try {
      turn = JSON.parse(text)
    } catch {
      return { ok: false, reason: 'Gemini returned invalid JSON' }
    }
    if (!isValidTurn(turn)) return { ok: false, reason: 'Gemini returned an invalid interview turn' }

    return { ok: true, turn: { ...turn, reply: turn.reply.trim(), topic: turn.topic.trim() } }
  } catch (error) {
  const status =
    error?.status ??
    error?.response?.status ??
    'unknown'

  console.log(
    `Gemini API call failed: status=${status} message=${safeGoogleErrorMessage(error, apiKey)}`
  )

  console.log(
    'Using deterministic interview fallback.'
  )

  return createFallbackTurn(context)
}
}
