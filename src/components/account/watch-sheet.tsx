"use client";

import { useEffect, useState } from "react";
import { SheetDialog } from "@/components/account/sheet-dialog";
import { Toggle } from "@/components/base/toggle/toggle";
import type { Watch, WatchType } from "@/lib/types";
import { tpl, useLang } from "@/providers/lang";
import { cx } from "@/utils/cx";

const TYPES: WatchType[] = ["yksio", "2h", "3h+"];

/**
 * Watch edit sheet (R10-5): the saved query {district, type, maxPrice,
 * policyFilter} — matches run the free summary automatically, 0 credits until
 * an unlock, at most one email a day. Save → POST /api/account/watch; Stop
 * watching → DELETE. The match runner itself is the tracking slice (R12), so
 * "matches this month" reads 0 here.
 */
export function WatchSheet({
    watch,
    open,
    onClose,
    onSaved,
}: {
    watch: Watch | undefined;
    open: boolean;
    onClose: () => void;
    onSaved: (watch: Watch | undefined) => void;
}) {
    const { t } = useLang();
    const [district, setDistrict] = useState(watch?.district ?? "");
    const [type, setType] = useState<WatchType>(watch?.type ?? "2h");
    const [maxPrice, setMaxPrice] = useState(watch?.maxPrice != null ? String(watch.maxPrice) : "");
    const [policyFilter, setPolicyFilter] = useState(watch?.policyFilter ?? true);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (open) {
            setDistrict(watch?.district ?? "");
            setType(watch?.type ?? "2h");
            setMaxPrice(watch?.maxPrice != null ? String(watch.maxPrice) : "");
            setPolicyFilter(watch?.policyFilter ?? true);
            setError(false);
        }
    }, [open, watch]);

    async function save() {
        if (pending) return;
        if (!district.trim()) {
            setError(true);
            return;
        }
        // Max price is optional in the R10-5 frame — empty means no cap (null),
        // never a silent 0 € ceiling.
        const trimmed = maxPrice.trim();
        const cap = trimmed === "" ? null : Number(trimmed);
        if (cap !== null && (!Number.isFinite(cap) || cap < 0)) {
            setError(true);
            return;
        }
        setPending(true);
        setError(false);
        try {
            const res = await fetch("/api/account/watch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ district: district.trim(), type, maxPrice: cap, policyFilter }),
            });
            if (!res.ok) throw new Error(String(res.status));
            onSaved((await res.json()) as Watch);
            onClose();
        } catch {
            setError(true);
        } finally {
            setPending(false);
        }
    }

    async function stop() {
        if (pending) return;
        setPending(true);
        try {
            await fetch("/api/account/watch", { method: "DELETE" });
            onSaved(undefined);
            onClose();
        } finally {
            setPending(false);
        }
    }

    return (
        <SheetDialog open={open} onClose={onClose} label={watch ? tpl(t.watch.title, { district: watch.district }) : t.watch.titleNew}>
            <h2 className="pr-10 font-display text-xl font-medium wrap-anywhere text-rsm-midnight">
                {watch ? tpl(t.watch.title, { district: watch.district }) : t.watch.titleNew}
            </h2>
            {watch ? <p className="tnum mt-1.5 text-[13px] text-rsm-slate">{tpl(t.watch.matches, { n: 0 })}</p> : null}
            <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="watch-district" className="text-sm font-medium text-rsm-midnight">
                        {t.watch.districtLabel}
                    </label>
                    <input
                        id="watch-district"
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder={t.watch.districtPlaceholder}
                        aria-invalid={error}
                        className="min-h-12 w-full rounded-rsm-input border border-rsm-hairline bg-white px-3.5 text-[15px] text-rsm-midnight outline-none placeholder:text-rsm-slate-50 focus:border-rsm-steel"
                    />
                    {error ? (
                        <p role="alert" className="text-sm font-medium text-rsm-coral-deep">
                            {t.watch.errDistrict}
                        </p>
                    ) : null}
                </div>
                <fieldset>
                    <legend className="text-sm font-medium text-rsm-midnight">{t.watch.typeLabel}</legend>
                    <div className="mt-2 flex gap-2" role="radiogroup" aria-label={t.watch.typeLabel}>
                        {TYPES.map((key) => (
                            <label
                                key={key}
                                className={cx(
                                    "inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 ease-rsm",
                                    type === key
                                        ? "border-rsm-steel bg-rsm-steel-25/40 text-rsm-midnight"
                                        : "border-rsm-hairline bg-white text-rsm-charcoal hover:border-rsm-steel-50",
                                )}
                            >
                                <input type="radio" name="watch-type" value={key} checked={type === key} onChange={() => setType(key)} className="sr-only" />
                                {t.watch.types[key]}
                            </label>
                        ))}
                    </div>
                </fieldset>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="watch-maxprice" className="text-sm font-medium text-rsm-midnight">
                        {t.watch.maxPriceLabel}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="watch-maxprice"
                            type="number"
                            min={0}
                            step={1000}
                            inputMode="numeric"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="130 000"
                            className="tnum min-h-12 w-full rounded-rsm-input border border-rsm-hairline bg-white px-3.5 text-[15px] text-rsm-midnight outline-none placeholder:text-rsm-slate-50 focus:border-rsm-steel"
                        />
                        <span aria-hidden className="tnum text-[15px] text-rsm-slate">
                            €
                        </span>
                    </div>
                </div>
                <div className="rsm-toggle">
                    <Toggle size="md" isSelected={policyFilter} onChange={setPolicyFilter} aria-label={t.watch.policyFilter} />
                    <p className="mt-2 text-[13.5px] leading-[1.55] wrap-anywhere text-rsm-charcoal">{t.watch.policyFilter}</p>
                </div>
                <p className="text-[12.5px] leading-[1.5] wrap-anywhere text-rsm-slate">{t.watch.note}</p>
            </div>
            <div className="mt-5 flex flex-col gap-2">
                <button
                    type="button"
                    onClick={save}
                    disabled={pending}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-rsm-lime px-6 text-base font-bold text-rsm-midnight transition-colors duration-200 ease-rsm hover:bg-rsm-lime-75 disabled:opacity-50"
                >
                    {t.watch.save}
                </button>
                {watch ? (
                    <button
                        type="button"
                        onClick={stop}
                        disabled={pending}
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-rsm-charcoal transition-colors duration-200 ease-rsm hover:text-rsm-coral-deep disabled:opacity-50"
                    >
                        {t.watch.stop}
                    </button>
                ) : null}
            </div>
        </SheetDialog>
    );
}
