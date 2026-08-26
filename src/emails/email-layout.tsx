/**
 * Shared transactional-email layout (R9, handoff §9): 600 px table layout,
 * system-font body (Space Grotesk only as a styled heading with fallback),
 * the lime CTA as a padded <a> with bgcolor (bulletproof button — no images
 * of text), all data as HTML text. Structured so a backend can render the
 * same templates later (MJML per the handoff notes is the production source;
 * these components are the canonical copy + layout reference).
 *
 * List-Unsubscribe (R14): flips exactly the mail's own category — the send
 * layer sets the header per template (noted per file); the settings UI is
 * slice 7. Transactional mail (receipt, refund, sign-in links) is always
 * sent, said plainly — no header.
 */
import type { CSSProperties, ReactNode } from "react";

export const EMAIL_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const EMAIL_DISPLAY = "'Space Grotesk','Segoe UI',system-ui,-apple-system,sans-serif";

/* Token palette (emails can't rely on the app's CSS). */
export const EMAIL_COLORS = {
    canvas: "#EFECE6",
    sheet: "#FFFFFF",
    line: "#E5E1D8",
    midnight: "#14222D",
    charcoal: "#2B2A28",
    slate: "#46525E",
    misty: "#6D859F",
    faint: "#A2A8AE",
    lime: "#E7FE4D",
    steel: "#427AA1",
    softSky: "#EBF2FA",
    coralDeep: "#BE4437",
    amberDeep: "#B98900",
    amberWash: "#FFECBF",
    seafoamDeep: "#1E7F4F",
    limeWash: "#F9FFD2",
    limeDeep: "#3E4A00",
} as const;

/* Hidden preheader (preview text) — set per mail (handoff notes). */
export function Preheader({ text }: { text: string }) {
    return (
        <span
            style={{
                display: "none",
                fontSize: 1,
                color: EMAIL_COLORS.canvas,
                lineHeight: 1,
                maxHeight: 0,
                maxWidth: 0,
                opacity: 0,
                overflow: "hidden",
            }}
        >
            {text}
        </span>
    );
}

/* Logomark glyph positive + "Resimator" wordmark (Space Grotesk with system
   fallback). The glyph <img> uses a relative URL for the dev preview — the
   send layer rewrites asset URLs to the absolute CDN origin. */
export function EmailLogo() {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- email markup, not app UI */}
            <img src="/assets/logo/logomark-glyph-positive.svg" alt="" width={18} height={16} style={{ display: "block" }} />
            <span style={{ fontFamily: EMAIL_DISPLAY, fontWeight: 500, fontSize: 15, color: EMAIL_COLORS.midnight, letterSpacing: -0.2 }}>Resimator</span>
        </span>
    );
}

/** The 600 px sheet on the canvas: header row (logo + right meta), content,
   footer. `headerRight` = the frame's top-right meta (receipt №, badge). */
export function EmailSheet({
    preheader,
    headerRight,
    children,
    contentPadding = "22px 36px 28px",
}: {
    preheader: string;
    headerRight?: ReactNode;
    children: ReactNode;
    contentPadding?: string;
}) {
    return (
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: EMAIL_COLORS.canvas }}>
            <tbody>
                <tr>
                    <td style={{ padding: "28px 20px" }} align="center">
                        <Preheader text={preheader} />
                        <table
                            role="presentation"
                            width={600}
                            cellPadding={0}
                            cellSpacing={0}
                            style={{
                                width: 600,
                                maxWidth: "100%",
                                backgroundColor: EMAIL_COLORS.sheet,
                                border: `1px solid ${EMAIL_COLORS.line}`,
                                borderRadius: 12,
                            }}
                        >
                            <tbody>
                                <tr>
                                    <td style={{ padding: "24px 36px 0" }}>
                                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                                            <tbody>
                                                <tr>
                                                    <td align="left">
                                                        <EmailLogo />
                                                    </td>
                                                    <td
                                                        align="right"
                                                        style={{ fontFamily: EMAIL_FONT, fontSize: 11, lineHeight: 1.4, color: EMAIL_COLORS.faint }}
                                                    >
                                                        {headerRight}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: contentPadding }}>{children}</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

export function EmailHeading({ children, fontSize = 21 }: { children: ReactNode; fontSize?: number }) {
    return <div style={{ fontFamily: EMAIL_DISPLAY, fontWeight: 500, fontSize, lineHeight: 1.3, color: EMAIL_COLORS.midnight }}>{children}</div>;
}

export function EmailText({
    children,
    marginTop = 10,
    fontSize = 14,
    color = EMAIL_COLORS.slate,
}: {
    children: ReactNode;
    marginTop?: number;
    fontSize?: number;
    color?: string;
}) {
    return <div style={{ marginTop, fontFamily: EMAIL_FONT, fontWeight: 400, fontSize, lineHeight: 1.65, color }}>{children}</div>;
}

/** The lime CTA as a padded <a> with bgcolor — the bulletproof button (§9:
   "lime button as padded <a> bgcolor"). The legacy bgcolor attribute covers
   clients that drop inline styles; React's anchor types don't know it, so it
   arrives as a spread (rendered verbatim). */
