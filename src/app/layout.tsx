import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], variable: "--serif-face" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--sans-face" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--mono-face" });

export const metadata: Metadata = {
  title: "Story Time Check-in · Mock Interaction",
  description:
    "A mock parent–child story session: discuss a question together, give quick feedback, and see how the next question adapts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {/* Remember what someone types into the feedback box before React hydrates, so it can be restored after. */}
        <script dangerouslySetInnerHTML={{ __html: "addEventListener('input',function(e){if(e.target&&e.target.id==='fb')window.__fbEarly=e.target.value},true)" }} />
        {children}
      </body>
    </html>
  );
}
