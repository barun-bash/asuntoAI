/**
 * Registry for the six transactional emails (R9-1…R9-6): frame id, language,
 * subject + preview text (handoff notes: "preview text set per mail"), and
 * the List-Unsubscribe category (R14 — flips exactly its own category;
 * transactional mail is always sent, no header). Consumed by the /dev/emails
 * preview routes; the send layer takes the same templates + merge data.
 */
import type { ComponentType } from "react";
import { emailData } from "@/emails/data";
import { ListingChangedEmail } from "@/emails/listing-changed";
import { ReceiptEmail } from "@/emails/receipt";
import { RefundEmail } from "@/emails/refund";
import { ReportReadyEmail } from "@/emails/report-ready";
import { WatchMatchEmail } from "@/emails/watch-match";
import { dict } from "@/i18n/dict";
import type { Lang } from "@/lib/i18n";
import { tpl } from "@/lib/tpl";

export interface EmailEntry {
    frame: string;
    label: string;
    lang: Lang;
    subject: string;
    preheader: string;
    /** R14 category the List-Unsubscribe header flips — or "transactional"
       (always sent, said plainly, no header). */
    category: string;
    component: ComponentType<{ lang: Lang }>;
}

export const emailRegistry: Record<string, EmailEntry> = {
    "r9-1-receipt-fi": {
        frame: "R9-1",
        label: "Kuitti + sisäänkirjautuminen · Finnish",
        lang: "fi",
        subject: dict.fi.emails.receipt.subject,
        preheader: dict.fi.emails.receipt.preheader,
        category: "transactional — always sent (R14), no List-Unsubscribe",
        component: ReceiptEmail,
    },
    "r9-2-report-ready": {
        frame: "R9-2",
        label: "Report ready · English",
        lang: "en",
        subject: tpl(dict.en.emails.reportReady.subject, { addr: emailData.ready.addr }),
        preheader: tpl(dict.en.emails.reportReady.preheader, {
            gross: emailData.ready.gross.en,
            real: emailData.ready.real.en,
            n: emailData.ready.flags,
        }),
        category: "analysisDone — List-Unsubscribe flips only this category (R14)",
        component: ReportReadyEmail,
    },
    "r9-3-listing-changed": {
        frame: "R9-3",
        label: "Listing changed · owner alert",
        lang: "en",
        subject: tpl(dict.en.emails.listingChanged.subject, { delta: emailData.changed.delta, addr: emailData.changed.addr }),
        preheader: tpl(dict.en.emails.listingChanged.preheader, { delta: emailData.changed.delta }),
        category: "tracking — List-Unsubscribe + per-listing Stop watching (R14)",
        component: ListingChangedEmail,
    },
    "r9-4-receipt-en": {
        frame: "R9-4",
        label: "Receipt + sign-in · English · strings 1:1 with R9-1",
        lang: "en",
        subject: dict.en.emails.receipt.subject,
        preheader: dict.en.emails.receipt.preheader,
        category: "transactional — always sent (R14), no List-Unsubscribe",
        component: ReceiptEmail,
    },
    "r9-5-refund": {
        frame: "R9-5",
        label: "Email · credit returned",
        lang: "en",
        subject: dict.en.emails.refund.subject,
        preheader: dict.en.emails.refund.preheader,
        category: "transactional — always sent (R14), no List-Unsubscribe",
        component: RefundEmail,
    },
    "r9-6-watch-match": {
        frame: "R9-6",
        label: "Watch alert · new match · owner email",
        lang: "en",
        subject: tpl(dict.en.emails.watchMatch.subject, { addr: emailData.watch.addr, gross: emailData.watch.gross.en }),
        preheader: tpl(dict.en.emails.watchMatch.preheader, { gross: emailData.watch.gross.en }),
        category: "watch — List-Unsubscribe + per-watch stop link; digest: 2+ matches a day collapse into one email (R9-6 annotation)",
        component: WatchMatchEmail,
    },
};
