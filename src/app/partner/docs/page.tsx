import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CodeBlock } from "@/components/partner/code-block";

/* docs.resimator.fi content, served in-repo at /partner/docs (the production
   host is backend scope). Docs are EN-only — developer audience (R17-2 notes);
   product strings stay FI/EN, consumer surfaces untouched. Public page. */
export const metadata: Metadata = {
    title: "Resimator API docs · v1",
    description: "The same verdict, as JSON with its provenance attached — Bearer auth, 60 requests/min, JSON in, JSON out.",
};

/* R17-2, verbatim: the endpoint reference excerpt. The frame shortens the
   payload for print — the live response carries every figure and every flag. */
const EXAMPLE_POST = `POST /v1/analyses
Authorization: Bearer rsm_live_…
{"url":"https://asunnot.oikotie.fi/…/21966412"}

→ 202 {"id":"an_9f2c","status":"queued"}`;

const EXAMPLE_GET = `GET /v1/analyses/an_9f2c
Authorization: Bearer rsm_live_…

→ 200
{"status":"done","address":"Tuomiokirkonkatu 23 B 14, Tampere",
"figures":{"grossYield":{"value":0.091,"provenance":"mapped"},
"realYield":{"value":0.061,"provenance":"modelled"},
"liability":{"total":56400,"windowYears":[4,5],"provenance":"modelled"}},
"flags":[{"severity":"high","title":"Pipe renovation surveyed, not done",
"quote":{"fi":"Taloyhtiössä on teetetty kuntotutkimus 2024…","source":"oikotie:21966412"}}],
"grades":{"company":"C","municipality":"A"},"engine":"v2.3",
"readAt":"2026-07-29T08:40:00+03:00"}`;

/* Refusal excerpt — same shape family as the frame's example (shortened). */
const EXAMPLE_REFUSED = `GET /v1/analyses/an_7d1q

→ 200
{"status":"refused","address":"Rautatienkatu 18 C 44, Tampere",
"refusal":{"summary":"analysis refused — two extractions came back low-confidence",
"failingExtractions":["Roof year: conflict — 2011 vs 2001",
"Renovation history: unreadable scan"]},
"engine":"v2.3","billed":false}`;

/* Error shapes follow the consumer API's {error} convention (the frame prints
   only the success shapes) — flagged in the PR. */
const ERRORS = `401 {"error":"unauthorized"}      missing, revoked or expired key
422 {"error":"unsupported_url"}   not an Oikotie/Etuovi sale listing
422 {"error":"bad_webhook"}       the webhook override isn’t https
429 {"error":"rate_limited"}      over 60 requests/min · Retry-After header set
404 {"error":"not_found"}         no analysis with that id for your org`;

const WEBHOOK_VERIFY = `const crypto = require("node:crypto");

const expected =
  "sha256=" +
  crypto.createHmac("sha256", signingSecret).update(rawBody, "utf8").digest("hex");

// constant-time compare against the X-Resimator-Signature header
crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));`;

const ORG_EXAMPLE = `GET /v1/org
Authorization: Bearer rsm_live_…

→ 200
{"name":"Kiinteistömaailma Tampere Keskusta","agreementNo":"P-2026-014",
"pool":858,"tierPrice":12,"currency":"EUR","reportsThisMonth":142,
"refusedThisMonth":4,"autoInvoiceAt":100,"rateLimit":{"requestsPerMinute":60}}`;

