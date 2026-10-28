"use client";

import { useEffect, useRef, useState } from "react";
import { getScenario, scenarios, story, type Scenario, type ScenarioId } from "./scenarios";

const STEPS = ["Question", "Discuss", "Feedback", "Next question", "Done"] as const;

export function Session() {
  const [mode, setMode] = useState<ScenarioId>("none");
  const [step, setStep] = useState(-1); // -1 = home
  const s = getScenario(mode);

  // Let a link open with a feedback type picked: ?mode=tangential
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    if (m && scenarios.some((x) => x.id === m)) setMode(m as ScenarioId);
  }, []);

  const pick = (id: ScenarioId) => {
    setMode(id);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", id);
    window.history.replaceState(null, "", url);
  };

  useEffect(() => window.scrollTo({ top: 0 }), [step]);

  if (step < 0) return <Home mode={mode} onPick={pick} onStart={() => setStep(0)} />;

  return (
    <main className="shell">
      <div className="stage">
        <nav className="menu" aria-label="Session menu">
          <div className="menu-left">
            <button className="btn btn-ghost" onClick={() => setStep(-1)}>← Home</button>
            <span className="tag tag-mode" title="Feedback type for this run">
              <i className={`dot dot-${s.tone}`} aria-hidden /> {s.label}
            </span>
          </div>
          <div className="menu-right">
            <div className="steps" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
              {STEPS.map((name, i) => <i key={name} className="step-pip" data-on={i <= step} aria-hidden />)}
              <span className="step-count">{step + 1}/{STEPS.length}</span>
            </div>
            <button className="btn btn-ghost" onClick={() => setStep(0)}>↺ Restart</button>
          </div>
        </nav>

        <Step step={step} s={s} onNext={() => setStep(step + 1)} onBack={() => setStep(step - 1)} onHome={() => setStep(-1)} onRestart={() => setStep(0)} />
      </div>
      <p className="foot">Mock interaction · design prototype · no data is saved</p>
    </main>
  );
}

