import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { LANG_COOKIE } from "@/lib/i18n";
import { RouteProvider } from "@/providers/router-provider";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
    // Canonical origin (R8-1 footer: resimator.fi); OG images resolve against it.
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://resimator.fi"),
    title: {
        default: "Resimator Report — Apartment risk report, Finland",
        template: "%s · Resimator Report",
    },
    description:
        "Paste an Oikotie or Etuovi link. In about a minute you’ll have the real yield, the renovation liability the listing doesn’t spell out, and a pass / fail against your own rules — every claim quoted from the source.",
};

export const viewport: Viewport = {
    themeColor: "#F6F3EE",
    colorScheme: "light",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // SSR html lang follows the persisted choice (R1-14); /report pins EN itself.
    const htmlLang = (await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "fi";
    return (
        <html lang={htmlLang} className={spaceGrotesk.variable}>
            <body className={cx("bg-rsm-paper font-body text-rsm-midnight antialiased")}>
                <RouteProvider>{children}</RouteProvider>
            </body>
        </html>
    );
}
