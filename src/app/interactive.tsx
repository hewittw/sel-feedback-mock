"use client";

import Form from "next/form";
import Link, { useLinkStatus } from "next/link";
import { type ComponentProps, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { href, type ScenarioId } from "./scenarios";

const noop = () => () => {};

/** A hairline that runs along the bottom of a button while its navigation is in flight (shown after 150ms). */
function PendingBar({ pending }: { pending: boolean }) {
  return <span className="pending-bar" data-on={pending} aria-hidden />;
}

function LinkPending() {
  return <PendingBar pending={useLinkStatus().pending} />;
}

/** A Link styled as a button that shows it is working if the next step takes a moment to arrive. */
export function NavLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <LinkPending />
    </Link>
  );
}

/** The submit button of a GET <Form>, with the same pending hairline. */
export function SubmitButton({ children, className, disabled }: { children: React.ReactNode; className: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={disabled}>
      {children}
      <PendingBar pending={pending} />
    </button>
  );
}

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
      <input type="hidden" name="step" value="3" />
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
        <NavLink className="btn" href={href(mode, 1)}>← Back</NavLink>
        <SubmitButton className="btn btn-primary" disabled={typing}>
          {text.trim() ? "Send feedback →" : "Skip feedback →"}
        </SubmitButton>
      </div>
    </Form>
  );
}
