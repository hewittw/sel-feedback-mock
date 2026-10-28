import Form from "next/form";
import Link from "next/link";
import { FeedbackForm, Timer } from "./interactive";
import { getScenario, href, scenarios, story, type Scenario, type ScenarioId } from "./scenarios";

const STEPS = ["Question", "Discuss", "Feedback", "Next question", "Done"] as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The server renders every step from the URL (?mode=…&step=…&fb=…), and steps are joined by real links and
 * forms. So each step loads on its own, survives refresh and Back, and works before or without JavaScript.
 */
export default async function Page({ searchParams }: PageProps<"/">) {
  const q = await searchParams;
  const s = getScenario(one(q.mode));
  const n = Number(one(q.step));
  const step = Number.isInteger(n) && n >= 1 && n <= STEPS.length ? n : 0;

  if (!step) return <Home mode={s.id} />;

  return (
    <main className="shell">
      <div className="stage">
        <Menu s={s} step={step} />
        <StepView key={step} s={s} step={step} fb={one(q.fb)} />
      </div>
      <Foot />
    </main>
  );
}

function Foot() {
  return <p className="foot">Mock interaction · design prototype · no data is saved</p>;
}

function Home({ mode }: { mode: ScenarioId }) {
  return (
    <main className="shell">
      <Form action="/" className="home">
        <p className="eyebrow">Story time · parent and child</p>
        <h1>Read, talk, check in.</h1>
        <p className="lede">
          A short mock session. You discuss one story question together, give quick feedback on how it went,
          and see how the next question changes because of it.
        </p>
        <input type="hidden" name="step" value="1" />
        <div className="start-wrap">
          <button type="submit" className="btn btn-primary btn-hero">Start interaction</button>
        </div>

        <fieldset className="picker">
          <legend className="picker-head">
            <span className="picker-title">Feedback type</span>
            <span className="picker-sub">Pick what the family says at the check-in</span>
          </legend>
          <div className="picker-grid">
            {scenarios.map((x) => (
              <label key={x.id} className="opt">
                <span className="opt-top">
                  <i className={`dot dot-${x.tone}`} aria-hidden /> {x.label}
                  <input type="radio" name="mode" value={x.id} defaultChecked={x.id === mode} />
                </span>
                <span className="opt-desc">{x.summary}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Form>
      <Foot />
    </main>
  );
}

function Menu({ s, step }: { s: Scenario; step: number }) {
  return (
    <nav className="menu" aria-label="Session menu">
      <div className="menu-left">
        <Link className="btn btn-ghost" href={href(s.id)}>← Home</Link>
        <span className="tag tag-mode" title="Feedback type for this run">
          <i className={`dot dot-${s.tone}`} aria-hidden /> {s.label}
        </span>
      </div>
      <div className="menu-right">
        <div className="steps" role="img" aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`}>
          {STEPS.map((name, i) => <i key={name} className="step-pip" data-on={i < step} aria-hidden />)}
          <span className="step-count" aria-hidden>{step}/{STEPS.length}</span>
        </div>
        <Link className="btn btn-ghost" href={href(s.id, 1)}>↺ Restart</Link>
      </div>
    </nav>
  );
}

function StepView({ s, step, fb }: { s: Scenario; step: number; fb?: string }) {
  // Opened without feedback in the URL (a shared link): use the sample answer, as if it was sent.
  const feedback = fb ?? s.feedback;
  const changed = s.next !== story.plannedNext;

  if (step === 1)
    return (
      <>
        <article className="card">
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
          <Link className="btn btn-primary" href={href(s.id, 2)}>Start discussing →</Link>
        </div>
      </>
    );

  if (step === 2)
    return (
      <>
        <article className="card">
          <p className="eyebrow">Talk it over</p>
          <h2>Take a few minutes to discuss this together.</h2>
          <p className="sub">“{story.question}”</p>
          <ol className="prompts">
            {story.discussPrompts.map((p, i) => (
              <li key={p}><span>0{i + 1}</span>{p}</li>
            ))}
          </ol>
          <Timer />
        </article>
        <div className="nav">
          <Link className="btn" href={href(s.id, 1)}>← Back</Link>
          <Link className="btn btn-primary" href={href(s.id, 3)}>Done talking →</Link>
        </div>
      </>
    );

  if (step === 3) return <FeedbackForm mode={s.id} sample={s.feedback} initial={fb} />;

  if (step === 4)
    return (
      <>
        <article className="card">
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
          <Link className="btn" href={href(s.id, 3, feedback)}>← Back</Link>
          <Link className="btn btn-primary" href={href(s.id, 5, feedback)}>Ask this question →</Link>
        </div>
      </>
    );

  return (
    <>
      <article className="card">
        <p className="eyebrow">End of mock</p>
        <h2>That’s the full loop.</h2>
        <p className="sub">In a real session the family would now discuss question 2, and check in again after it.</p>
        <ul className="done-list">
          <li>Read a story question together</li>
          <li>Discussed it, parent and child</li>
          <li>{feedback.trim() ? "Gave feedback at the check-in" : "Skipped the check-in"}</li>
          <li>{changed ? "Got an adjusted next question" : "Kept the planned next question"}</li>
        </ul>
      </article>
      <div className="nav">
        <Link className="btn" href={href(s.id, 1)}>↺ Run again</Link>
        <Link className="btn btn-primary" href={href(s.id)}>Try another feedback type →</Link>
      </div>
    </>
  );
}
