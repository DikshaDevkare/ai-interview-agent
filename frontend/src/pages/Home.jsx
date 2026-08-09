import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Home() {
    const [activeLayer, setActiveLayer] = useState(null)
  const [visible, setVisible] = useState({})

  useEffect(() => {
    const elements = document.querySelectorAll('.landing-reveal')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({
              ...prev,
              [entry.target.dataset.reveal]: true,
            }))
          }
        })
      },
      { threshold: 0.12 }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="landing-navbar">

        <Link to="/" className="landing-brand">
          <span className="landing-brand-icon">✦</span>

          <span>
            AI Interview
            <strong>Agent</strong>
          </span>
        </Link>


        <nav className="landing-nav">

          <a href="#home">Home</a>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#ai-engine">
            AI Engine
          </a>

        </nav>


        <div className="landing-auth">

          <button className="landing-login">
            Login
          </button>

          <button className="landing-signup">
            Sign Up
          </button>

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <main id="home">

        <section className="landing-hero">

          {/* Futuristic background */}

          <div className="landing-grid-bg"></div>

          <div className="landing-glow landing-glow-one"></div>
          <div className="landing-glow landing-glow-two"></div>

          <div className="landing-circuit circuit-one"></div>
          <div className="landing-circuit circuit-two"></div>
          <div className="landing-circuit circuit-three"></div>


          {/* HERO CONTENT */}

          <div className="landing-hero-content">

            <div className="landing-status">
              <span></span>
              AI INTERVIEWER ONLINE
            </div>


            <p className="landing-eyebrow">
              INTELLIGENT TECHNICAL INTERVIEW PLATFORM
            </p>


            <h1>

              Meet your

              <span className="landing-title-gradient">
                AI Interviewer.
              </span>

            </h1>


            <p className="landing-hero-description">

              A personalized technical interview experience that
              understands your profile, adapts to your answers,
              and helps you discover exactly where you can improve.

            </p>


            <div className="landing-hero-buttons">

              <Link
                to="/interview"
                className="landing-primary-btn"
              >
                Start Interview
                <span>→</span>
              </Link>


              <a
                href="#how-it-works"
                className="landing-outline-btn"
              >
                Explore Platform
              </a>

            </div>


            <div className="landing-trust">

              <span>
                <i>✓</i>
                Gemini Powered
              </span>

              <span>
                <i>✓</i>
                Adaptive Questions
              </span>

              <span>
                <i>✓</i>
                Real-time Analysis
              </span>

            </div>

          </div>


          {/* =================================================
              AI ROBOT
          ================================================== */}

          <div className="landing-robot-area">

            <div className="landing-robot-glow"></div>


            <div className="landing-data-ring ring-a"></div>
            <div className="landing-data-ring ring-b"></div>


            <div className="landing-robot">

              {/* antenna */}

              <div className="landing-antenna">

                <div className="landing-antenna-light"></div>

              </div>


              {/* head */}

              <div className="landing-robot-head">

                <div className="landing-robot-ear left"></div>
                <div className="landing-robot-ear right"></div>


                <div className="landing-robot-face">

                  <div className="landing-robot-eyes">

                    <span></span>
                    <span></span>

                  </div>


                  <div className="landing-robot-mouth">

                    <span></span>
                    <span></span>
                    <span></span>

                  </div>

                </div>

              </div>


              {/* neck */}

              <div className="landing-robot-neck"></div>


              {/* body */}

              <div className="landing-robot-body">

                <div className="landing-robot-chest">

                  <span>✦</span>

                </div>


                <div className="landing-robot-lines">

                  <span></span>
                  <span></span>
                  <span></span>

                </div>

              </div>

            </div>


            {/* floating information cards */}

            <div className="landing-floating-card floating-card-one">

              <span className="floating-icon">
                ✦
              </span>

              <div>

                <strong>
                  AI Reasoning
                </strong>

                <small>
                  Understanding response
                </small>

              </div>

            </div>


            <div className="landing-floating-card floating-card-two">

              <span className="floating-icon">
                ↗
              </span>

              <div>

                <strong>
                  Adaptive Mode
                </strong>

                <small>
                  Question personalized
                </small>

              </div>

            </div>


            <div className="landing-floating-card floating-card-three">

              <span className="floating-icon">
                ✓
              </span>

              <div>

                <strong>
                  Analysis Ready
                </strong>

                <small>
                  Interview intelligence
                </small>

              </div>

            </div>

          </div>


          <div className="landing-scroll-indicator">

            <span>
              SCROLL TO EXPLORE
            </span>

            <b>
              ↓
            </b>

          </div>

        </section>


        {/* =====================================================
            AI ENGINE
        ===================================================== */}

        <section
          id="ai-engine"
          className={`landing-section landing-engine landing-reveal ${
            visible.engine ? 'landing-visible' : ''
          }`}
          data-reveal="engine"
        >

          <div className="landing-section-heading">

            <span>
              01 / AI ENGINE
            </span>

            <h2>

              The interview
              <em>
                thinks with you.
              </em>

            </h2>

            <p>
              Four connected layers work together to create an
              interview that feels personalized rather than scripted.
            </p>

          </div>


          
