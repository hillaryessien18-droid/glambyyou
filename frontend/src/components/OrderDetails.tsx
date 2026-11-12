import Link from "next/link";
import type { Order } from "@/lib/api";

const money = (n: number) => `$${Number(n).toFixed(2)}`;

export const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export function StatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

const TIMELINE: Order["status"][] = ["confirmed", "shipped", "delivered"];

export default function OrderDetails({ order }: { order: Order }) {
  const reached = TIMELINE.indexOf(order.status);

  return (
    <div className="bg-white rounded-2xl border border-nude-light/50 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-foreground/40">Order</p>
          <p className="text-lg font-bold text-foreground">{order.orderNumber}</p>
          <p className="text-xs text-foreground/50">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== "cancelled" && (
        <ol className="flex items-center gap-2 text-xs">
          {TIMELINE.map((s, i) => (
            <li key={s} className="flex items-center gap-2 flex-1">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${i <= reached ? "bg-green-500 text-white" : "bg-nude-light text-foreground/40"}`}>
                {i <= reached ? "✓" : i + 1}
              </span>
              <span className={`capitalize ${i <= reached ? "text-foreground" : "text-foreground/40"}`}>{s}</span>
              {i < TIMELINE.length - 1 && <span className="flex-1 h-px bg-nude-light" />}
            </li>
          ))}
        </ol>
      )}
      {order.trackingNumber && (
        <p className="text-sm text-foreground/70">Tracking number: <span className="font-semibold">{order.trackingNumber}</span></p>
      )}

      <ul className="divide-y divide-nude-light">
        {order.items.map((item) => (
          <li key={`${item.slug}-${item.productId}`} className="flex gap-3 py-3">
            <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-nude-light/30" />
            <div className="flex-1 min-w-0">
              {item.productId ? (
                <Link href={`/products/${item.slug}`} className="text-sm font-medium text-foreground hover:text-primary">{item.name}</Link>
              ) : (
                <p className="text-sm font-medium text-foreground">{item.name}</p>
              )}
              <p className="text-xs text-foreground/50">{item.quantity} × {money(item.unitPrice)}</p>
            </div>
            <p className="text-sm font-semibold">{money(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="grid sm:grid-cols-2 gap-6 text-sm">
        <div>
          <p className="font-semibold text-foreground mb-1">Shipping address</p>
          <p className="text-foreground/70">{order.shipping.firstName} {order.shipping.lastName}</p>
          <p className="text-foreground/70">{order.shipping.line1}{order.shipping.line2 && `, ${order.shipping.line2}`}</p>
          <p className="text-foreground/70">{order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}, {order.shipping.country}</p>
          <p className="mt-2 text-foreground/50 capitalize">
            {order.paymentMethod.replaceAll("_", " ")} · {order.paymentStatus}
          </p>
        </div>
        <dl className="space-y-1">
          <div className="flex justify-between"><dt className="text-foreground/60">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{money(order.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-foreground/60">Shipping</dt><dd>{order.shippingCost > 0 ? money(order.shippingCost) : "Free"}</dd></div>
          <div className="flex justify-between"><dt className="text-foreground/60">Tax</dt><dd>{money(order.tax)}</dd></div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-nude-light"><dt>Total</dt><dd>{money(order.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
