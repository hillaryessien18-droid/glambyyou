"use client";

import { useEffect, useState } from "react";
import { testimonials as fallback, type Testimonial } from "@/lib/data";
import { getTestimonials } from "@/lib/api";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallback);

  useEffect(() => {
    getTestimonials()
      .then((data) => data.length && setTestimonials(data))
      .catch(() => undefined);
  }, []);

  return (
    <section className="py-20 bg-soft-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-medium uppercase tracking-[0.2em] mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            What Our Customers Say
          </h2>
          <p className="mt-3 text-foreground/60 max-w-md mx-auto">
            Real reviews from real people who love GlowByYou
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 border border-nude-light/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < testimonial.rating ? "text-secondary" : "text-gray-200"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed mb-5">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 shrink-0 rounded-full object-cover bg-nude-light"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-foreground/50">{testimonial.location}</p>
                </div>
              </div>
              {testimonial.product && (
                <p className="mt-3 text-xs text-primary font-medium">
                  Verified Buyer &mdash; {testimonial.product}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
