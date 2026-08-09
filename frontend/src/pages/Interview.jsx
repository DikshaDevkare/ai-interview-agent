import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:3001'
const TOTAL_QUESTIONS = 8

function Interview() {
  const navigate = useNavigate()

  const [candidate, setCandidate] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [questionNumber, setQuestionNumber] = useState(1)
  const [robotState, setRobotState] = useState('idle')

  const candidateId = 'CAND-007'

  useEffect(() => {
    startInterview()
  }, [])

  async function startInterview() {
    try {
      setLoading(true)
      setError('')
      setRobotState('thinking')

      // Load candidate
      const candidateResponse = await fetch(
        `${API_URL}/api/candidates/${candidateId}`
      )

      if (!candidateResponse.ok) {
        throw new Error('Could not load candidate')
      }

      const candidateData = await candidateResponse.json()
      setCandidate(candidateData)

      // Create session
      const newSessionId = `session-${Date.now()}`
      setSessionId(newSessionId)

      // Start interview
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

      const interviewData = await interviewResponse.json()

      if (!interviewResponse.ok) {
        throw new Error(
          interviewData.error || 'Could not start interview'
        )
      }

      setQuestion(interviewData.reply)
      setRobotState('asking')

    } catch (err) {
      console.error(err)
      setError(err.message)
      setRobotState('error')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer(event) {
    event.preventDefault()

    if (!answer.trim() || submitting) {
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setRobotState('thinking')

      const response = await fetch(
        `${API_URL}/api/interview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message: answer.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not submit answer'
        )
      }

      setAnswer('')

      if (data.done) {
        setRobotState('complete')

        localStorage.setItem(
          'interviewFeedback',
          JSON.stringify(data.feedback)
        )

        navigate('/feedback')
        return
      }

      setQuestionNumber((previous) =>
        Math.min(previous + 1, TOTAL_QUESTIONS)
      )

      setQuestion(data.reply)
      setRobotState('asking')

    } catch (err) {
      console.error(err)
      setError(err.message)
      setRobotState('error')
    } finally {
      setSubmitting(false)
    }
  }

  function getRobotMessage() {
    if (robotState === 'thinking') {
      return 'Analyzing your response...'
    }

    if (robotState === 'error') {
      return 'Something went wrong. Let’s try again.'
    }

    if (robotState === 'complete') {
      return 'Excellent work. Preparing your results.'
    }

    if (robotState === 'asking') {
      return 'I’m listening. Take your time.'
    }

    return 'Ready when you are.'
  }

  if (loading) {
    return (
      <section className="interview-loading-page">
        <div className="robot-loader">
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

          <h1>Preparing your interview</h1>

          <p>
            Your AI interviewer is analyzing your profile
            and preparing personalized questions.
          </p>

          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>
    )
  }

  if (error && !question) {
    return (
      <section className="interview-error-page">
        <div className="error-robot">
          🤖
        </div>

        <span className="eyebrow">SYSTEM ERROR</span>

        <h1>Something went wrong</h1>

        <p>{error}</p>

        <button
          className="robot-button primary"
          onClick={startInterview}
        >
          Try Again
        </button>
      </section>
    )
  }

  const progress =
    (questionNumber / TOTAL_QUESTIONS) * 100

  return (
    <section className="robot-interview-page">

      {/* Background effects */}
      <div className="interview-grid"></div>
      <div className="interview-glow glow-one"></div>
      <div className="interview-glow glow-two"></div>

      {/* Top bar */}
      <div className="interview-topbar">

        <div className="interview-brand">
          <div className="mini-robot">
            <span></span>
            <span></span>
          </div>

          <div>
            <strong>AI Interview Agent</strong>
            <small>Adaptive Interview System</small>
          </div>
        </div>

        <div className="live-indicator">
          <span></span>
          LIVE INTERVIEW
        </div>

      </div>


      {/* Progress */}
      <div className="interview-progress-panel">

        <div className="progress-text">

          <div>
            <span className="progress-label">
              INTERVIEW PROGRESS
            </span>

            <strong>
              Question {questionNumber}
              <span> / {TOTAL_QUESTIONS}</span>
            </strong>
          </div>

          <span className="progress-percentage">
            {Math.round(progress)}%
          </span>

        </div>

        <div className="progress-track">
          <div
            className="progress-value"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

      </div>


      {/* Main interview */}
      <div className="robot-interview-layout">

        {/* Main column */}
        <main className="interview-conversation">

          {/* Robot interviewer */}
          <div className="robot-interviewer">

            <div className="robot-stage">

              <div className="robot-aura"></div>

              <div
                className={`large-robot robot-${robotState}`}
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


          {/* Question */}
          <div className="question-panel">

            <div className="question-panel-top">

              <span className="question-tag">
                CURRENT QUESTION
              </span>

              <span className="adaptive-tag">
                ✦ ADAPTIVE
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

          </div>


          {/* Answer */}
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
            />

            <div className="answer-panel-footer">

              <div className="keyboard-hint">
                <span>TIP</span>
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
                    AI is thinking...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <span>→</span>
                  </>
                )}

              </button>

            </div>

          </form>

          {error && (
            <div className="inline-error">
              <span>!</span>
              {error}
            </div>
          )}

        </main>


        {/* Sidebar */}
        <aside className="interview-info">

          {/* Candidate */}
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
              <span>Experience</span>
              <strong>
                {candidate?.member?.yearsExperience ??
                  0}{' '}
                years
              </strong>
            </div>

          </div>


          {/* AI status */}
          <div className="info-card">

            <span className="card-label">
              AI ENGINE
            </span>

            <div className="engine-status">
              <div className="engine-icon">
                ✦
              </div>

              <div>
                <strong>Gemini AI</strong>
                <span>Online & Ready</span>
              </div>
            </div>

            <div className="status-row">
              <span>Mode</span>
              <strong>Adaptive</strong>
            </div>

            <div className="status-row">
              <span>Session</span>
              <strong>Active</strong>
            </div>

          </div>


          {/* Interview tip */}
          <div className="robot-tip-card">

            <div className="tip-robot">
              🤖
            </div>

            <div>
              <span>INTERVIEW TIP</span>

              <p>
                Explain <strong>why</strong> you
                chose an approach, not just
                what you would do.
              </p>
            </div>

          </div>

        </aside>

      </div>

    </section>
  )
}

export default Interview