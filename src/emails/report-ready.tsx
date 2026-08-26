/**
 * R9-2 — report ready ("sent because you started an analysis and closed the
 * tab. Nothing was charged."). List-Unsubscribe category: analysisDone (R14 —
 * flips exactly its category, never a whole-account kill).
 */
import { emailData } from "@/emails/data";
import { EMAIL_COLORS, EmailBox, EmailButton, EmailFooter, EmailHeading, EmailLink, EmailSheet, EmailStats } from "@/emails/email-layout";
import { dict } from "@/i18n/dict";
import type { Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export function ReportReadyEmail({ lang }: { lang: Lang }) {
    const t = dict[lang].emails.reportReady;
    const d = emailData.ready;

    return (
        <EmailSheet preheader={tpl(t.preheader, { gross: d.gross[lang], real: d.real[lang], n: d.flags })}>
            <EmailHeading>{tpl(t.heading, { addr: d.addr })}</EmailHeading>
            <EmailBox>
                <EmailStats
                    stats={[
                        { label: t.grossLabel, value: d.gross[lang] },
                        { label: t.realLabel, value: d.real[lang] },
                        { label: t.flagsLabel, value: d.flags, color: EMAIL_COLORS.coralDeep },
                    ]}
                    aside={
                        <>
                            {t.verdictLine}
                            <br />
                            {tpl(t.policyLine, { preset: d.preset[lang], n: d.fails, total: d.total })}
                        </>
                    }
                />
            </EmailBox>
            <EmailButton href={d.ctaHref}>{t.cta}</EmailButton>
            <EmailFooter center>
                {t.whySent}
                <br />
                {t.footerCompany} · <EmailLink href={d.ctaHref}>{t.unsubscribe}</EmailLink>
            </EmailFooter>
        </EmailSheet>
    );
}
