"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEUR } from "@/lib/format";
import type { PartnerConsoleData, PartnerKeyKind, PartnerKeyRow } from "@/lib/types";
import { cx } from "@/utils/cx";

/** A secret shown exactly once (creation / rotation, R17 notes). */
interface Reveal {
    heading: string;
    secret: string;
    note: string;
}

/**
 * Partner console (R17-1): agreement register, usage tiles, the keys table
 * (masked prefix…suffix; rotate = 24 h overlap; revoke immediate), and the
 * webhook card (URL + signing secret). EN-only — the console follows the
 * frames' language; copy not printed on the frame is composed in register and
 * flagged in the PR. No secrets in props — shown-once values arrive from the
 * console API responses only.
 */
export function PartnerConsoleView({ initial }: { initial: PartnerConsoleData }) {
    const [keys, setKeys] = useState<PartnerKeyRow[]>(initial.keys);
    const [webhook, setWebhook] = useState(initial.webhook);
    const [reveal, setReveal] = useState<Reveal | null>(null);
    const [chooserOpen, setChooserOpen] = useState(false);
    const [kind, setKind] = useState<PartnerKeyKind>("live");
    const [pending, setPending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState(false);
    const [webhookDraft, setWebhookDraft] = useState(initial.webhook.url);
    const [webhookError, setWebhookError] = useState(false);
    const [secretOpen, setSecretOpen] = useState(false);
    const [armingRevoke, setArmingRevoke] = useState<string | null>(null);

    async function createKey() {
        if (pending) return;
        setPending(true);
        try {
            const res = await fetch("/api/partner/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = (await res.json()) as { row: PartnerKeyRow; secret: string };
            setKeys((ks) => [...ks, data.row]);
            setChooserOpen(false);
            setReveal({
                heading: "Key created — shown once",
                secret: data.secret,
                note: "Copy it now. After this it’s prefix and suffix only — we can’t show it again.",
            });
        } finally {
            setPending(false);
        }
    }

    async function rotateKey(id: string) {
        if (pending) return;
        setPending(true);
        try {
            const res = await fetch(`/api/partner/keys/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "rotate" }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = (await res.json()) as { row: PartnerKeyRow; secret: string; retiringRow: PartnerKeyRow };
            setKeys((ks) => [...ks.map((k) => (k.id === data.retiringRow.id ? data.retiringRow : k)), data.row]);
            setReveal({
                heading: "Key rotated — shown once",
                secret: data.secret,
                note: `The previous key keeps working for 24 hours (until ${data.retiringRow.retiresDisplay}), then retires.`,
            });
        } finally {
            setPending(false);
        }
    }

    async function revokeKey(id: string) {
        if (armingRevoke !== id) {
            setArmingRevoke(id);
            return;
        }
        setArmingRevoke(null);
        if (pending) return;
        setPending(true);
        try {
            const res = await fetch(`/api/partner/keys/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(String(res.status));
            const data = (await res.json()) as { row: PartnerKeyRow };
            setKeys((ks) => ks.map((k) => (k.id === data.row.id ? data.row : k)));
        } finally {
            setPending(false);
        }
    }

    async function saveWebhook() {
        if (pending) return;
        setPending(true);
        setWebhookError(false);
        try {
            const res = await fetch("/api/partner/webhook", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: webhookDraft.trim() }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = (await res.json()) as { webhook: PartnerConsoleData["webhook"] };
            setWebhook(data.webhook);
            setEditingWebhook(false);
        } catch {
            setWebhookError(true);
        } finally {
            setPending(false);
        }
    }

    async function rotateSecret() {
        if (pending) return;
        setPending(true);
        try {
            const res = await fetch("/api/partner/webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "rotate-secret" }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = (await res.json()) as { secret: string; maskedSecret: string };
            setWebhook((w) => ({ ...w, maskedSecret: data.maskedSecret }));
            setReveal({
                heading: "Signing secret rotated — shown once",
                secret: data.secret,
                note: "Update your endpoint’s signature check now — deliveries sign with the new secret from the next analysis on.",
            });
        } finally {
            setPending(false);
        }
    }

    function copySecret(secret: string) {
        void navigator.clipboard?.writeText(secret).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <div className="mx-auto w-full max-w-[1120px] px-4 md:px-8">
            {/* Register head (R17-1): console title, org, agreement line. */}
            <div className="flex flex-wrap items-start justify-between gap-4 pt-4">
                <div>
                    <h1 className="font-display text-3xl font-medium text-rsm-midnight">Partner console</h1>
                    <p className="mt-2 text-lg font-medium wrap-anywhere text-rsm-midnight">{initial.name}</p>
                    <p className="tnum mt-1 text-[13px] wrap-anywhere text-rsm-slate">
                        partner since {initial.partnerSince} · agreement № {initial.agreementNo} · {initial.email}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setChooserOpen((v) => !v)}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75"
                >
                    New API key
                </button>
            </div>

            {/* Usage tiles (R17-1 verbatim captions). */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-rsm-tile border border-rsm-hairline bg-white p-4">
                    <p className="text-[13px] font-medium text-rsm-slate">Reports this month</p>
                    <p className="tnum mt-1.5 font-display text-3xl font-medium text-rsm-midnight">{initial.reportsThisMonth}</p>
                    <p className="tnum mt-1 text-[12.5px] text-rsm-slate">volume tier · {formatEUR(initial.tierPrice, "en")}/report</p>
                </div>
                <div className="rounded-rsm-tile border border-rsm-hairline bg-white p-4">
                    <p className="text-[13px] font-medium text-rsm-slate">Prepaid pool</p>
                    <p className="tnum mt-1.5 font-display text-3xl font-medium text-rsm-midnight">{initial.pool}</p>
                    <p className="tnum mt-1 text-[12.5px] text-rsm-slate">reports left · auto-invoice at {initial.autoInvoiceAt}</p>
                </div>
                <div className="rounded-rsm-tile border border-rsm-hairline bg-white p-4">
                    <p className="text-[13px] font-medium text-rsm-slate">Refused runs</p>
                    <p className="tnum mt-1.5 font-display text-3xl font-medium text-rsm-midnight">{initial.refusedThisMonth}</p>
                    <p className="mt-1 text-[12.5px] text-rsm-slate">this month · not charged, ever</p>
                </div>
            </div>

            {/* New-key kind chooser (composed — the frame shows the button only). */}
            {chooserOpen ? (
                <div className="mt-4 rounded-rsm-tile border border-rsm-hairline bg-white p-4">
                    <p className="text-sm font-medium text-rsm-midnight">Key type</p>
                    <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Key type">
                        {(["live", "sandbox"] as const).map((k) => (
                            <label
                                key={k}
                                className={cx(
                                    "inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 ease-rsm sm:flex-none",
                                    kind === k
                                        ? "border-rsm-steel bg-rsm-steel-25/40 text-rsm-midnight"
                                        : "border-rsm-hairline bg-white text-rsm-charcoal hover:border-rsm-steel-50",
                                )}
                            >
                                <input type="radio" name="key-kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                                {k === "live" ? "Live" : "Sandbox"}
                            </label>
                        ))}
                    </div>
                    <p className="mt-2 text-[12.5px] leading-[1.5] text-rsm-slate">
                        Sandbox keys replay the canonical fixture and never touch the pool. Live keys bill per completed report.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={createKey}
                            disabled={pending}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 disabled:opacity-50"
                        >
                            Create key
                        </button>
                        <button
                            type="button"
                            onClick={() => setChooserOpen(false)}
                            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:text-rsm-midnight"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Shown-once card (keys + signing secret). */}
            {reveal ? (
                <div role="status" className="mt-4 rounded-rsm-tile border border-rsm-steel bg-rsm-steel-25/30 p-4">
                    <p className="text-sm font-bold text-rsm-midnight">{reveal.heading}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <code className="tnum rounded-[10px] border border-rsm-hairline bg-white px-3 py-2 font-mono text-[13px] break-all text-rsm-midnight">
                            {reveal.secret}
                        </code>
                        <button
                            type="button"
                            onClick={() => copySecret(reveal.secret)}
                            className="inline-flex min-h-11 items-center rounded-full border border-rsm-hairline bg-white px-4 text-sm font-medium text-rsm-midnight transition-colors duration-200 ease-rsm hover:border-rsm-steel"
                        >
                            {copied ? "Copied ✓" : "Copy"}
                        </button>
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{reveal.note}</p>
                    <button
                        type="button"
                        onClick={() => setReveal(null)}
                        className="mt-2 inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-steel underline underline-offset-2"
                    >
                        Done
                    </button>
                </div>
            ) : null}

            {/* Keys table (R17-1 anatomy: Key · Created · Last used · Actions). */}
            <div className="mt-6 overflow-hidden rounded-rsm-tile border border-rsm-hairline bg-white">
                <div className="grid grid-cols-[minmax(0,1.5fr)_100px_110px_130px] gap-3 border-b border-rsm-hairline px-4 py-2.5 text-[11px] font-bold tracking-[0.06em] text-rsm-slate uppercase max-md:hidden">
                    <span>Key</span>
                    <span>Created</span>
                    <span>Last used</span>
                    <span>Actions</span>
                </div>
                {keys.map((k) => (
                    <div
                        key={k.id}
                        className={cx(
                            "grid gap-2 border-b border-rsm-row-line px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_100px_110px_130px] md:items-center md:gap-3",
                            k.status === "revoked" && "opacity-55",
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <code className="tnum font-mono text-[13.5px] text-rsm-midnight">{k.masked}</code>
                            <span
                                className={cx(
                                    "inline-flex min-h-6 items-center rounded-full px-2 text-[10.5px] font-bold tracking-[0.05em]",
                                    k.kind === "live" ? "bg-rsm-midnight text-rsm-paper" : "text-rsm-steel shadow-[inset_0_0_0_1px_var(--color-rsm-steel)]",
                                )}
                            >
                                {k.kind === "live" ? "LIVE" : "SANDBOX"}
                            </span>
                            {k.status === "retiring" ? (
                                <span className="tnum inline-flex min-h-6 items-center rounded-full bg-rsm-amber-25 px-2 text-[10.5px] font-bold text-rsm-amber-deep">
                                    RETIRING · until {k.retiresDisplay}
                                </span>
                            ) : null}
                            {k.status === "revoked" ? (
                                <span className="inline-flex min-h-6 items-center rounded-full px-2 text-[10.5px] font-bold text-rsm-slate shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]">
                                    REVOKED
                                </span>
                            ) : null}
                        </div>
                        <p className="tnum text-[13px] text-rsm-charcoal">
                            <span className="mr-2 text-[11px] font-bold text-rsm-slate uppercase md:hidden">Created</span>
                            {k.createdDisplay}
                        </p>
                        <p className="tnum text-[13px] text-rsm-charcoal">
                            <span className="mr-2 text-[11px] font-bold text-rsm-slate uppercase md:hidden">Last used</span>
                            {k.lastUsedDisplay}
                        </p>
                        <div className="flex items-center gap-1">
                            {k.status !== "revoked" ? (
                                <button
                                    type="button"
                                    onClick={() => rotateKey(k.id)}
                                    disabled={pending}
                                    className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-steel underline underline-offset-2 transition-colors duration-200 ease-rsm hover:text-rsm-steel-75 disabled:opacity-50"
                                >
                                    Rotate
                                </button>
                            ) : null}
                            {/* The frame puts Revoke on the live row only. */}
                            {k.kind === "live" && k.status !== "revoked" ? (
                                <button
                                    type="button"
                                    onClick={() => revokeKey(k.id)}
                                    disabled={pending}
                                    className={cx(
                                        "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium underline underline-offset-2 transition-colors duration-200 ease-rsm disabled:opacity-50",
                                        armingRevoke === k.id ? "text-rsm-coral-deep" : "text-rsm-charcoal hover:text-rsm-coral-deep",
                                    )}
                                >
                                    {armingRevoke === k.id ? "Sure?" : "Revoke"}
                                </button>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            {/* Webhook card (R17-1: URL · DELIVERING · Edit · signing secret). */}
            <div className="mt-4 rounded-rsm-tile border border-rsm-hairline bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-rsm-midnight">Webhook</p>
                        {webhook.delivering ? (
                            <span className="inline-flex min-h-6 items-center rounded-full bg-rsm-seafoam-25 px-2 text-[10.5px] font-bold tracking-[0.05em] text-rsm-seafoam-deep">
                                DELIVERING
                            </span>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingWebhook((v) => !v);
                                setWebhookDraft(webhook.url);
                                setWebhookError(false);
                            }}
                            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-steel underline underline-offset-2"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => setSecretOpen((v) => !v)}
                            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-steel underline underline-offset-2"
                        >
                            Signing secret
                        </button>
                    </div>
                </div>
                {editingWebhook ? (
                    <div className="mt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="url"
                                value={webhookDraft}
                                onChange={(e) => setWebhookDraft(e.target.value)}
                                aria-label="Webhook URL"
                                aria-invalid={webhookError}
                                className="tnum min-h-12 w-full max-w-[420px] rounded-rsm-input border border-rsm-hairline bg-white px-3.5 font-mono text-[13.5px] text-rsm-midnight outline-none focus:border-rsm-steel"
                            />
                            <button
                                type="button"
                                onClick={saveWebhook}
                                disabled={pending}
                                className="inline-flex min-h-11 items-center justify-center rounded-full bg-rsm-lime px-5 text-sm font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                        {webhookError ? (
                            <p role="alert" className="mt-1.5 text-sm font-medium text-rsm-coral-deep">
                                Needs to be a full https URL.
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <p className="tnum mt-1.5 font-mono text-[13.5px] break-all text-rsm-charcoal">{webhook.url}</p>
                )}
                {secretOpen ? (
                    <div className="mt-3 border-t border-rsm-row-line pt-3">
                        <p className="tnum text-[13px] text-rsm-charcoal">
                            Signing secret <code className="font-mono text-rsm-midnight">{webhook.maskedSecret}</code>
                        </p>
                        <button
                            type="button"
                            onClick={rotateSecret}
                            disabled={pending}
                            className="mt-1 inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-rsm-steel underline underline-offset-2 disabled:opacity-50"
                        >
                            Rotate secret
                        </button>
                    </div>
                ) : null}
                <p className="mt-3 text-[12.5px] leading-[1.5] wrap-anywhere text-rsm-slate">
                    Deliveries sign HMAC-SHA256 (X-Resimator-Signature) and retry 5× with exponential backoff. The event is analysis.completed — the body is the
                    same JSON as GET /v1/analyses/:id.
                </p>
            </div>

            {/* Usage / rate-limit note + docs link (R17 notes). */}
            <p className="mt-4 text-[12.5px] leading-[1.5] wrap-anywhere text-rsm-slate">
                60 requests/min per key — past that, 429 with a Retry-After header. Refused analyses and re-runs within 30 days are never billed — the same
                fairness rules as retail.{" "}
                <Link href="/partner/docs" className="font-medium text-rsm-steel underline underline-offset-2">
                    API docs →
                </Link>
            </p>
        </div>
    );
}
