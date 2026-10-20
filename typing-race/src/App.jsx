import { useEffect, useRef, useState } from 'react'
import { generatePassage } from './words.js'
import './App.css'

// Placeholder opponent data. NOT real Monkeytype stats.
const OPPONENT = { wpm: 70, accuracy: 96 }

function Header({ onToggleSettings }) {
  return (
    <header className="header">
      <h1 className="logo">Type Race</h1>
      <nav className="nav">
        <a href="#" className="nav-link active">Race</a>
        <button
          type="button"
          className="icon-button"
          onClick={onToggleSettings}
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </button>
      </nav>
    </header>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function ProgressBar({ percent, label }) {
  return (
    <div
      className="bar"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="bar-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}

function Passage({ passage, typed }) {
  return (
    <p className="passage" aria-label="Passage to type">
      {passage.split('').map((char, i) => {
        let status = 'untyped'
        if (i < typed.length) status = typed[i] === char ? 'correct' : 'incorrect'
        if (i === typed.length) status += ' current'
        return (
          <span key={i} className={status}>
            {char}
          </span>
        )
      })}
    </p>
  )
}

function App() {
  const [wordCount, setWordCount] = useState(50)
  const [passage, setPassage] = useState(() => generatePassage(50))
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState('idle') // idle | racing | finished
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0) // seconds
  const [showSettings, setShowSettings] = useState(false)
  const inputRef = useRef(null)

  // Tick the clock while racing.
  useEffect(() => {
    if (status !== 'racing') return
    const id = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 200)
    return () => clearInterval(id)
  }, [status, startTime])

  function startRace() {
    setPassage(generatePassage(wordCount)) // one passage, shared by both players
    setTyped('')
    setElapsed(0)
    setStartTime(Date.now())
    setStatus('racing')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function restart() {
    setPassage(generatePassage(wordCount))
    setTyped('')
    setElapsed(0)
    setStatus('idle')
  }

  function handleChange(e) {
    const value = e.target.value.slice(0, passage.length)
    setTyped(value)
    if (value.length === passage.length) {
      setElapsed((Date.now() - startTime) / 1000)
      setStatus('finished')
    }
  }

  // Simple local stats: 1 word = 5 characters.
  let correctChars = 0
  for (let i = 0; i < typed.length; i++) if (typed[i] === passage[i]) correctChars++
  const minutes = elapsed / 60
  const wpm = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0
  const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100
  const progress = (typed.length / passage.length) * 100

  // Placeholder opponent progress: what a steady typist at OPPONENT.wpm would have typed.
  const opponentChars = OPPONENT.wpm * 5 * minutes
  const opponentProgress = Math.min(100, (opponentChars / passage.length) * 100)

  return (
    <div className="app">
      <Header onToggleSettings={() => setShowSettings((s) => !s)} />

      {showSettings && (
        <section className="settings">
          <label>
            Words
            <select
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              disabled={status === 'racing'}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
            </select>
          </label>
          <span className="muted">Takes effect on the next race.</span>
        </section>
      )}

      <main className="main">
        <section className="panel">
          <h2 className="panel-title">My Monkeytype Stats</h2>
          <div className="stats">
            <Stat label="avg wpm" value={OPPONENT.wpm} />
            <Stat label="accuracy" value={`${OPPONENT.accuracy}%`} />
          </div>
          <ProgressBar percent={opponentProgress} label="Opponent progress" />
          <p className="note">Placeholder values, not real data.</p>
        </section>

        <Passage passage={passage} typed={typed} />

        <input
          ref={inputRef}
          className="typing-input"
          type="text"
          value={typed}
          onChange={handleChange}
          disabled={status !== 'racing'}
          placeholder={status === 'racing' ? 'Start typing…' : 'Press Start Race to begin'}
          aria-label="Type the passage here"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onPaste={(e) => e.preventDefault()}
        />

        <section className="panel">
          <h2 className="panel-title">You</h2>
          <div className="stats">
            <Stat label="wpm" value={wpm} />
            <Stat label="accuracy" value={`${accuracy}%`} />
            <Stat label="progress" value={`${Math.round(progress)}%`} />
          </div>
          <ProgressBar percent={progress} label="Your progress" />
          {status === 'finished' && (
            <p className="result">
              Finished: {wpm} wpm vs {OPPONENT.wpm} wpm (placeholder).
            </p>
          )}
        </section>

        <div className="controls">
          <button type="button" className="button primary" onClick={startRace} disabled={status === 'racing'}>
            Start Race
          </button>
          <button type="button" className="button" onClick={restart}>
            Restart
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