<div className="landing-engine-flow">

  {[
    {
      number: '01',
      title: 'Candidate',
      text: 'Your profile, skills and experience.',
      icon: '◉',
      details:
        'Your candidate profile gives the AI interviewer important context such as your skills, experience, target role and technical interests.'
    },

    {
      number: '02',
      title: 'Curriculum',
      text: 'Topics and learning context.',
      icon: '▣',
      details:
        'The curriculum layer connects the interview with relevant technical topics so that questions can be aligned with what you are preparing to learn.'
    },

    {
      number: '03',
      title: 'Gemini AI',
      text: 'Reasoning and adaptive decisions.',
      icon: '✦',
      details:
        'The AI reasoning engine analyzes your previous response and decides whether the next question should go deeper, change direction or move forward.'
    },

    {
      number: '04',
      title: 'Interview',
      text: 'Questions that respond to you.',
      icon: '◈',
      details:
        'The interview layer turns everything into a personalized conversation where your answers influence the questions that come next.'
    }
  ].map((layer, index) => (

    <div
      className="landing-engine-item"
      key={layer.number}
    >

      <div
        className="landing-engine-card"
        onClick={() => setActiveLayer(layer)}
      >

        <span className="landing-card-number">
          {layer.number}
        </span>

        <div className="landing-engine-icon">
          {layer.icon}
        </div>

        <h3>
          {layer.title}
        </h3>

        <p>
          {layer.text}
        </p>

        <button
          type="button"
          className="landing-card-arrow"
          onClick={(event) => {
            event.stopPropagation()
            setActiveLayer(layer)
          }}
        >
          Explore →
        </button>

      </div>


      {index < 3 && (
        <div className="landing-flow-arrow">
          →
        </div>
      )}

    </div>

  ))}

</div>
        </section>

