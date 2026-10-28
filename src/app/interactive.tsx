"use client";

import Form from "next/form";
import Link, { useLinkStatus } from "next/link";
import { type ComponentProps, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { href, type ScenarioId } from "./scenarios";

const noop = () => () => {};

/**
 * A hairline that runs along the bottom of a button while its navigation is in flight (shown after 150ms).
 * If the step still hasn't arrived after 8s (a stalled connection), fall back to a normal page load.
 */
function PendingBar({ pending, fallback }: { pending: boolean; fallback: () => string | null }) {
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      const url = fallbackRef.current();
      if (url) window.location.assign(url);
    }, 8000);
    return () => clearTimeout(t);
  }, [pending]);
  return <span className="pending-bar" data-on={pending} aria-hidden />;
}

function LinkPending({ to }: { to: string }) {
  return <PendingBar pending={useLinkStatus().pending} fallback={() => to} />;
}

/** A Link styled as a button that shows it is working if the next step takes a moment to arrive. */
export function NavLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <LinkPending to={String(props.href)} />
    </Link>
  );
}

/** The submit button of a GET <Form>, with the same pending hairline and fallback. */
export function SubmitButton({ children, className, disabled }: { children: React.ReactNode; className: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const ref = useRef<HTMLButtonElement>(null);
  const fallback = () => {
    const form = ref.current?.form;
    if (!form) return null;
    const q = new URLSearchParams();
    new FormData(form).forEach((v, k) => q.append(k, String(v)));
    return `${form.getAttribute("action") ?? "/"}?${q}`;
  };
  return (
    <button ref={ref} type="submit" className={className} disabled={disabled}>
      {children}
      <PendingBar pending={pending} fallback={fallback} />
    </button>
  );
}

const draftKey = (mode: ScenarioId) => `fb-draft:${mode}`;

/** Forgets any feedback draft when a new run starts (Question 1). */
export function ClearDraft({ mode }: { mode: ScenarioId }) {
  useEffect(() => {
    try { sessionStorage.removeItem(draftKey(mode)); } catch {}
  }, [mode]);
  return null;
}

/**
 * The check-in card. The server renders it with the sample answer already in the box, so it works without
 * JavaScript. Only when the step is reached by an in-app click (not a page load) does the answer type itself in.
 */
export function FeedbackForm({ mode, sample, initial }: { mode: ScenarioId; sample: string; initial?: string }) {
  // false while hydrating server HTML, true when mounted by a client-side navigation
  const clientMount = useSyncExternalStore(noop, () => true, () => false);
  const box = useRef<HTMLTextAreaElement>(null);
  // What was sent last time (browser Back from Question 2 lands here without it in the URL).
  const draft = useRef<string | null>(null);
  if (draft.current === null && clientMount && typeof window !== "undefined") {
    try { draft.current = sessionStorage.getItem(draftKey(mode)) ?? ""; } catch { draft.current = ""; }
  }
  const restored = initial ?? (draft.current || undefined);
  const animate = useRef(clientMount && restored === undefined && sample !== "").current;
  // The box is uncontrolled, so hydration never overwrites what someone typed before the page finished loading.
  const [text, setText] = useState(restored ?? (animate ? "" : sample));
  const [typing, setTyping] = useState(animate);

  // After hydration, adopt whatever is in the box (typed early, or a stored draft on a hard load).
  useEffect(() => {
    const el = box.current;
    if (!el || animate) return;
    let stored = "";
    try { stored = initial === undefined ? sessionStorage.getItem(draftKey(mode)) ?? "" : ""; } catch {}
    if (stored && el.value === sample) el.value = stored;
    const early = (window as { __fbEarly?: string }).__fbEarly;
    if (early !== undefined) { el.value = early; delete (window as { __fbEarly?: string }).__fbEarly; }
    setText(el.value);
  }, [animate, initial, mode, sample]);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    let t = setTimeout(function tick() {
      i += 1;
      const v = sample.slice(0, i);
      if (box.current) box.current.value = v;
      setText(v);
      if (i < sample.length) t = setTimeout(tick, 26);
      else setTyping(false);
    }, 450);
    return () => clearTimeout(t);
  }, [animate, sample]);

  const remember = () => {
    try { sessionStorage.setItem(draftKey(mode), box.current?.value ?? ""); } catch {}
  };

  return (
    <Form action="/" className="stage-form" onSubmit={remember}>
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
            ref={box}
            defaultValue={restored ?? (animate ? "" : sample)}
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
