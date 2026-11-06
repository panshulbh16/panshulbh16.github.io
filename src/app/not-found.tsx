import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="text-gradient text-8xl font-semibold tracking-[-0.05em]">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink">Nothing here</h1>
        <p className="mt-2">That page isn&apos;t on this site.</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-on-accent"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>
      </div>
    </main>
  );
}