export function EmailButton({ href, children, fontSize = 14 }: { href: string; children: ReactNode; fontSize?: number }) {
    const legacy = { bgcolor: "#E7FE4D" } as Record<string, string>;
    return (
        <div style={{ marginTop: 18, textAlign: "center" }}>
            <a
                href={href}
                {...legacy}
                style={{
                    display: "inline-block",
                    backgroundColor: EMAIL_COLORS.lime,
                    borderRadius: 1000,
                    padding: fontSize >= 15 ? "15px 34px" : "14px 32px",
                    fontFamily: EMAIL_FONT,
                    fontWeight: 700,
                    fontSize,
                    lineHeight: 1,
                    color: EMAIL_COLORS.midnight,
                    textDecoration: "none",
                }}
            >
                {children}
            </a>
        </div>
    );
}

/** Bordered data box (receipt rows, stat lines) — 600 px-safe table. */
export function EmailBox({ children, marginTop = 14, padding = "14px 18px" }: { children: ReactNode; marginTop?: number; padding?: string }) {
    return (
        <div
            style={{
                marginTop,
                border: `1px solid ${EMAIL_COLORS.line}`,
                borderRadius: 10,
                padding,
                fontFamily: EMAIL_FONT,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: EMAIL_COLORS.charcoal,
            }}
        >
            {children}
        </div>
    );
}

/** Two-column row inside an EmailBox (label left, value right, tabular). */
export function EmailRow({
    label,
    value,
    muted = false,
    bold = false,
    ruled = false,
}: {
    label: ReactNode;
    value: ReactNode;
    muted?: boolean;
    bold?: boolean;
    ruled?: boolean;
}) {
    const style: CSSProperties = {
        fontFamily: EMAIL_FONT,
        fontSize: muted ? 12.5 : 13.5,
        lineHeight: 1.7,
        color: muted ? EMAIL_COLORS.misty : EMAIL_COLORS.charcoal,
        fontWeight: bold ? 700 : 400,
        fontVariantNumeric: "tabular-nums",
    };
    return (
        <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={ruled ? { borderTop: `1px solid ${EMAIL_COLORS.line}`, marginTop: 8, paddingTop: 8 } : undefined}
        >
            <tbody>
                <tr>
                    <td align="left" style={style}>
                        {label}
                    </td>
                    <td align="right" style={style}>
                        {value}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

/** Stat tile row (R9-2/R9-6): label-over-value cells + an optional right slot. */
export function EmailStats({ stats, aside }: { stats: { label: string; value: string; color?: string }[]; aside?: ReactNode }) {
    return (
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ fontVariantNumeric: "tabular-nums" }}>
            <tbody>
                <tr>
                    {stats.map((s) => (
                        <td
                            key={s.label}
                            align="left"
                            style={{ paddingRight: 20, fontFamily: EMAIL_FONT, fontSize: 12, lineHeight: 1.4, color: EMAIL_COLORS.misty }}
                        >
                            {s.label}
                            <br />
                            <b style={{ fontFamily: EMAIL_DISPLAY, fontWeight: 500, fontSize: 21, lineHeight: 1.2, color: s.color ?? EMAIL_COLORS.midnight }}>
                                {s.value}
                            </b>
                        </td>
                    ))}
                    {aside ? (
                        <td align="right" style={{ fontFamily: EMAIL_FONT, fontSize: 12.5, lineHeight: 1.5, color: EMAIL_COLORS.slate }}>
                            {aside}
                        </td>
                    ) : null}
                </tr>
            </tbody>
        </table>
    );
}

/** Footer line(s), optionally ruled (receipt) or centered (alerts). */
export function EmailFooter({
    children,
    ruled = false,
    center = false,
    marginTop = 16,
}: {
    children: ReactNode;
    ruled?: boolean;
    center?: boolean;
    marginTop?: number;
}) {
    return (
        <div
            style={{
                marginTop,
                paddingTop: ruled ? 16 : 0,
                borderTop: ruled ? `1px solid ${EMAIL_COLORS.line}` : "none",
                textAlign: center ? "center" : "left",
                fontFamily: EMAIL_FONT,
                fontSize: 11.5,
                lineHeight: 1.6,
                color: EMAIL_COLORS.faint,
            }}
        >
            {children}
        </div>
    );
}

export function EmailLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a href={href} style={{ color: EMAIL_COLORS.steel, textDecoration: "underline" }}>
            {children}
        </a>
    );
}

/** Category badge pill (R9-3 LISTING CHANGED amber / R9-6 WATCH MATCH lime-wash). */
export function EmailBadge({ children, tone }: { children: ReactNode; tone: "amber" | "lime" }) {
    const colors = tone === "amber" ? { bg: EMAIL_COLORS.amberWash, fg: EMAIL_COLORS.amberDeep } : { bg: EMAIL_COLORS.limeWash, fg: EMAIL_COLORS.limeDeep };
    return (
        <span
            style={{
                display: "inline-block",
                fontFamily: EMAIL_FONT,
                fontWeight: 700,
                fontSize: 10,
                lineHeight: 1.4,
                letterSpacing: 0.5,
                padding: "3px 9px",
                borderRadius: 1000,
                backgroundColor: colors.bg,
                color: colors.fg,
            }}
        >
            {children}
        </span>
    );
}

/** Steel-ruled quote/teaser block (R9-3 "what changes" — engine-computed
   before send; the email never promises an unknown). */
export function EmailTeaser({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                marginTop: 14,
                borderLeft: `3px solid ${EMAIL_COLORS.steel}`,
                backgroundColor: EMAIL_COLORS.softSky,
                borderRadius: "0 8px 8px 0",
                padding: "10px 14px",
                fontFamily: EMAIL_FONT,
                fontSize: 12.5,
                lineHeight: 1.6,
                color: EMAIL_COLORS.midnight,
            }}
        >
            {children}
        </div>
    );
}
