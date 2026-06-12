import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] font-mono text-white">
      <Link href="/output" className="underline underline-offset-4 hover:opacity-80">
        Open Output
      </Link>
      <Link href="/input" className="underline underline-offset-4 hover:opacity-80">
        Open Input
      </Link>
    </main>
  );
}
