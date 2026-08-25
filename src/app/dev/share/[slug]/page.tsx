import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dict } from "@/i18n/dict";
import { parseLang } from "@/lib/i18n";
import { SITE_ORIGIN, ogShareText } from "@/lib/og";
import { getBySlug, isPublicReport } from "@/lib/store";

/**
 * /dev/share/:slug — R8-4 "Share preview · in a chat thread" as a dev surface
 * (noindex). The frame specifies a metadata CONTRACT, not a product route:
 * og:title = the two yields + flag count (the hook is the gap), og:description
 * names the free summary, and the card renders server-side per report from
 * the R8-2 template. So this page is a chat-thread mockup around the REAL
 * artifacts: the actual /r/:slug/opengraph-image render plus the ogShareText()
 * strings that generateMetadata publishes — preview and production metadata
 * can't drift. "Emoji belongs to the sender, never to us" (R8-4 annotation).
 */
export const metadata: Metadata = {
    title: "Share preview (dev)",
    robots: { index: false, follow: false },
};

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { slug } = await params;
    const sp = await searchParams;
    const lang = parseLang(sp.lang);
    const analysis = getBySlug(slug);
    if (!analysis) notFound();

    const share = ogShareText(analysis, lang, isPublicReport(analysis.id));
    const t = dict[lang].share;
    const imageUrl = `/r/${slug}/opengraph-image${lang === "en" ? "?lang=en" : ""}`;

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-3 px-4 py-8">
            <p className="text-[11px] leading-relaxed text-rsm-misty">
                R8-4 dev preview — the production surface is the /r/:slug metadata itself (og:title/description below, og:image above). Chat-thread mockup per
                the frame; the sender line and its emoji are the sender's, never ours.
            </p>
            {/* Chat app canvas (#DDE4DE per the frame). */}
            <div className="rounded-[20px] border border-rsm-hairline bg-[#DDE4DE] p-4 shadow-rsm-sm">
                {/* Incoming bubble: link unfurl + the sender's message. */}
                <div className="ml-11 rounded-[14px_14px_4px_14px] bg-white p-2 shadow-[0_1px_2px_rgba(13,13,18,.08)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- the real server-rendered OG card, not a static asset */}
                    <img src={imageUrl} alt={share.alt} width={1200} height={630} className="w-full rounded-[9px]" />
                    <div className="px-2.5 pt-2 pb-1">
                        <p className="text-[12.5px] leading-[1.35] font-bold text-rsm-midnight">{share.title}</p>
                        <p className="mt-0.5 text-[11px] leading-[1.45] text-rsm-misty">{share.description}</p>
                        <p className="mt-1 text-[10.5px] leading-[1.4] text-rsm-slate-50">{SITE_ORIGIN.replace("https://", "")}</p>
                    </div>
                    <div className="flex items-end px-2.5 pt-0.5 pb-1.5 text-[12.5px] leading-[1.4] text-rsm-charcoal">
                        <span className="whitespace-nowrap">{t.senderMessage}</span>
                        <span className="ml-auto text-[10px] text-rsm-slate-50">14:02 ✓✓</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
