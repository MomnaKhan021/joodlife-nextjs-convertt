import Link from "next/link";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create account — JoodLife",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col items-stretch px-6 py-12 md:py-20">
      <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
        Create your account
      </h1>
      <p className="mt-2 font-ui text-[15px] text-[#142e2a]/75">
        Get started in seconds — no insurance needed.
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-6 text-center font-ui text-[14px] text-[#142e2a]/75">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#142e2a] underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
