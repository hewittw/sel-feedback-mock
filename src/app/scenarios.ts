/** One mock session: a story question, a discussion, a feedback check-in, then the adapted next question. */

export const story = {
  title: "Bob and the Missing Homework",
  recap:
    "Bob packed his bag the night before, but in the morning he left his homework on the kitchen table. When his teacher asked for it, his folder was empty.",
  question: "What did you think of Bob’s story, where he forgot his homework at home?",
  discussPrompts: [
    "Parent: ask the question, then give your child time to answer first.",
    "Follow up with “why do you think so?” or “what happened next?”",
    "Share a short answer of your own once your child has had a turn.",
  ],
  plannedNext: "Have you ever forgotten something important? What happened?",
};

export type ScenarioId = "none" | "positive" | "tangential" | "too-hard" | "too-personal";

export type Scenario = {
  id: ScenarioId;
  label: string;
  tone: "neutral" | "good" | "bad";
  /** The short tag shown on the home page selector. */
  summary: string;
  /** Autopopulated into the feedback box. Empty means the family skips feedback. */
  feedback: string;
  /** How the feedback was read. */
  reading: string;
  /** The rule applied to the next question. */
  change: string;
  next: string;
};

export const scenarios: Scenario[] = [
  {
    id: "none",
    label: "No feedback",
    tone: "neutral",
    summary: "The family skips the check-in.",
    feedback: "",
    reading: "No feedback was given.",
    change: "Keep the plan. The next question runs as written.",
    next: story.plannedNext,
  },
  {
    id: "positive",
    label: "Good feedback",
    tone: "good",
    summary: "The question worked and sparked talk.",
    feedback: "That question was great. We talked for a while about how Bob must have felt.",
    reading: "Positive: the question led to real conversation about feelings.",
    change: "Stay on the same theme and go one step deeper.",
    next: "Bob felt worried when he saw his empty folder. When was a time you felt worried at school, and what helped you feel better?",
  },
  {
    id: "tangential",
    label: "Bad feedback · tangential",
    tone: "bad",
    summary: "The question drifted from the point.",
    feedback: "That question felt tangential. We ended up talking about homework, not feelings.",
    reading: "Negative: the question pulled the talk away from the story’s feelings.",
    change: "Bring the next question back to the emotion at the center of the story.",
    next: "When Bob reached into his backpack and his homework wasn’t there, what feeling do you think he had in his body?",
  },
  {
    id: "too-hard",
    label: "Bad feedback · too hard",
    tone: "bad",
    summary: "The child didn’t understand the question.",
    feedback: "My child didn’t really understand the question and got stuck.",
    reading: "Negative: the question was too open for the child to answer.",
    change: "Make it simpler: a shorter question with concrete choices.",
    next: "Do you think Bob felt happy, sad, or worried when his homework wasn’t there? Point to the face that matches.",
  },
  {
    id: "too-personal",
    label: "Bad feedback · too personal",
    tone: "bad",
    summary: "The child didn’t want to talk about themself.",
    feedback: "My child got quiet. They didn’t want to talk about their own mistakes.",
    reading: "Negative: the child wasn’t ready to talk about their own experience.",
    change: "Give some distance: ask about Bob instead of the child.",
    next: "What could Bob do tonight so he remembers his homework tomorrow? What could his mom or dad do to help?",
  },
];

export const getScenario = (id: string | null | undefined) =>
  scenarios.find((s) => s.id === id) ?? scenarios[0];
