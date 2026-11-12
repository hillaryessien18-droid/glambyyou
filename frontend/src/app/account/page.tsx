"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { StatusBadge } from "@/components/OrderDetails";
import { useStore } from "@/lib/store";
import {
  changePassword,
  deleteAddress,
  errorMessage,
  getAddresses,
  getOrders,
  saveAddress,
  updateMe,
  type Address,
  type Order,
} from "@/lib/api";

type Tab = "orders" | "profile" | "addresses";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-nude-dark/30 bg-white focus:outline-none focus:border-primary/50 text-sm";
const buttonClass =
  "bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60";

const EMPTY_ADDRESS: Address = {
  label: "Home", firstName: "", lastName: "", phone: "", line1: "", line2: "",
  city: "", state: "", postalCode: "", country: "US", isDefault: false,
};

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data.results))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!orders) return <p className="text-foreground/40 animate-pulse">Loading orders…</p>;
  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-foreground/60">You haven&apos;t placed any orders yet.</p>
        <Link href="/products" className="mt-4 inline-block text-primary font-semibold">Start shopping</Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-nude-light">
      {orders.map((order) => (
        <li key={order.orderNumber}>
          <Link href={`/account/orders/${order.orderNumber}`} className="flex flex-wrap items-center gap-4 py-4 hover:bg-nude-light/20 px-2 rounded-xl">
            <div className="flex -space-x-3">
              {order.items.slice(0, 3).map((item) => (
                <img key={item.slug} src={item.image} alt="" className="w-11 h-11 rounded-full border-2 border-white object-cover bg-nude-light/30" />
              ))}
            </div>
            <div className="flex-1 min-w-[10rem]">
              <p className="font-semibold text-foreground">{order.orderNumber}</p>
              <p className="text-xs text-foreground/50">
                {new Date(order.createdAt).toLocaleDateString()} · {order.items.reduce((n, i) => n + i.quantity, 0)} items
              </p>
            </div>
            <StatusBadge status={order.status} />
            <p className="font-bold w-20 text-right">${Number(order.total).toFixed(2)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProfileTab() {
  const { user, setUser, notify } = useStore();
  const [profile, setProfile] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      setUser(await updateMe(profile));
      notify("Profile updated");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "" });
      notify("Password changed");
    } catch (err) {
      setPwError(errorMessage(err));
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={saveProfile} className="space-y-3">
        <h3 className="font-semibold text-foreground">Profile</h3>
        <input className={`${inputClass} bg-nude-light/30`} value={user?.email ?? ""} disabled aria-label="Email" />
        <input className={inputClass} required placeholder="Full name" aria-label="Full name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
        <input className={inputClass} placeholder="Phone" aria-label="Phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={buttonClass} disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
      </form>
      <form onSubmit={savePassword} className="space-y-3">
        <h3 className="font-semibold text-foreground">Change password</h3>
        <input className={inputClass} type="password" autoComplete="current-password" required placeholder="Current password" aria-label="Current password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} />
        <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required placeholder="New password (8+ characters)" aria-label="New password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} />
        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        <button className={buttonClass}>Update Password</button>
      </form>
    </div>
  );
}

function AddressesTab() {
  const { notify } = useStore();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [error, setError] = useState("");

  const load = () => getAddresses().then(setAddresses).catch((err) => setError(errorMessage(err)));
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError("");
    try {
      await saveAddress(editing);
      setEditing(null);
      notify("Address saved");
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (id: number) => {
    await deleteAddress(id).catch(() => notify("Couldn't delete address", "error"));
    load();
  };

  const field = (key: keyof Address, placeholder: string, required = true) => (
    <input
      className={inputClass}
      placeholder={placeholder}
      aria-label={placeholder}
      required={required}
      value={String(editing?.[key] ?? "")}
      onChange={(e) => setEditing((a) => (a ? { ...a, [key]: e.target.value } : a))}
    />
  );

  if (editing) {
    return (
      <form onSubmit={submit} className="space-y-3 max-w-lg">
        <div className="grid grid-cols-2 gap-3">{field("firstName", "First name")}{field("lastName", "Last name")}</div>
        {field("label", "Label (e.g. Home, Work)")}
        {field("line1", "Address")}
        {field("line2", "Apartment, suite (optional)", false)}
        <div className="grid grid-cols-2 gap-3">{field("city", "City")}{field("state", "State / Region")}</div>
        <div className="grid grid-cols-2 gap-3">{field("postalCode", "Postal code")}{field("country", "Country code (e.g. US)")}</div>
        {field("phone", "Phone (optional)", false)}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} className="accent-primary" />
          Use as default address
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-nude-dark/30 text-sm font-semibold">Cancel</button>
          <button className={buttonClass}>Save Address</button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {!addresses ? (
        <p className="text-foreground/40 animate-pulse">Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <p className="text-foreground/60">No saved addresses yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="border border-nude-light rounded-xl p-4 text-sm">
              <p className="font-semibold">
                {a.label} {a.isDefault && <span className="ml-1 text-xs text-primary">Default</span>}
              </p>
              <p className="text-foreground/70">{a.firstName} {a.lastName}</p>
              <p className="text-foreground/70">{a.line1}{a.line2 && `, ${a.line2}`}</p>
              <p className="text-foreground/70">{a.city}, {a.state} {a.postalCode}, {a.country}</p>
              <div className="mt-2 flex gap-3 text-xs font-semibold">
                <button onClick={() => setEditing(a)} className="text-primary">Edit</button>
                <button onClick={() => a.id && remove(a.id)} className="text-foreground/50 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setEditing({ ...EMPTY_ADDRESS })} className={buttonClass}>Add Address</button>
    </div>
  );
}

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const { user, logout } = useStore();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <div className="bg-nude-gradient py-12">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">My Account</h1>
            <p className="mt-2 text-foreground/60">Welcome back, {user?.name}</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {(["orders", "profile", "addresses"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${tab === t ? "bg-primary text-white" : "bg-white border border-nude-light text-foreground/60"}`}
              >
                {t}
              </button>
            ))}
            <Link href="/wishlist" className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-nude-light text-foreground/60">
              Wishlist
            </Link>
            <button onClick={logout} className="ml-auto text-sm text-foreground/50 hover:text-primary">Sign out</button>
          </div>
          <div className="bg-white rounded-2xl border border-nude-light/50 p-6">
            {tab === "orders" && <OrdersTab />}
            {tab === "profile" && <ProfileTab />}
            {tab === "addresses" && <AddressesTab />}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
