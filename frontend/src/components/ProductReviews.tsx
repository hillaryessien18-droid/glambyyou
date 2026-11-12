"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createReview, errorMessage, getReviews, type Review } from "@/lib/api";
import { useStore } from "@/lib/store";

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = (
          <svg className={`w-4 h-4 ${i < value ? "text-secondary" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
        return onChange ? (
          <button key={i} type="button" onClick={() => onChange(i + 1)} aria-label={`${i + 1} star${i ? "s" : ""}`}>
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        );
      })}
    </div>
  );
}

export default function ProductReviews({ slug }: { slug: string }) {
  const { isAuthenticated, notify } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getReviews(slug)
      .then((data) => setReviews(data.results))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const review = await createReview(slug, form);
      setReviews((prev) => [review, ...prev]);
      setForm({ rating: 5, title: "", body: "" });
      notify("Thanks for your review!");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 text-sm";

  return (
    <div className="space-y-6">
      {isAuthenticated ? (
        <form onSubmit={submit} className="space-y-3 bg-nude-light/30 rounded-xl p-4">
          <p className="font-semibold text-foreground">Write a review</p>
          <Stars value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
          <input
            className={inputClass}
            placeholder="Title (optional)"
            maxLength={150}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className={inputClass}
            placeholder="What did you think?"
            required
            rows={3}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post Review"}
          </button>
        </form>
      ) : (
        <p>
          <Link href={`/auth/login?next=/products/${slug}`} className="text-primary font-semibold">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      )}

      {loading ? (
        <p className="text-foreground/40 animate-pulse">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-foreground/50">No reviews yet — be the first!</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-nude-light pb-4">
              <div className="flex items-center gap-3">
                <Stars value={r.rating} />
                {r.title && <span className="font-semibold text-foreground">{r.title}</span>}
              </div>
              <p className="mt-1">{r.body}</p>
              <p className="mt-1 text-xs text-foreground/40">
                {r.author} · {new Date(r.createdAt).toLocaleDateString()}
                {r.verifiedPurchase && <span className="ml-2 text-green-600 font-medium">✓ Verified purchase</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