function Home({ mode, onPick, onStart }: { mode: ScenarioId; onPick: (id: ScenarioId) => void; onStart: () => void }) {
  return (
    <main className="shell">
      <div className="home">
        <p className="eyebrow">Story time · parent and child</p>
        <h1>Read, talk, check in.</h1>
        <p className="lede">
          A short mock session. You discuss one story question together, give quick feedback on how it went,
          and see how the next question changes because of it.
        </p>
        <div className="start-wrap">
          <button className="btn btn-primary btn-hero" onClick={onStart}>Start interaction</button>
        </div>

        <section className="picker" aria-labelledby="picker-h">
          <div className="picker-head">
            <h2 id="picker-h">Feedback type</h2>
            <span>Pick what the family says at the check-in</span>
          </div>
          <div className="picker-grid" role="radiogroup" aria-labelledby="picker-h">
            {scenarios.map((x) => (
              <button
                key={x.id}
                role="radio"
                aria-checked={x.id === mode}
                className="opt"
                onClick={() => onPick(x.id)}
              >
                <span className="opt-top">
                  <i className={`dot dot-${x.tone}`} aria-hidden /> {x.label}
                  <span className="opt-check" aria-hidden>✓</span>
                </span>
                <span className="opt-desc">{x.summary}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <p className="foot">Mock interaction · design prototype · no data is saved</p>
    </main>
  );
}

type StepProps = { step: number; s: Scenario; onNext: () => void; onBack: () => void; onHome: () => void; onRestart: () => void };

function Step({ step, s, onNext, onBack, onHome, onRestart }: StepProps) {
  const [feedback, setFeedback] = useState("");
  const typing = useTypewriter(step === 2 ? s.feedback : "", setFeedback);
  const changed = s.next !== story.plannedNext;

  if (step === 0)
    return (
      <>
        <article className="card" key="q">
          <p className="eyebrow">Question 1</p>
          <div className="recap">
            <div className="title">{story.title}</div>
            <p>{story.recap}</p>
          </div>
          <h2>{story.question}</h2>
          <p className="who">Read this out loud together.</p>
        </article>
        <div className="nav">
          <span />
          <button className="btn btn-primary" onClick={onNext}>Start discussing →</button>
        </div>
      </>
    );

  if (step === 1)
    return (
      <>
        <article className="card" key="d">
          <p className="eyebrow">Talk it over</p>
          <h2>Take a few minutes to discuss this together.</h2>
          <p style={{ marginTop: 14 }}>“{story.question}”</p>
          <ol className="prompts">
            {story.discussPrompts.map((p, i) => (
              <li key={p}><span>0{i + 1}</span>{p}</li>
            ))}
          </ol>
          <Timer />
        </article>
        <div className="nav">
          <button className="btn" onClick={onBack}>← Back</button>
          <button className="btn btn-primary" onClick={onNext}>Done talking →</button>
        </div>
      </>
    );

  if (step === 2)
    return (
      <>
        <article className="card" key="f">
          <p className="eyebrow">Check-in</p>
          <h2>Time to give feedback.</h2>
          <p style={{ marginTop: 14 }}>How did that question go for you two? A sentence is enough.</p>
          <div className="field">
            <label htmlFor="fb">Your feedback</label>
            <textarea
              id="fb"
              value={feedback}
              readOnly={typing}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={s.feedback ? "" : "Nothing to add this time. You can skip."}
            />
            <div className="hint">
              <span>{typing ? <>Filling in a sample answer <span className="caret" /></> : s.feedback ? "Sample answer filled in. You can edit it." : "No feedback in this run."}</span>
              <span>{feedback.length} chars</span>
            </div>
          </div>
        </article>
        <div className="nav">
          <button className="btn" onClick={onBack}>← Back</button>
          <button className="btn btn-primary" onClick={onNext} disabled={typing}>
            {feedback.trim() ? "Send feedback →" : "Skip feedback →"}
          </button>
        </div>
      </>
    );

  if (step === 3)
    return (
      <>
        <article className="card" key="n">
          <p className="eyebrow">Question 2</p>
          <h2>{changed ? "Your next question was adjusted." : "Your next question stays the same."}</h2>
          <div className="compare">
            <div className="q q-old" data-replaced={changed}>
              <div className="q-label">Originally planned</div>
              <div className="q-text">{story.plannedNext}</div>
            </div>
            <div className="arrow">{s.change}</div>
            <div className="q q-new">
              <div className="q-label">
                <i className={`dot dot-${s.tone}`} aria-hidden /> {changed ? "New question" : "Next question"}
              </div>
              <div className="q-text">{s.next}</div>
            </div>
          </div>
          <dl className="why">
            <dt>Feedback</dt>
            <dd className={feedback ? "quote" : undefined}>{feedback ? `“${feedback}”` : "None given"}</dd>
            <dt>Read as</dt>
            <dd>{s.reading}</dd>
          </dl>
        </article>
        <div className="nav">
          <button className="btn" onClick={onBack}>← Back</button>
          <button className="btn btn-primary" onClick={onNext}>Ask this question →</button>
        </div>
      </>
    );

  return (
    <>
      <article className="card" key="e">
        <p className="eyebrow">End of mock</p>
        <h2>That’s the full loop.</h2>
        <p style={{ marginTop: 14 }}>In a real session the family would now discuss question 2, and check in again after it.</p>
        <ul className="done-list">
          <li>Read a story question together</li>
          <li>Discussed it, parent and child</li>
          <li>{feedback.trim() ? "Gave feedback at the check-in" : "Skipped the check-in"}</li>
          <li>{changed ? "Got an adjusted next question" : "Kept the planned next question"}</li>
        </ul>
      </article>
      <div className="nav">
        <button className="btn" onClick={onRestart}>↺ Run again</button>
        <button className="btn btn-primary" onClick={onHome}>Try another feedback type →</button>
      </div>
    </>
  );
}

/** Types `text` into the box once when it changes; returns true while typing. */
function useTypewriter(text: string, set: (v: string) => void) {
  const [typing, setTyping] = useState(false);
  const setRef = useRef(set);
  setRef.current = set;
  useEffect(() => {
    if (!text) return;
    setRef.current("");
    setTyping(true);
    let i = 0;
    const start = setTimeout(function tick() {
      i += 1;
      setRef.current(text.slice(0, i));
      if (i < text.length) t = setTimeout(tick, 26);
      else setTyping(false);
    }, 500);
    let t = start;
    return () => clearTimeout(t);
  }, [text]);
  return typing;
}

function Timer() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="timer" aria-live="off">
      <i className="pulse" aria-hidden />
      <b>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}</b>
      <span>talking · suggested 2–3 minutes</span>
    </div>
  );
}
