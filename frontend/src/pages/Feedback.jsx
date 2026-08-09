import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Feedback() {
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const savedFeedback = localStorage.getItem('interviewFeedback')

    if (savedFeedback) {
      try {
        setFeedback(JSON.parse(savedFeedback))
      } catch (error) {
        console.error('Could not read interview feedback', error)
      }
    }
  }, [])

  if (!feedback) {
    return (
      <section className="feedback-empty">

        <div className="empty-robot">
          🤖
        </div>

        <span className="feedback-eyebrow">
          AI PERFORMANCE CENTER
        </span>

        <h1>No interview results yet</h1>

        <p>
          Complete an interview first and your AI-generated
          performance insights will appear here.
        </p>

        <Link
          to="/interview"
          className="feedback-button"
        >
          Start Interview →
        </Link>

      </section>
    )
  }

  const strengths = feedback.strengths || []
  const gaps = feedback.gaps || []
  const next = feedback.next || []

  const totalTopics =
    strengths.length + gaps.length + next.length

  const answeredQuestions =
    extractAnswerCount(feedback.summary)

  return (
    <section className="feedback-page">

      <div className="feedback-grid-bg"></div>
      <div className="feedback-glow feedback-glow-one"></div>
      <div className="feedback-glow feedback-glow-two"></div>


      {/* HERO */}

      <div className="feedback-hero">

        <span className="feedback-eyebrow">
          ✦ AI PERFORMANCE CENTER
        </span>

        <h1>
          Your interview.
          <br />
          <span>Decoded by AI.</span>
        </h1>

        <p>
          Your interview journey has been analyzed into
          meaningful insights, strengths, learning gaps,
          and recommended next steps.
        </p>

      </div>


      {/* SUMMARY CARD */}

      <div className="feedback-summary-card">

        <div className="summary-robot">
          <div className="summary-robot-face">
            <span></span>
            <span></span>
          </div>

          <div className="summary-robot-core"></div>
        </div>

        <div className="summary-content">

          <span className="card-label">
            AI INTERVIEW SUMMARY
          </span>

          <h2>
            Interview completed successfully
          </h2>

          <p>
            {feedback.summary}
          </p>

        </div>

        <div className="completion-badge">
          <span>✓</span>
          COMPLETE
        </div>

      </div>


      {/* METRICS */}

      <div className="feedback-metrics">

        <MetricCard
          value={answeredQuestions || '—'}
          label="Answers Recorded"
          icon="◉"
        />

        <MetricCard
          value={totalTopics || '—'}
          label="Topics Analyzed"
          icon="◇"
        />

        <MetricCard
          value={strengths.length || '—'}
          label="Strong Areas"
          icon="✦"
        />

        <MetricCard
          value={gaps.length || '—'}
          label="Growth Areas"
          icon="↗"
        />

      </div>


      {/* ANALYSIS */}

      <div className="analysis-heading">

        <span className="feedback-eyebrow">
          01 — AI ANALYSIS
        </span>

        <h2>
          Know where you stand.
        </h2>

        <p>
          The AI organized your interview into areas
          that are going well and areas worth improving.
        </p>

      </div>


      <div className="feedback-columns">

        {/* STRENGTHS */}

        <div className="analysis-card strength-card">

          <div className="analysis-card-header">

            <div className="analysis-icon">
              ✦
            </div>

            <div>
              <span>STRONG AREAS</span>
              <h3>What you did well</h3>
            </div>

          </div>

          {strengths.length > 0 ? (
            <div className="topic-list">

              {strengths.map((topic, index) => (
                <div
                  className="topic-item"
                  key={`${topic}-${index}`}
                >
                  <span className="topic-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span>{topic}</span>

                  <b>✓</b>
                </div>
              ))}

            </div>
          ) : (
            <EmptyTopicMessage>
              No strong areas were recorded in this interview phase.
            </EmptyTopicMessage>
          )}

        </div>


        {/* GAPS */}

        <div className="analysis-card gap-card">

          <div className="analysis-card-header">

            <div className="analysis-icon">
              ↗
            </div>

            <div>
              <span>GROWTH AREAS</span>
              <h3>Where to improve</h3>
            </div>

          </div>

          {gaps.length > 0 ? (
            <div className="topic-list">

              {gaps.map((topic, index) => (
                <div
                  className="topic-item"
                  key={`${topic}-${index}`}
                >
                  <span className="topic-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span>{topic}</span>

                  <b>!</b>
                </div>
              ))}

            </div>
          ) : (
            <EmptyTopicMessage>
              No major gaps were recorded in this interview phase.
            </EmptyTopicMessage>
          )}

        </div>

      </div>


      {/* LEARNING PATH */}

      <div className="learning-section">

        <div className="analysis-heading">

          <span className="feedback-eyebrow">
            02 — RECOMMENDED NEXT
          </span>

          <h2>
            Your next learning path.
          </h2>

          <p>
            Topics identified for deeper questioning and
            further preparation.
          </p>

        </div>


        <div className="learning-path">

          {next.length > 0 ? (
            next.map((topic, index) => (

              <div
                className="learning-step"
                key={`${topic}-${index}`}
              >

                <div className="learning-line"></div>

                <div className="learning-number">
                  {index + 1}
                </div>

                <div className="learning-content">

                  <span>
                    NEXT TOPIC
                  </span>

                  <h3>{topic}</h3>

                  <p>
                    Continue practicing this area
                    to strengthen your interview readiness.
                  </p>

                </div>

              </div>

            ))
          ) : (

            <div className="no-learning">
              <span>✦</span>
              <p>
                No additional topics were identified
                for deeper questioning.
              </p>
            </div>

          )}

        </div>

      </div>


      {/* CTA */}

      <div className="feedback-cta">

        <div className="cta-robot">
          🤖
        </div>

        <div>

          <span>
            READY FOR ANOTHER ROUND?
          </span>

          <h2>
            Keep training your interview edge.
          </h2>

          <p>
            Every interview gives the system more
            opportunity to understand your strengths
            and learning path.
          </p>

        </div>

        <Link
          to="/interview"
          className="feedback-button"
        >
          New Interview →
        </Link>

      </div>

    </section>
  )
}


/* ---------- Small Components ---------- */

function MetricCard({ value, label, icon }) {
  return (
    <div className="metric-card">

      <div className="metric-icon">
        {icon}
      </div>

      <strong>{value}</strong>

      <span>{label}</span>

    </div>
  )
}


function EmptyTopicMessage({ children }) {
  return (
    <div className="empty-topic">
      {children}
    </div>
  )
}


/* ---------- Helper ---------- */

function extractAnswerCount(summary) {
  if (!summary) return null

  const match = summary.match(
    /with\s+(\d+)\s+recorded answers/i
  )

  return match ? match[1] : null
}


export default Feedback