{activeLayer && (
  <div
    className="landing-modal-overlay"
    onClick={() => setActiveLayer(null)}
  >

    <div
      className="landing-modal"
      onClick={(event) => event.stopPropagation()}
    >

      <button
        type="button"
        className="landing-modal-close"
        onClick={() => setActiveLayer(null)}
      >
        ×
      </button>


      <div className="landing-modal-icon">
        {activeLayer.icon}
      </div>


      <span className="landing-modal-number">
        {activeLayer.number} / AI INTERVIEW LAYER
      </span>


      <h2>
        {activeLayer.title}
      </h2>


      <p>
        {activeLayer.details}
      </p>


      {activeLayer.title === 'Interview' && (
        <Link
          to="/interview"
          className="landing-primary-btn"
          onClick={() => setActiveLayer(null)}
        >
          Start Interview
          <span>→</span>
        </Link>
      )}


      {activeLayer.title !== 'Interview' && (
        <button
          type="button"
          className="landing-primary-btn"
          onClick={() => setActiveLayer(null)}
        >
          Got it
          <span>✓</span>
        </button>
      )}

    </div>

  </div>
)}

        {/* =====================================================
            ADAPTIVE INTERVIEW
        ===================================================== */}

        <section
          className={`landing-adaptive landing-reveal ${
            visible.adaptive ? 'landing-visible' : ''
          }`}
          data-reveal="adaptive"
        >

          <div className="landing-adaptive-copy">

            <span>
              02 / ADAPTIVE INTELLIGENCE
            </span>

            <h2>

              Not a fixed list
              <br />

              of questions.

            </h2>

            <p>

              Your answer becomes the context for the next question.
              The AI can go deeper, change direction or move forward
              depending on your response.

            </p>


            <div className="landing-adaptive-points">

              <div>
                <b>01</b>
                Understand your answer
              </div>

              <div>
                <b>02</b>
                Analyze technical depth
              </div>

              <div>
                <b>03</b>
                Generate the next question
              </div>

            </div>

          </div>


          <div className="landing-chat-window">

            <div className="landing-chat-top">

              <div className="landing-chat-ai">
                ✦
              </div>

              <div>
                <strong>
                  AI Interviewer
                </strong>

                <small>
                  Adaptive reasoning
                </small>
              </div>

              <span className="landing-live">
                ● LIVE
              </span>

            </div>


            <div className="landing-chat-question">

              <small>
                QUESTION
              </small>

              <p>
                Explain how a vector database helps a RAG system.
              </p>

            </div>


            <div className="landing-chat-answer">

              <span>
                YOU
              </span>

              <p>
                It stores embeddings and allows semantically similar
                information to be retrieved.
              </p>

            </div>


            <div className="landing-ai-analysis">

              <div>

                <span>
                  AI ANALYSIS
                </span>

                <strong>
                  RESPONSE UNDERSTOOD ✓
                </strong>

              </div>

              <div className="landing-analysis-line">
                <span></span>
              </div>

              <small>
                Generating deeper follow-up...
              </small>

            </div>


            <div className="landing-next-question">

              <small>
                NEXT QUESTION
              </small>

              <p>
                How would you choose an indexing strategy
                for a production vector database?
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURES
        ===================================================== */}

        <section
          id="features"
          className={`landing-section landing-features landing-reveal ${
            visible.features ? 'landing-visible' : ''
          }`}
          data-reveal="features"
        >

          <div className="landing-section-heading">

            <span>
              03 / CORE CAPABILITIES
            </span>

            <h2>

              Intelligence behind
              <em>
                every question.
              </em>

            </h2>

          </div>


          <div className="landing-feature-grid">

            {[
              [
                '01',
                'Personalized Questions',
                'Questions are selected around your profile and target skills.',
                '◉',
              ],

              [
                '02',
                'AI Follow-ups',
                'Your response can trigger deeper technical questions.',
                '✦',
              ],

              [
                '03',
                'Curriculum Aware',
                'Interview topics remain connected to your learning context.',
                '▣',
              ],

              [
                '04',
                'Performance Feedback',
                'Understand strengths, gaps and areas for improvement.',
                '↗',
              ],

            ].map(([number, title, text, icon]) => (

              <div
                className="landing-feature-card"
                key={number}
              >

                <span className="landing-card-number">
                  {number}
                </span>

                <div className="landing-feature-icon">
                  {icon}
                </div>

                <h3>
                  {title}
                </h3>

                <p>
                  {text}
                </p>

                <span className="landing-feature-line"></span>

              </div>

            ))}

          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section
          id="how-it-works"
          className={`landing-workflow landing-reveal ${
            visible.workflow ? 'landing-visible' : ''
          }`}
          data-reveal="workflow"
        >

          <div className="landing-section-heading">

            <span>
              04 / HOW IT WORKS
            </span>

            <h2>

              From your profile
              <em>
                to your feedback.
              </em>

            </h2>

          </div>


          <div className="landing-timeline">

            {[
              [
                '01',
                'Build Your Profile',
                'Your background, skills and target role become the starting context.',
              ],

              [
                '02',
                'Start Interview',
                'The AI interviewer begins with questions relevant to you.',
              ],

              [
                '03',
                'Answer & Adapt',
                'Every answer influences what the AI asks next.',
              ],

              [
                '04',
                'Understand Your Performance',
                'Review your strengths and areas that need improvement.',
              ],

            ].map(([number, title, text]) => (

              <div
                className="landing-timeline-item"
                key={number}
              >

                <div className="landing-timeline-number">
                  {number}
                </div>

                <div>

                  <h3>
                    {title}
                  </h3>

                  <p>
                    {text}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="landing-final">

          <div className="landing-final-glow"></div>

          <div className="landing-final-robot">
            ✦
          </div>

          <span>
            READY TO MEET YOUR AI INTERVIEWER?
          </span>

          <h2>

            Stop preparing for
            <em>
              generic interviews.
            </em>

          </h2>

          <p>
            Start a personalized technical interview built around you.
          </p>

          <Link
            to="/interview"
            className="landing-primary-btn landing-final-btn"
          >
            Start Interview
            <span>→</span>
          </Link>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="landing-footer">

        <div className="landing-brand">

          <span className="landing-brand-icon">
            ✦
          </span>

          <span>
            AI Interview
            <strong>Agent</strong>
          </span>

        </div>

        <p>
          Intelligent interviews. Personalized preparation.
        </p>

        <span>
          © 2026 AI Interview Agent
        </span>

      </footer>

    </div>
  )
}

export default Home