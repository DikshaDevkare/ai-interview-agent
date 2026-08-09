import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:3001'
const TOTAL_QUESTIONS = 8

function Interview() {
  const navigate = useNavigate()

  const [candidate, setCandidate] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [currentTopic, setCurrentTopic] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [questionNumber, setQuestionNumber] = useState(1)
  const [robotState, setRobotState] = useState('idle')

  // Prevent React StrictMode from starting two interviews
  const interviewStarted = useRef(false)

  const candidateId = 'CAND-007'

  useEffect(() => {
    if (interviewStarted.current) {
      return
    }

    interviewStarted.current = true
    startInterview()
  }, [])

  // =========================================================
  // START INTERVIEW
  // =========================================================

  async function startInterview() {
    try {
      setLoading(true)
      setError('')
      setQuestion('')
      setAnswer('')
      setQuestionNumber(1)
      setRobotState('thinking')

      // -----------------------------------------------------
      // 1. LOAD CANDIDATE
      // -----------------------------------------------------

      const candidateResponse = await fetch(
        `${API_URL}/api/candidates/${candidateId}`
      )

      if (!candidateResponse.ok) {
        throw new Error('Could not load candidate profile.')
      }

      const candidateData = await candidateResponse.json()

      setCandidate(candidateData)

      // -----------------------------------------------------
      // 2. CREATE NEW SESSION
      // -----------------------------------------------------

      const newSessionId =
        `session-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`

      setSessionId(newSessionId)

      // -----------------------------------------------------
      // 3. START AI INTERVIEW
      // -----------------------------------------------------

      const interviewResponse = await fetch(
        `${API_URL}/api/interview`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            sessionId: newSessionId,
            candidate: candidateData,
          }),
        }
      )

      const interviewData =
        await interviewResponse.json()

      if (!interviewResponse.ok) {
        throw new Error(
          interviewData.error ||
            'Could not start interview.'
        )
      }

      if (!interviewData.reply) {
        throw new Error(
          'AI did not return a question.'
        )
      }

      setQuestion(interviewData.reply)

     setCurrentTopic(interviewData.topic || 'Preparing...')
      setRobotState('asking')
    } catch (err) {
      console.error('START INTERVIEW ERROR:', err)

      setError(
        err.message ||
          'Unable to start the interview.'
      )

      setRobotState('error')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // SUBMIT ANSWER
  // =========================================================

  async function submitAnswer(event) {
    event.preventDefault()

    const cleanAnswer = answer.trim()

    // Prevent empty answer / duplicate submission
    if (!cleanAnswer || submitting) {
      return
    }

    // Session must exist
    if (!sessionId) {
      setError(
        'Interview session is not ready. Please restart the interview.'
      )
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setRobotState('thinking')

      // -----------------------------------------------------
      // SEND ANSWER TO GEMINI BACKEND
      // -----------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/interview`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            sessionId,
            message: cleanAnswer,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Could not submit your answer.'
        )
      }

      // Clear previous answer
      setAnswer('')

      // -----------------------------------------------------
      // INTERVIEW COMPLETED
      // -----------------------------------------------------

      if (data.done) {
        setRobotState('complete')

        if (data.feedback) {
          localStorage.setItem(
            'interviewFeedback',
            JSON.stringify(data.feedback)
          )
        }

        navigate('/feedback')
        return
      }

      // -----------------------------------------------------
      // NEXT QUESTION
      // -----------------------------------------------------

      
if (!data.isFollowUp) {
  setQuestionNumber((previous) =>
    Math.min(
      previous + 1,
      TOTAL_QUESTIONS
    )
  )
}
      if (!data.reply) {
        throw new Error(
          'AI did not generate the next question.'
        )
      }

      setQuestion(data.reply)
setCurrentTopic(data.topic || 'Preparing...')
      setRobotState('asking')
    } catch (err) {
      console.error(
        'SUBMIT ANSWER ERROR:',
        err
      )

      setError(
        err.message ||
          'Something went wrong while analyzing your answer.'
      )

      setRobotState('error')
    } finally {
      setSubmitting(false)
    }
  }

  // =========================================================
  // ROBOT STATUS MESSAGE
  // =========================================================

  function getRobotMessage() {
    switch (robotState) {
      case 'thinking':
        return 'Analyzing your response...'

      case 'asking':
        return 'I’m listening. Take your time.'

      case 'error':
        return 'Something went wrong. Let’s try again.'

      case 'complete':
        return 'Excellent work. Preparing your results.'

      default:
        return 'Ready when you are.'
    }
  }

  // =========================================================
  // PROGRESS
  // =========================================================

  const progress =
    Math.round(
      (questionNumber / TOTAL_QUESTIONS) * 100
    )

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <section className="interview-loading-page">

        <div className="robot-loader">

          <div className="robot-antenna">
            <span></span>
          </div>

          <div className="robot-head">

            <div className="robot-eye"></div>
            <div className="robot-eye"></div>

          </div>

          <div className="robot-neck"></div>

          <div className="robot-body">
            <span></span>
          </div>

        </div>


        <div className="loading-content">

          <span className="eyebrow">
            AI INTERVIEW AGENT
          </span>

          <h1>
            Preparing your interview
          </h1>

          <p>
            Your AI interviewer is analyzing
            your profile and preparing
            personalized questions.
          </p>


          <div className="loading-status">

            <span className="status-dot"></span>

            <span>
              Gemini AI is thinking
            </span>

          </div>


          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

        </div>

      </section>
    )
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error && !question) {
    return (
      <section className="interview-error-page">

        <div className="error-robot">
          🤖
        </div>

        <span className="eyebrow">
          SYSTEM ERROR
        </span>

        <h1>
          Something went wrong
        </h1>

        <p>
          {error}
        </p>

        <button
          className="robot-button primary"
          onClick={() => {
            interviewStarted.current = false
            startInterview()
          }}
        >
          Try Again
        </button>

      </section>
    )
  }

  // =========================================================
  // MAIN INTERVIEW UI
  // =========================================================

  return (
    <section className="robot-interview-page">

      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="interview-grid"></div>

      <div className="interview-glow glow-one"></div>

      <div className="interview-glow glow-two"></div>


      {/* =====================================================
          TOP BAR
          ===================================================== */}

      <div className="interview-topbar">

        <div className="interview-brand">

          <div className="mini-robot">
            <span></span>
            <span></span>
          </div>

          <div>
            <strong>
              AI Interview Agent
            </strong>

            <small>
              Adaptive Interview System
            </small>
          </div>

        </div>


        <div className="live-indicator">

          <span></span>

          LIVE INTERVIEW

        </div>

      </div>


      {/* =====================================================
          PROGRESS
          ===================================================== */}

      <div className="interview-progress-panel">

        <div className="progress-text">

          <div>

            <span className="progress-label">
              INTERVIEW PROGRESS
            </span>

            <strong>
              Question {questionNumber}

              <span>
                {' '}
                / {TOTAL_QUESTIONS}
              </span>
            </strong>

          </div>


          <span className="progress-percentage">
            {progress}%
          </span>

        </div>


        <div className="progress-track">

          <div
            className="progress-value"
            style={{
              width: `${progress}%`,
            }}
          ></div>

        </div>


        <div className="progress-steps">

          {Array.from(
            { length: TOTAL_QUESTIONS },
            (_, index) => {

              const number = index + 1

              return (
                <span
                  key={number}
                  className={
                    number <= questionNumber
                      ? 'active'
                      : ''
                  }
                ></span>
              )
            }
          )}

        </div>

      </div>


      {/* =====================================================
          MAIN LAYOUT
          ===================================================== */}

      <div className="robot-interview-layout">


        {/* ===================================================
            MAIN CONVERSATION
            =================================================== */}

        <main className="interview-conversation">


          {/* =================================================
              ROBOT
              ================================================= */}

          <div className="robot-interviewer">

            <div className="robot-stage">

              <div className="robot-aura"></div>


              <div
                className={
                  `large-robot robot-${robotState}`
                }
              >

                <div className="robot-antenna">

                  <span></span>

                </div>


                <div className="robot-head">

                  <div className="robot-face-glow"></div>


                  <div className="robot-eyes">

                    <span></span>
                    <span></span>

                  </div>


                  <div className="robot-mouth"></div>

                </div>


                <div className="robot-neck"></div>


                <div className="robot-chest">

                  <div className="robot-core">
                    <span></span>
                  </div>

                  <div className="robot-chest-line"></div>

                </div>

              </div>

            </div>


            <div className="robot-status">

              <div className="robot-status-title">

                <span className="status-dot"></span>

                <strong>
                  AI Interviewer
                </strong>

                <span className="powered">
                  Powered by Gemini
                </span>

              </div>


              <p>
                {getRobotMessage()}
              </p>

            </div>

          </div>


          {/* =================================================
              QUESTION
              ================================================= */}

          <div
            className="question-panel"
            key={questionNumber}
          >

            <div className="question-panel-top">

              <span className="question-tag">
                CURRENT QUESTION
              </span>

              <span className="adaptive-tag">
                ✦ ADAPTIVE AI
              </span>

            </div>


            <div className="question-content">

              <div className="quote-mark">
                “
              </div>

              <h1>
                {question}
              </h1>

            </div>


            <div className="question-meta">

              <span>
                QUESTION {String(questionNumber).padStart(2, '0')}
              </span>

              <span>
                Your answer influences what I ask next.
              </span>

            </div>

          </div>


          {/* =================================================
              ANSWER
              ================================================= */}

          <form
            className="answer-panel"
            onSubmit={submitAnswer}
          >

            <div className="answer-panel-header">

              <div>

                <span className="answer-label">
                  YOUR RESPONSE
                </span>

                <p>
                  Explain your reasoning clearly.
                  Your answer influences the next question.
                </p>

              </div>


              <span className="character-count">
                {answer.length} chars
              </span>

            </div>


            <textarea
              value={answer}
              onChange={(event) =>
                setAnswer(event.target.value)
              }
              placeholder="Start typing your answer..."
              disabled={submitting}
              autoComplete="off"
            />


            <div className="answer-panel-footer">

              <div className="keyboard-hint">

                <span>
                  TIP
                </span>

                Quality matters more than speed.

              </div>


              <button
                type="submit"
                className="robot-button submit-button"
                disabled={
                  !answer.trim() ||
                  submitting
                }
              >

                {submitting ? (
                  <>
                    <span className="button-spinner"></span>

                    AI is analyzing...
                  </>
                ) : (
                  <>
                    Submit Answer

                    <span>
                      →
                    </span>
                  </>
                )}

              </button>

            </div>

          </form>


          {/* =================================================
              ERROR
              ================================================= */}

          {error && (
            <div className="inline-error">

              <span>
                !
              </span>

              <div>
                <strong>
                  AI processing error
                </strong>

                <p>
                  {error}
                </p>
              </div>

            </div>
          )}

        </main>


        {/* ===================================================
            SIDEBAR
            =================================================== */}

        <aside className="interview-info">


          {/* =================================================
              CANDIDATE
              ================================================= */}

          <div className="info-card candidate-info">

            <span className="card-label">
              CANDIDATE
            </span>


            <div className="candidate-avatar">

              {candidate?.member?.name
                ?.charAt(0)
                ?.toUpperCase() || 'C'}

            </div>


            <h2>
              {candidate?.member?.name ||
                'Candidate'}
            </h2>


            <p>
              {candidate?.member?.jobRole ||
                'Technical Candidate'}
            </p>


            <div className="candidate-line"></div>


            <div className="candidate-detail">

              <span>
                Experience
              </span>

              <strong>
                {candidate?.member?.yearsExperience ??
                  0}{' '}
                years
              </strong>

            </div>

          </div>


          {/* =================================================
              AI ENGINE
              ================================================= */}

          <div className="info-card">

            <span className="card-label">
              AI ENGINE
            </span>


            <div className="engine-status">

              <div className="engine-icon">
                ✦
              </div>


              <div>

                <strong>
                  Gemini AI
                </strong>

                <span>
                  {robotState === 'thinking'
                    ? 'Analyzing...'
                    : 'Online & Ready'}
                </span>

              </div>

            </div>

<div className="current-topic-row">

  <span>
    CURRENT TOPIC
  </span>

  <strong>
    {currentTopic || 'Preparing...'}
  </strong>

</div>
            <div className="status-row">

              <span>
                Mode
              </span>

              <strong>
                Adaptive
              </strong>

            </div>


            <div className="status-row">

              <span>
                Session
              </span>

              <strong>
                Active
              </strong>

            </div>


            <div className="status-row">

              <span>
                Question
              </span>

              <strong>
                {questionNumber} / {TOTAL_QUESTIONS}
              </strong>

            </div>

          </div>


          {/* =================================================
              ROBOT TIP
              ================================================= */}

          <div className="robot-tip-card">

            <div className="tip-robot">
              🤖
            </div>


            <div>

              <span>
                INTERVIEW TIP
              </span>

              <p>
                Explain <strong>why</strong> you
                chose an approach, not just
                what you would do.
              </p>

            </div>

          </div>


          {/* =================================================
              AI FLOW
              ================================================= */}

          <div className="interview-flow-card">

            <span className="card-label">
              ADAPTIVE FLOW
            </span>


            <div className="flow-item active">

              <span>
                01
              </span>

              <div>
                <strong>
                  Your answer
                </strong>

                <small>
                  Response captured
                </small>
              </div>

            </div>


            <div className="flow-line"></div>


            <div
              className={
                robotState === 'thinking'
                  ? 'flow-item active thinking'
                  : 'flow-item'
              }
            >

              <span>
                02
              </span>

              <div>
                <strong>
                  AI reasoning
                </strong>

                <small>
                  Gemini analyzes response
                </small>
              </div>

            </div>


            <div className="flow-line"></div>


            <div className="flow-item">

              <span>
                03
              </span>

              <div>
                <strong>
                  Next question
                </strong>

                <small>
                  Difficulty adapts
                </small>
              </div>

            </div>

          </div>

        </aside>

      </div>

    </section>
  )
}

export default Interview