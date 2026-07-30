"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupportedListingUrl } from "@/lib/listing-url";
import { EXAMPLE_URL } from "@/mocks/fixtures";
import { useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

const SEEN_KEY = "asunto:analysis-run";

/**
 * Paste bar (R1-1/3/12 + R15-1 example chip).
 * - autofocus; paste of a valid URL auto-submits after 300 ms; Enter submits
 * - validated as you type; error is aria-live polite + aria-invalid, never a toast
 * - submitting swaps the label for a spinner ≤150 ms, width locked, input read-only
 */
export function PasteBar() {
    const { t } = useLang();
    const router = useRouter();
    const [value, setValue] = useState("");
    const [touched, setTouched] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showExample, setShowExample] = useState(false);
    const pasteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const valid = isSupportedListingUrl(value);
    const showError = touched && value.trim().length > 0 && !valid;

    useEffect(() => {
        // The example chip shows on first visit only (R15-1).
        try {
            if (!window.localStorage.getItem(SEEN_KEY)) setShowExample(true);
        } catch {
            /* private mode — chip simply stays hidden */
        }
    }, []);

    const submit = async (url: string) => {
        if (submitting || !isSupportedListingUrl(url)) return;
        setSubmitting(true);
        try {
            window.localStorage.setItem(SEEN_KEY, "1");
        } catch {
            /* ignore */
        }
        const res = await fetch("/api/analyses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });
        if (res.status === 202) {
            const { id } = (await res.json()) as { id: string };
            router.push(`/analysing/${id}`);
            return;
        }
        setSubmitting(false);
        setTouched(true);
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        void submit(value);
    };

    const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const text = event.clipboardData.getData("text");
        if (pasteTimer.current) clearTimeout(pasteTimer.current);
        if (isSupportedListingUrl(text)) {
            pasteTimer.current = setTimeout(() => void submit(text), 300);
        }
    };

    return (
        <div className="flex w-full flex-col gap-3">
            <form onSubmit={onSubmit} aria-busy={submitting} className="flex w-full flex-col gap-3 md:flex-row">
                <div className="flex-1">
                    <label htmlFor="listing-url" className="sr-only">
                        {t.landing.inputLabel}
                    </label>
                    <input
                        id="listing-url"
                        name="url"
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        autoFocus
                        value={value}
                        readOnly={submitting}
                        aria-invalid={showError}
                        aria-describedby={showError ? "listing-url-error" : undefined}
                        onChange={(event) => {
                            setValue(event.target.value);
                            setTouched(true);
                        }}
                        onBlur={() => setTouched(true)}
                        onPaste={onPaste}
                        placeholder={t.landing.placeholder}
                        className={cx(
                            "tnum min-h-14 w-full rounded-rsm-input border bg-white px-4 text-[15px] text-rsm-midnight transition-colors duration-200 ease-rsm outline-none placeholder:text-rsm-misty-75",
                            showError ? "border-[1.5px] border-rsm-coral" : "border-rsm-hairline focus:border-rsm-steel",
                        )}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!valid || submitting}
                    className={cx(
                        "inline-flex min-h-14 min-w-44 items-center justify-center gap-2 rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight",
                        "shadow-rsm-chip transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rsm-steel",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                >
                    {submitting ? (
                        <>
                            <span
                                aria-hidden
                                className="size-4 animate-spin rounded-full border-2 border-rsm-midnight/30 border-t-rsm-midnight motion-reduce:animate-none"
                            />
                            {t.landing.submitting}
                        </>
                    ) : (
                        t.landing.submit
                    )}
                </button>
            </form>

            <div aria-live="polite">
                {showError ? (
                    <div id="listing-url-error" role="status" className="flex flex-col gap-1">
                        <p className="text-sm font-medium wrap-anywhere text-rsm-coral">{t.landing.unsupported}</p>
                        <p className="text-xs text-rsm-misty">{t.landing.unsupportedNote}</p>
                    </div>
                ) : null}
            </div>

            {showExample ? (
                <button
                    type="button"
                    onClick={() => {
                        setValue(EXAMPLE_URL);
                        void submit(EXAMPLE_URL);
                    }}
                    className="flex min-h-11 flex-col items-start gap-0.5 self-start rounded-rsm-tile border border-rsm-hairline bg-white px-4 py-2 text-left shadow-rsm-chip transition-colors duration-200 ease-rsm hover:border-rsm-steel-50"
                >
                    <span className="text-xs text-rsm-misty">{t.landing.exampleChipKicker}</span>
                    <span className="text-sm font-bold text-rsm-steel">
                        {t.landing.exampleChip} <span className="font-medium text-rsm-misty">· {t.landing.exampleChipNote}</span>
                    </span>
                </button>
            ) : null}
        </div>
    );
}