export default function Page() {
    return (
        <main className="min-h-dvh pb-24">
            <header className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-3 px-4 py-4">
                <Link href="/" aria-label="Resimator Report" className="flex min-h-11 items-center">
                    <Image src="/assets/logo/logomark-glyph-positive.svg" alt="" width={28} height={28} priority />
                </Link>
                <Link
                    href="/partner"
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-rsm-steel underline underline-offset-2"
                >
                    Partner console →
                </Link>
            </header>

            <div className="mx-auto w-full max-w-[760px] px-4">
                <p className="tnum text-[12px] font-bold tracking-[0.08em] text-rsm-slate uppercase">docs.resimator.fi · v1</p>
                <h1 className="mt-2 font-display text-3xl font-medium text-rsm-midnight">Partner API</h1>
                <p className="mt-3 text-[15.5px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                    The same verdict, as JSON with its provenance attached. Bearer auth · 60 requests/min · JSON in, JSON out.
                </p>

                {/* Authentication */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Authentication</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        Every request carries <code className="font-mono text-[13.5px]">Authorization: Bearer &lt;key&gt;</code>. Keys are created in the
                        console and shown once — after that you see the prefix and suffix only. Rotating a key keeps the old one working for 24 hours, so you
                        can roll without downtime. Live keys (<code className="font-mono text-[13.5px]">rsm_live_…</code>) bill the prepaid pool; sandbox keys (
                        <code className="font-mono text-[13.5px]">rsm_test_…</code>) never do.
                    </p>
                </section>

                {/* Quickstart */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Run an analysis</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        POST the listing URL (Oikotie or Etuovi sale listings — the same allowlist as the consumer product). You get a 202 back immediately;
                        poll the id, or register a webhook and wait for <code className="font-mono text-[13.5px]">analysis.completed</code>. A refused analysis
                        returns <code className="font-mono text-[13.5px]">status:&quot;refused&quot;</code> with the failing extractions named — and is never
                        billed.
                    </p>
                    <CodeBlock code={EXAMPLE_POST} label="queue" />
                    <CodeBlock code={EXAMPLE_GET} label="poll · excerpt — the live payload carries every figure and flag" />
                </section>

                {/* Provenance */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Provenance is in the payload</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        Every figure carries its <code className="font-mono text-[13.5px]">provenance</code> field — observed / mapped / modelled / estimated —
                        and every flag ships the Finnish sentence it was read from. If your product hides those, that’s your audit finding, not ours.
                    </p>
                </section>

                {/* Refusals & billing */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Refusals are verdicts, not errors</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        When we can’t verify enough to underwrite a listing, the analysis completes as refused: the failing extractions are named, what WAS read
                        is included, and the pool is never charged. Refusals and re-runs within 30 days are free — identical fairness rules to retail.
                    </p>
                    <CodeBlock code={EXAMPLE_REFUSED} label="refusal · excerpt" />
                </section>

                {/* Errors */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Errors</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        One <code className="font-mono text-[13.5px]">{"{error}"}</code> shape everywhere. The rate limit is 60 requests per minute per key; the
                        429 carries a <code className="font-mono text-[13.5px]">Retry-After</code> header in seconds.
                    </p>
                    <CodeBlock code={ERRORS} label="error shapes" />
                </section>

                {/* Webhooks */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Webhooks</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        Register your endpoint in the console (or pass <code className="font-mono text-[13.5px]">webhook</code> per request). When an analysis
                        completes we POST the event <code className="font-mono text-[13.5px]">analysis.completed</code> — the body is the same JSON as{" "}
                        <code className="font-mono text-[13.5px]">GET /v1/analyses/:id</code>. Deliveries sign HMAC-SHA256 of the raw body with your signing
                        secret in the <code className="font-mono text-[13.5px]">X-Resimator-Signature</code> header, and retry 5× with exponential backoff until
                        a 2xx.
                    </p>
                    <CodeBlock code={WEBHOOK_VERIFY} label="verify the signature · node" />
                </section>

                {/* Sandbox */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Sandbox</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        Sandbox keys replay the canonical Tuomiokirkonkatu fixture deterministically — the same id (
                        <code className="font-mono text-[13.5px]">an_9f2c</code>), the same payload, every time — and never touch the pool. Build your
                        integration against it; the figures, provenance fields and Finnish quotes match the live shape one-to-one.
                    </p>
                </section>

                {/* Pool & pricing */}
                <section className="mt-10 border-t border-rsm-hairline pt-6">
                    <h2 className="font-display text-xl font-medium text-rsm-midnight">Pool &amp; pricing</h2>
                    <p className="mt-2 text-[15px] leading-[1.6] wrap-anywhere text-rsm-charcoal">
                        Reports are prepaid and pooled, volume-tiered per your agreement. One completed analysis draws one report from the pool; the console
                        auto-invoices at 100 left. Your current state is an endpoint away:
                    </p>
                    <CodeBlock code={ORG_EXAMPLE} label="org state" />
                </section>
            </div>
        </main>
    );
}
