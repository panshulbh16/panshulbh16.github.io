import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="font-display text-8xl font-bold tracking-[-0.05em] text-brand">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em]">Nothing here</h1>
        <p className="mt-2 text-muted-foreground">That page isn&apos;t on this site.</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-foreground px-6 py-3 font-medium text-background shadow-medium"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>
      </div>
    </main>
  );
}
