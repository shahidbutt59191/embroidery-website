"use client";

export default function AskQuestionButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
      className="w-full border-2 border-border hover:border-primary text-muted-foreground hover:text-primary py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
    >
      💬 Have a question? Chat with us
    </button>
  );
}
