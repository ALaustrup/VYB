import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center p-6">
      <div className="glass-panel p-6">
        <SignUp />
      </div>
    </section>
  );
}
