import Link from "next/link";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in — JoodLife",
};

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  // Only allow same-origin redirects — strip anything that doesn't
  // start with "/" or starts with "//".
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/profile";

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col items-stretch px-6 py-12 md:py-20">
      <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
        Welcome back
      </h1>
      <p className="mt-2 font-ui text-[15px] text-[#142e2a]/75">
        Sign in to view your orders, track your progress, and manage your
        account.
      </p>

      <div className="mt-8">
        <LoginForm redirectTo={next} />
      </div>

      <p className="mt-6 text-center font-ui text-[14px] text-[#142e2a]/75">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[#142e2a] underline underline-offset-2"
        >
          Create an account
        </Link>
      </p>
    </main>
  );
}
