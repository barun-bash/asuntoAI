"use client";

import { useState } from "react";
import { useLang } from "@/providers/lang";

/**
 * "Make page public" (R7-2 footer, secondary button) — the owner's visibility
 * toggle for the public page (R8). Public is the default ("public = free
 * summary, always"); flipping private delists the page from recents and drops
 * it to noindex + the private-generic OG card (R8-5d). Writes go through
 * POST /api/r/:slug/visibility — owner-only at the store boundary. The frame
 * shows a bare button with no surrounding UI, so the label flip carries the
 * state (aria-pressed mirrors it).
 */
export function PublicToggle({ slug, initialPublic }: { slug: string; initialPublic: boolean }) {
    const { t } = useLang();
    const [isPublic, setIsPublic] = useState(initialPublic);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(false);

    async function toggle() {
        if (pending) return;
        setPending(true);
        setError(false);
        try {
            const res = await fetch(`/api/r/${slug}/visibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ public: !isPublic }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = (await res.json()) as { public: boolean };
            setIsPublic(data.public);
        } catch {
            setError(true);
        } finally {
            setPending(false);
        }
    }

    return (
        <span className="inline-flex items-center gap-2">
            <button
                type="button"
                onClick={toggle}
                disabled={pending}
                aria-pressed={isPublic}
                title={isPublic ? t.publicPage.visibilityOn : t.publicPage.visibilityOff}
                className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-rsm-midnight shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)] transition-colors duration-200 ease-rsm hover:shadow-[inset_0_0_0_1px_var(--color-rsm-steel)] disabled:opacity-50"
            >
                {isPublic ? t.publicPage.makePrivate : t.publicPage.makePublic}
            </button>
            {error ? (
                <span role="alert" className="text-xs text-rsm-coral-deep">
                    {t.publicPage.visibilityError}
                </span>
            ) : null}
        </span>
    );
}
