/**
 * R9-5 — refund confirmation ("Your credit is back."). Transactional (R14
 * always-send), no List-Unsubscribe. Credit path is synchronous; the
 * money-back path is stated with its SLA ("a human confirms within one
 * business day"). FI subject from R11-FI ("Krediittisi on palautettu.").
 */
import { emailData } from "@/emails/data";
import { EMAIL_COLORS, EmailBox, EmailFooter, EmailHeading, EmailRow, EmailSheet, EmailText } from "@/emails/email-layout";
import { dict } from "@/i18n/dict";
import type { Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export function RefundEmail({ lang }: { lang: Lang }) {
    const t = dict[lang].emails.refund;
    const d = emailData.refund;

    return (
        <EmailSheet preheader={t.preheader} headerRight={tpl(t.headerRight, { n: d.no })} contentPadding="20px 36px 26px">
            <EmailHeading fontSize={20}>{t.heading}</EmailHeading>
            <EmailText marginTop={8} fontSize={13.5}>
                {tpl(t.body, { name: emailData.user.name, addr: d.addr })}
            </EmailText>
            <EmailBox padding="13px 18px">
                <EmailRow label={tpl(t.rowLabel, { n: d.reportNo })} value={t.rowValue} />
                <EmailRow label={t.balanceLabel} value={tpl(t.balanceValue, { n: d.balance })} bold ruled />
            </EmailBox>
            <EmailText marginTop={12} fontSize={12} color={EMAIL_COLORS.slate}>
                {t.moneyNote}
            </EmailText>
            <EmailFooter ruled marginTop={16}>
                {t.footer}
            </EmailFooter>
        </EmailSheet>
    );
}
