"use client";

import { useState } from "react";
import { errorMessage, sendContactMessage } from "@/lib/api";

const EMPTY = { name: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const update = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await sendContactMessage(form);
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 text-sm";

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-nude-gradient py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">Contact Us</h1>
          <p className="mt-2 text-foreground/60">Questions about an order or a product? We reply within one business day.</p>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4 py-10">
        {sent ? (
          <div className="bg-white rounded-2xl border border-nude-light/50 p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Thanks — your message is on its way.</p>
            <button onClick={() => setSent(false)} className="mt-4 text-primary font-semibold text-sm">Send another message</button>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input className={inputClass} required placeholder="Your name" aria-label="Your name" value={form.name} onChange={update("name")} />
              <input className={inputClass} required type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={update("email")} />
            </div>
            <input className={inputClass} required placeholder="Subject" aria-label="Subject" value={form.subject} onChange={update("subject")} />
            <textarea className={inputClass} required rows={5} placeholder="How can we help?" aria-label="Message" value={form.message} onChange={update("message")} />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button disabled={sending} className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark disabled:opacity-60">
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
