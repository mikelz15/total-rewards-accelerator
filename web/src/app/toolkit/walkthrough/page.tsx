import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comp Analytical Toolkit walkthrough · Total Rewards Accelerator",
  description:
    "A 4-minute walkthrough of the Total Rewards Accelerator web app — the platform behind the Comp Analytical Toolkit.",
  robots: { index: false, follow: true },
};

export default function ToolkitWalkthroughPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Comp Analytical Toolkit walkthrough
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        A 4-minute tour of the Total Rewards Accelerator web app — the platform behind
        the Comp Analytical Toolkit.
      </p>

      <figure className="mt-8">
        <video
          className="w-full rounded-xl border border-slate-200 shadow-sm"
          controls
          preload="metadata"
          playsInline
          poster="/films/tra-toolkit-walkthrough.jpg"
          src="/films/tra-toolkit-walkthrough.mp4"
        />
        <figcaption className="mt-2 text-sm text-slate-500">
          4 minutes 13 seconds.
        </figcaption>
      </figure>

      <p className="mt-8 text-lg leading-relaxed text-slate-700">
        <a
          href="https://mikezll.gumroad.com/l/zuoetm"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-teal-700 hover:underline"
        >
          Get the Comp Analytical Toolkit on Gumroad
        </a>
      </p>

      <p className="mt-12 text-base">
        <Link href="/" className="font-medium text-teal-700 hover:underline">
          ← Back to home
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/store" className="font-medium text-teal-700 hover:underline">
          Store
        </Link>
      </p>
    </div>
  );
}
