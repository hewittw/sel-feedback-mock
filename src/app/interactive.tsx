"use client";

import Form from "next/form";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { href, type ScenarioId } from "./scenarios";

const noop = () => () => {};

/**
 * The check-in card. The server renders it with the sample answer already in the box, so it works without
 * JavaScript. Only when the step is reached by an in-app click (not a page load) does the answer type itself in.
 */
export function FeedbackForm({ mode, sample, initial }: { mode: ScenarioId; sample: string; initial?: string }) {
  // false while hydrating server HTML, true when mounted by a client-side navigation
  const clientMount = useSyncExternalStore(noop, () => true, () => false);
  const animate = useRef(clientMount && initial === undefined && sample !== "").current;
  const [text, setText] = useState(initial ?? (animate ? "" : sample));
  const [typing, setTyping] = useState(animate);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    let t = setTimeout(function tick() {
      i += 1;
      setText(sample.slice(0, i));
      if (i < sample.length) t = setTimeout(tick, 26);
      else setTyping(false);
    }, 450);
    return () => clearTimeout(t);
  }, [animate, sample]);

  return (
    <Form action="/" className="stage-form">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="step" value="4" />
      <article className="card">
        <p className="eyebrow">Check-in</p>
        <h2>Time to give feedback.</h2>
        <p className="sub">How did that question go for you two? A sentence is enough.</p>
        <div className="field">
          <label htmlFor="fb">Your feedback</label>
          <textarea
            id="fb"
            name="fb"
            value={text}
            maxLength={600}
            readOnly={typing}
            onChange={(e) => setText(e.target.value)}
            placeholder={sample ? "" : "Nothing to add this time. You can skip."}
          />
          <div className="hint">
            <span>
              {typing ? <>Filling in a sample answer <span className="caret" /></> : sample ? "Sample answer filled in. You can edit it." : "No feedback in this run."}
            </span>
            <span>{text.length} chars</span>
          </div>
        </div>
      </article>
      <div className="nav">
        <Link className="btn" href={href(mode, 2)}>← Back</Link>
        <button type="submit" className="btn btn-primary" disabled={typing}>
          {text.trim() ? "Send feedback →" : "Skip feedback →"}
        </button>
      </div>
    </Form>
  );
}

export function Timer() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="timer">
      <i className="pulse" aria-hidden />
      <b>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}</b>
      <span>talking · suggested 2–3 minutes</span>
    </div>
  );
}
