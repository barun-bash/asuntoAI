/**
 * R9-1 (FI) / R9-4 (EN) — receipt + sign-in, strings 1:1 between the frames.
 * Transactional: always sent (R14 "Receipts, refunds and sign-in links —
 * always send"), so NO List-Unsubscribe header; the receipt satisfies FI
 * bookkeeping (VAT rows, Y-tunnus/Business ID).
 */
import { emailData } from "@/emails/data";
import { EmailBox, EmailButton, EmailFooter, EmailHeading, EmailLink, EmailRow, EmailSheet, EmailText } from "@/emails/email-layout";
import { dict } from "@/i18n/dict";
import type { Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export function ReceiptEmail({ lang }: { lang: Lang }) {
    const t = dict[lang].emails.receipt;
    const d = emailData.receipt;

    return (
        <EmailSheet preheader={t.preheader} headerRight={tpl(t.headerRight, { n: d.no })} contentPadding="26px 36px 30px">
            <EmailHeading fontSize={22}>{t.heading}</EmailHeading>
            <EmailText>{tpl(t.greeting, { name: emailData.user.name })}</EmailText>
            <EmailBox marginTop={20} padding="16px 20px">
                <EmailRow label={d.packName[lang]} value={d.price[lang]} />
                <EmailRow label={t.vatLabel} value={d.vat[lang]} muted />
                <EmailRow label={tpl(t.usedLabel, { addr: d.usedOn })} value={t.creditUnit} muted />
                <EmailRow label={t.remainingLabel} value={tpl(t.remainingValue, { n: d.remaining })} bold ruled />
            </EmailBox>
            <EmailButton href={d.ctaHref} fontSize={15}>
                {t.cta}
            </EmailButton>
            <EmailText marginTop={10} fontSize={11.5} color="#A2A8AE">
                <span style={{ display: "block", textAlign: "center" }}>{t.linkNote}</span>
            </EmailText>
            <EmailFooter ruled marginTop={22}>
                {t.footerCompany}
                <br />
                {t.footerReply} <EmailLink href={d.privacyHref}>{t.privacy}</EmailLink>
            </EmailFooter>
        </EmailSheet>
    );
}
