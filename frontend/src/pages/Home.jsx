import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Home() {
  const [visibleSections, setVisibleSections] = useState({})

  const [expandedCore, setExpandedCore] = useState({
    profile: false,
    curriculum: false,
    gemini: false,
    session: false
  })

  const [expandedFeature, setExpandedFeature] = useState({
    questions: false,
    followups: false,
    curriculumAware: false,
    feedback: false
  })

  useEffect(() => {
    const sections = document.querySelectorAll('.reveal-section')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.dataset.section]: true
            }))
          }
        })
      },
      { threshold: 0.15 }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const toggleCore = (key) => {
    setExpandedCore((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleFeature = (key) => {
    setExpandedFeature((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="home-container">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero-section" aria-label="Hero">

        <span className="hero-badge">
          AI-Powered Assessment
        </span>

        <h1 className="hero-title">
          Your Interview.
          <span className="hero-gradient-text">
            Built Around You.
          </span>
        </h1>

        <p className="hero-subtitle">
          An adaptive technical interviewer that understands your
          skills, curriculum and answers — then changes the
          interview accordingly.
        </p>

        <div className="hero-buttons">
          <Link to="/interview" className="btn btn-primary">
            Start Interview →
          </Link>

          <a href="#ai-engine" className="btn btn-secondary">
            Explore AI Engine
          </a>
        </div>

        {/* Animated AI Orb */}
        <div className="hero-ai-visual">
          <div className="ai-orbit ai-orbit-one"></div>
          <div className="ai-orbit ai-orbit-two"></div>

          <div className="ai-core">
            <div className="ai-core-inner">
              ✦
            </div>
          </div>

          <div className="ai-status">
            <span></span>
            AI INTERVIEWER ONLINE
          </div>
        </div>

      </section>


      {/* =====================================================
          AI ENGINE
      ===================================================== */}

      <section
        id="ai-engine"
        className={`ai-engine-section reveal-section ${
          visibleSections.engine ? 'is-visible' : ''
        }`}
        data-section="engine"
      >

        <div className="section-header">
          <span className="section-label">
            01 — THE AI ENGINE
          </span>

          <h2 className="section-title">
            Four layers.
            <span className="gradient-heading">
              One adaptive interview.
            </span>
          </h2>

          <p className="section-desc">
            Your profile, curriculum, AI reasoning and interview
            state work together to create a personalized experience.
          </p>
        </div>

        <div className="ai-pipeline">

          <div className="pipeline-line"></div>

          <div className="pipeline-node node-blue">
            <div className="pipeline-icon">◉</div>
            <span>Candidate</span>
            <small>Profile & Skills</small>
          </div>

          <div className="pipeline-arrow">→</div>

          <div className="pipeline-node node-purple">
            <div className="pipeline-icon">▣</div>
            <span>Curriculum</span>
            <small>Topics & Progress</small>
          </div>

          <div className="pipeline-arrow">→</div>

          <div className="pipeline-node node-cyan featured-node">
            <div className="pipeline-icon">✦</div>
            <span>Gemini AI</span>
            <small>Reasoning Engine</small>
            <div className="node-pulse"></div>
          </div>

          <div className="pipeline-arrow">→</div>

          <div className="pipeline-node node-mint">
            <div className="pipeline-icon">◈</div>
            <span>Interview</span>
            <small>Adaptive Questions</small>
          </div>

        </div>

        <div className="engine-note">
          <span className="note-dot"></span>
          The next question changes according to your previous answer.
        </div>

      </section>


      {/* =====================================================
          PERFORMANCE GRAPH
      ===================================================== */}

      <section
        className={`performance-section reveal-section ${
          visibleSections.performance ? 'is-visible' : ''
        }`}
        data-section="performance"
      >

        <div className="section-header">
          <span className="section-label">
            02 — PERFORMANCE INTELLIGENCE
          </span>

          <h2 className="section-title">
            See your progress,
            <span className="gradient-heading">
              not just your score.
            </span>
          </h2>

          <p className="section-desc">
            The platform can turn interview responses into meaningful
            performance insights.
          </p>
        </div>

        <div className="performance-dashboard">

          <div className="chart-panel">

            <div className="chart-top">
              <div>
                <span className="chart-label">
                  INTERVIEW PERFORMANCE
                </span>

                <h3>Progress across questions</h3>
              </div>

              <span className="chart-badge">
                SAMPLE DATA
              </span>
            </div>

            <div className="line-chart">

              <div className="chart-y-labels">
                <span>100</span>
                <span>80</span>
                <span>60</span>
                <span>40</span>
                <span>20</span>
              </div>

              <svg
                viewBox="0 0 700 300"
                className="performance-svg"
                preserveAspectRatio="none"
              >

                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    x2="1"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>

                  <linearGradient
                    id="areaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#22d3ee"
                      stopOpacity="0.22"
                    />

                    <stop
                      offset="100%"
                      stopColor="#22d3ee"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {/* Grid */}
                <line x1="0" y1="30" x2="700" y2="30" />
                <line x1="0" y1="90" x2="700" y2="90" />
                <line x1="0" y1="150" x2="700" y2="150" />
                <line x1="0" y1="210" x2="700" y2="210" />
                <line x1="0" y1="270" x2="700" y2="270" />

                {/* Area */}
                <path
                  className="chart-area"
                  d="
                    M0 235
                    C70 215 90 205 140 180
                    C190 155 205 190 255 140
                    C300 95 320 150 365 125
                    C420 95 440 110 480 75
                    C525 45 555 90 590 65
                    C630 40 660 55 700 30
                    L700 270
                    L0 270
                    Z
                  "
                  fill="url(#areaGradient)"
                />

                {/* Main line */}
                <path
                  className="chart-line"
                  d="
                    M0 235
                    C70 215 90 205 140 180
                    C190 155 205 190 255 140
                    C300 95 320 150 365 125
                    C420 95 440 110 480 75
                    C525 45 555 90 590 65
                    C630 40 660 55 700 30
                  "
                  fill="none"
                  stroke="url(#chartGradient)"
                />

                {/* Points */}
                <circle cx="140" cy="180" r="5" />
                <circle cx="255" cy="140" r="5" />
                <circle cx="365" cy="125" r="5" />
                <circle cx="480" cy="75" r="5" />
                <circle cx="590" cy="65" r="5" />
                <circle cx="700" cy="30" r="6" />

              </svg>

              <div className="chart-x-labels">
                <span>Q1</span>
                <span>Q2</span>
                <span>Q3</span>
                <span>Q4</span>
                <span>Q5</span>
                <span>Q6</span>
              </div>

            </div>

          </div>


          {/* Score cards */}

          <div className="score-panel">

            <div className="score-card">
              <span>OVERALL</span>
              <strong>82%</strong>
              <small>↑ Improving</small>
            </div>

            <div className="score-card cyan-score">
              <span>TECHNICAL</span>
              <strong>87%</strong>
              <small>Strong</small>
            </div>

            <div className="score-card mint-score">
              <span>CONFIDENCE</span>
              <strong>74%</strong>
              <small>Growing</small>
            </div>

          </div>

        </div>

        <p className="demo-disclaimer">
          * Visualization shown with sample values. Actual scores will
          come from completed interview responses.
        </p>

      </section>


      {/* =====================================================
          SKILL ANALYSIS
      ===================================================== */}

      <section
        className={`skills-section reveal-section ${
          visibleSections.skills ? 'is-visible' : ''
        }`}
        data-section="skills"
      >

        <div className="section-header">
          <span className="section-label">
            03 — SKILL ANALYSIS
          </span>

          <h2 className="section-title">
            Know exactly
            <span className="gradient-heading">
              where you stand.
            </span>
          </h2>

          <p className="section-desc">
            Break overall performance into individual technical
            and behavioral dimensions.
          </p>
        </div>


        <div className="skills-dashboard">

          <div className="skill-card">

            <div className="skill-card-header">
              <span>Python</span>
              <strong>88%</strong>
            </div>

            <div className="skill-track">
              <div
                className="skill-fill blue-fill"
                style={{ '--skill-width': '88%' }}
              ></div>
            </div>

            <small>Strong conceptual understanding</small>

          </div>


          <div className="skill-card">

            <div className="skill-card-header">
              <span>Machine Learning</span>
              <strong>78%</strong>
            </div>

            <div className="skill-track">
              <div
                className="skill-fill cyan-fill"
                style={{ '--skill-width': '78%' }}
              ></div>
            </div>

            <small>Good — room for deeper reasoning</small>

          </div>


          <div className="skill-card">

            <div className="skill-card-header">
              <span>DSA</span>
              <strong>64%</strong>
            </div>

            <div className="skill-track">
              <div
                className="skill-fill purple-fill"
                style={{ '--skill-width': '64%' }}
              ></div>
            </div>

            <small>Practice recommended</small>

          </div>


          <div className="skill-card">

            <div className="skill-card-header">
              <span>Communication</span>
              <strong>74%</strong>
            </div>

            <div className="skill-track">
              <div
                className="skill-fill mint-fill"
                style={{ '--skill-width': '74%' }}
              ></div>
            </div>

            <small>Clear communication</small>

          </div>

        </div>

      </section>


      {/* =====================================================
          ADAPTIVE AI DEMO
      ===================================================== */}

      <section
        className={`adaptive-section reveal-section ${
          visibleSections.adaptive ? 'is-visible' : ''
        }`}
        data-section="adaptive"
      >

        <div className="section-header">
          <span className="section-label">
            04 — WATCH THE AI ADAPT
          </span>

          <h2 className="section-title">
            Your answer changes
            <span className="gradient-heading">
              the next question.
            </span>
          </h2>

          <p className="section-desc">
            This is the core idea behind the AI Interview Agent.
          </p>
        </div>


        <div className="adaptive-demo">

          <div className="demo-header">
            <div className="demo-ai-icon">✦</div>

            <div>
              <strong>AI Interviewer</strong>
              <span>
                Adaptive reasoning
              </span>
            </div>

            <div className="live-indicator">
              <span></span>
              LIVE
            </div>
          </div>


          <div className="question-block">

            <span className="question-label">
              QUESTION 04
            </span>

            <h3>
              Explain how vector databases help a RAG system.
            </h3>

          </div>


          <div className="candidate-answer">

            <div className="answer-avatar">
              C
            </div>

            <div>
              <span>Your answer</span>

              <p>
                Vector databases store embeddings and allow
                semantically similar information to be retrieved.
              </p>
            </div>

          </div>


          <div className="ai-analysis">

            <div className="analysis-header">
              <span>AI ANALYSIS</span>
              <span className="analyzing">
                ● Analyzing response...
              </span>
            </div>

            <div className="analysis-grid">

              <div>
                <span>Topic understanding</span>
                <strong>82%</strong>
              </div>

              <div>
                <span>Technical depth</span>
                <strong>76%</strong>
              </div>

            </div>

            <div className="analysis-tags">
              <span>✓ Topic detected</span>
              <span>✓ Answer understood</span>
              <span>→ Follow-up generated</span>
            </div>

          </div>


          <div className="next-question">

            <span>
              NEXT QUESTION
            </span>

            <p>
              "How would you choose an indexing strategy
              for a production vector database?"
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          CORE PLATFORM
      ===================================================== */}

      <section
        className={`system-uses-section reveal-section ${
          visibleSections.core ? 'is-visible' : ''
        }`}
        data-section="core"
        aria-label="System Components"
      >

        <div className="section-header">

          <span className="section-label">
            05 — PLATFORM CORE
          </span>

          <h2 className="section-title">
            Everything the interviewer
            <span className="gradient-heading">
              understands.
            </span>
          </h2>

          <p className="section-desc">
            Click a layer to explore how it contributes to the interview.
          </p>

        </div>


        <div className="system-grid">

          {[
            {
              key: 'profile',
              icon: '◉',
              title: 'Candidate Profile',
              text: 'Skills, background, experience and target roles.'
            },
            {
              key: 'curriculum',
              icon: '▣',
              title: 'Curriculum',
              text: 'Structured topics and domain-specific knowledge.'
            },
            {
              key: 'gemini',
              icon: '✦',
              title: 'Gemini AI',
              text: 'Context-aware reasoning and adaptive dialogue.'
            },
            {
              key: 'session',
              icon: '◈',
              title: 'Interview Session',
              text: 'Conversation state, sequence and progress.'
            }
          ].map((item) => (

            <div
              key={item.key}
              className={`system-card ${
                expandedCore[item.key] ? 'is-expanded' : ''
              }`}
              onClick={() => toggleCore(item.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleCore(item.key)
                }
              }}
              aria-expanded={expandedCore[item.key]}
            >

              <div className="system-icon-wrapper">
                {item.icon}
              </div>

              <h3>{item.title}</h3>

              <p>{item.text}</p>

              {expandedCore[item.key] && (
                <div className="card-expanded-content">
                  This layer contributes contextual information that
                  helps the interview remain personalized and relevant
                  to the candidate.
                </div>
              )}

              <div className="card-toggle-text">
                {expandedCore[item.key]
                  ? 'Show Less ↑'
                  : 'Explore Layer ↓'}
              </div>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          CAPABILITIES
      ===================================================== */}

      <section
        className={`features-section reveal-section ${
          visibleSections.features ? 'is-visible' : ''
        }`}
        data-section="features"
      >

        <div className="section-header">

          <span className="section-label">
            06 — CORE CAPABILITIES
          </span>

          <h2 className="section-title">
            More than a question generator.
          </h2>

          <p className="section-desc">
            The system is designed around the complete interview journey.
          </p>

        </div>


        <div className="features-grid">

          {[
            {
              key: 'questions',
              icon: '?',
              title: 'Personalized Questions',
              text: 'Questions are selected around the candidate profile and target skills.'
            },
            {
              key: 'followups',
              icon: '✦',
              title: 'AI Follow-ups',
              text: 'Deeper questions can be generated from the candidate response.'
            },
            {
              key: 'curriculumAware',
              icon: '▣',
              title: 'Curriculum-Aware',
              text: 'Interview topics connect back to structured learning areas.'
            },
            {
              key: 'feedback',
              icon: '↗',
              title: 'Performance Feedback',
              text: 'The completed interview can produce actionable feedback.'
            }
          ].map((item) => (

            <div
              key={item.key}
              className={`feature-card ${
                expandedFeature[item.key] ? 'is-expanded' : ''
              }`}
              onClick={() => toggleFeature(item.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleFeature(item.key)
                }
              }}
              aria-expanded={expandedFeature[item.key]}
            >

              <div className="feature-icon-wrapper">
                {item.icon}
              </div>

              <h3>{item.title}</h3>

              <p>{item.text}</p>

              {expandedFeature[item.key] && (
                <div className="card-expanded-content">
                  This capability is part of the interview experience
                  and can be expanded further as the project evolves.
                </div>
              )}

              <div className="card-toggle-text">
                {expandedFeature[item.key]
                  ? 'Show Less ↑'
                  : 'Learn More ↓'}
              </div>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className={`how-it-works-section reveal-section ${
          visibleSections.workflow ? 'is-visible' : ''
        }`}
        data-section="workflow"
      >

        <div className="section-header">

          <span className="section-label">
            07 — THE WORKFLOW
          </span>

          <h2 className="section-title">
            From profile
            <span className="gradient-heading">
              to performance.
            </span>
          </h2>

        </div>


        <div className="steps-container">

          {[
            ['01', 'Candidate Profile', 'Load background, skills and target areas.'],
            ['02', 'AI Interview', 'Answer realistic technical questions.'],
            ['03', 'Adaptive Follow-ups', 'The interview responds to your answers.'],
            ['04', 'Actionable Feedback', 'Review strengths and improvement areas.']
          ].map(([number, title, text]) => (

            <div className="step-card" key={number}>

              <div className="step-number">
                {number}
              </div>

              <h3>{title}</h3>

              <p>{text}</p>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="final-cta">

        <div className="cta-glow"></div>

        <span className="section-label">
          READY?
        </span>

        <h2>
          Turn practice into
          <span className="gradient-heading">
            interview confidence.
          </span>
        </h2>

        <p>
          Start an adaptive technical interview and discover
          where you can improve.
        </p>

        <Link to="/interview" className="btn btn-primary">
          Start Your Interview →
        </Link>

      </section>

    </div>
  )
}

export default Home