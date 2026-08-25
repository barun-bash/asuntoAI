/**
 * R9-3 — listing changed (owner alert). The "what changes" teaser is
 * engine-computed before send (R9-3 annotation: the email never promises an
 * unknown) — it arrives as merge data (src/emails/data.ts), bolds included.
 * List-Unsubscribe category: tracking (R14); the per-object mute is the
 * "Stop watching" link.
 */
import { emailData } from "@/emails/data";
import { EmailBadge, EmailButton, EmailFooter, EmailHeading, EmailLink, EmailSheet, EmailTeaser, EmailText } from "@/emails/email-layout";
import { dict } from "@/i18n/dict";
import type { Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export function ListingChangedEmail({ lang }: { lang: Lang }) {
    const t = dict[lang].emails.listingChanged;
    const d = emailData.changed;

    return (
        <EmailSheet preheader={tpl(t.preheader, { delta: d.delta })} headerRight={<EmailBadge tone="amber">{t.badge}</EmailBadge>}>
            <EmailHeading>{tpl(t.heading, { delta: d.delta, addr: d.addr })}</EmailHeading>
            <EmailText>
                {t.bodyPre} <b style={{ color: "#14222D" }}>{d.now}</b> {tpl(t.bodyWas, { was: d.was })}. {t.bodyTail}
            </EmailText>
            <EmailTeaser>{d.teaser[lang].map((seg, i) => ("strong" in seg ? <b key={i}>{seg.strong}</b> : <span key={i}>{seg.text}</span>))}</EmailTeaser>
            <EmailButton href={d.ctaHref}>{t.cta}</EmailButton>
            <EmailFooter center>
                {t.footerWatching} · <EmailLink href={d.stopHref}>{t.stopWatching}</EmailLink> · {t.footerCompany}
            </EmailFooter>
        </EmailSheet>
    );
}
