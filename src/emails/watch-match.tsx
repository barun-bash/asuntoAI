/**
 * R9-6 — watch alert, new match. Sent only when the policy-filter toggle
 * passes (R10-5) — a watch alert is a recommendation, so the bar is high.
 * List-Unsubscribe category: watch, PLUS the per-watch stop link (R14);
 * digest rule (2+ matches in a day collapse into one email, best match on
 * top) is send-layer logic, noted here. FI subject/CTA verbatim from the
 * frame annotation ("Uusi osuma vahdissasi — läpäisee politiikkasi" /
 * "Lue maksuton yhteenveto →").
 */
import { emailData } from "@/emails/data";
import {
    EMAIL_COLORS,
    EmailBadge,
    EmailBox,
    EmailButton,
    EmailFooter,
    EmailHeading,
    EmailLink,
    EmailSheet,
    EmailStats,
    EmailText,
} from "@/emails/email-layout";
import { dict } from "@/i18n/dict";
import type { Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export function WatchMatchEmail({ lang }: { lang: Lang }) {
    const t = dict[lang].emails.watchMatch;
    const d = emailData.watch;

    return (
        <EmailSheet preheader={tpl(t.preheader, { gross: d.gross[lang] })} headerRight={<EmailBadge tone="lime">{t.badge}</EmailBadge>}>
            <EmailHeading>{tpl(t.heading, { district: d.district[lang], addr: d.addr })}</EmailHeading>
            <EmailText marginTop={8} fontSize={13.5}>
                {tpl(t.lead, { type: d.type, max: d.max })}
            </EmailText>
            <EmailBox>
                <EmailStats
                    stats={[
                        { label: t.grossLabel, value: d.gross[lang] },
                        { label: t.realLabel, value: d.real[lang] },
                        { label: t.flagsLabel, value: d.flags, color: EMAIL_COLORS.amberDeep },
                    ]}
                    aside={
                        <>
                            <b style={{ color: EMAIL_COLORS.seafoamDeep }}>{t.passLine}</b>
                            <br />
                            {tpl(t.passSub, { n: d.passN, total: d.passTotal })}
                        </>
                    }
                />
                <div
                    style={{
                        marginTop: 10,
                        borderTop: `1px solid ${EMAIL_COLORS.line}`,
                        paddingTop: 9,
                        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: EMAIL_COLORS.slate,
                    }}
                >
                    {d.metaLine[lang]}
                </div>
            </EmailBox>
            <EmailButton href={d.ctaHref}>{t.cta}</EmailButton>
            <EmailFooter center>
                {tpl(t.footerWatching, { district: d.district[lang] })}
                <br />
                <EmailLink href={d.editHref}>{t.editWatch}</EmailLink> · <EmailLink href={d.stopHref}>{t.stopWatching}</EmailLink> · {t.footerCompany}
            </EmailFooter>
        </EmailSheet>
    );
}
