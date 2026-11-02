import Form from "next/form";
import { ClearDraft, FeedbackForm, NavLink, SubmitButton } from "./interactive";
import { getRating, getScenario, href, ratings, scenarios, story, type Scenario, type ScenarioId } from "./scenarios";

const STEPS = ["Question", "Rating", "Elaborate", "Next question", "Done"] as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The server renders every step from the URL (?mode=…&step=…&r=…&fb=…), and steps are joined by real links and
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
        <StepView key={step} s={s} step={step} r={one(q.r)} fb={one(q.fb)} />
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
          <SubmitButton className="btn btn-primary btn-hero">Start interaction</SubmitButton>
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
        <NavLink className="btn btn-ghost" href={href(s.id)}>← Home</NavLink>
        <span className="tag tag-mode" title="Feedback type for this run">
          <i className={`dot dot-${s.tone}`} aria-hidden /> {s.label}
        </span>
      </div>
      <div className="menu-right">
        <div className="steps" role="img" aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`}>
          {STEPS.map((name, i) => <i key={name} className="step-pip" data-on={i < step} aria-hidden />)}
          <span className="step-count" aria-hidden>{step}/{STEPS.length}</span>
        </div>
        <NavLink className="btn btn-ghost" href={href(s.id, 1)}>↺ Restart</NavLink>
      </div>
    </nav>
  );
}

function StepView({ s, step, r, fb }: { s: Scenario; step: number; r?: string; fb?: string }) {
  // Opened without a rating or feedback in the URL (a shared link): use the sample answers, as if they were sent.
  const rating = getRating(r ?? s.rating);
  const rated = rating?.id ?? "";
  const feedback = fb ?? s.feedback;
  const changed = s.next !== story.plannedNext;

  if (step === 1)
    return (
      <>
        <ClearDraft mode={s.id} />
        <article className="card">
          <p className="eyebrow">Question 1</p>
          <div className="recap">
            <div className="title">{story.title}</div>
            <p>{story.recap}</p>
          </div>
          <h2>{story.question}</h2>
          <p className="who">Read it out loud, then talk it over together.</p>
        </article>
        <div className="nav">
          <span />
          <NavLink className="btn btn-primary" href={href(s.id, 2)}>Done talking →</NavLink>
        </div>
      </>
    );

  if (step === 2)
    return (
      <>
        <article className="card">
          <p className="eyebrow">Check-in</p>
          <h2>How did that question go?</h2>
          <p className="sub">Tap the face that fits.</p>
          <div className="faces" role="group" aria-label="How did that question go?">
            {ratings.map((x) => (
              <NavLink
                key={x.id}
                className="face"
                href={href(s.id, 3, { r: x.id })}
                aria-current={r === x.id ? "true" : undefined}
              >
                <span className="face-emoji" aria-hidden>{x.face}</span>
                <span className="face-label">{x.label}</span>
                {x.id === s.rating && <span className="face-sample">Sample</span>}
              </NavLink>
            ))}
          </div>
          <p className="who">{s.rating ? "The sample answer for this run is marked. Any face works." : "No rating in this run. You can skip."}</p>
        </article>
        <div className="nav">
          <NavLink className="btn" href={href(s.id, 1)}>← Back</NavLink>
          <NavLink className="btn" href={href(s.id, 3, { r: "" })}>Skip →</NavLink>
        </div>
      </>
    );

  if (step === 3) return <FeedbackForm mode={s.id} rating={rated} sample={s.feedback} initial={fb} />;

  if (step === 4)
    return (
      <>
        <article className="card">
          <p className="eyebrow">Question 2</p>
          <h2>{changed ? "Your next question was adjusted." : "Your next question stays the same."}</h2>
          <p className="sub">Based on your rating and what you wrote about it.</p>
          <div className="compare">
            <div className="q q-old">
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
            <dt>Rating</dt>
            <dd className="fb-rating">{rating ? `${rating.face} ${rating.label}` : "None given"}</dd>
            <dt>Feedback</dt>
            <dd className={feedback.trim() ? "fb-text quote" : "fb-text"}>{feedback.trim() ? `“${feedback.trim()}”` : "None given"}</dd>
            <dt>Read as</dt>
            <dd>{s.reading}</dd>
          </dl>
        </article>
        <div className="nav">
          <NavLink className="btn" href={href(s.id, 3, { r: rated, fb: feedback })}>← Back</NavLink>
          <NavLink className="btn btn-primary" href={href(s.id, 5, { r: rated, fb: feedback })}>Ask this question →</NavLink>
        </div>
      </>
    );

  return (
    <>
      <article className="card">
        <p className="eyebrow">End of mock</p>
        <h2>That’s the full loop.</h2>
        <p className="sub">In a real session the family would now discuss question 2, then rate and elaborate again after it.</p>
        <ul className="done-list">
          <li>Read a story question together</li>
          <li>Discussed it, parent and child</li>
          <li>{rating ? `Rated the question ${rating.face}` : "Skipped the rating"}</li>
          <li>{feedback.trim() ? "Elaborated on the rating" : "Skipped elaborating"}</li>
          <li>{changed ? "Got an adjusted next question" : "Kept the planned next question"}</li>
        </ul>
      </article>
      <div className="nav">
        <NavLink className="btn" href={href(s.id, 1)}>↺ Run again</NavLink>
        <NavLink className="btn btn-primary" href={href(s.id)}>Try another feedback type →</NavLink>
      </div>
    </>
  );
}
