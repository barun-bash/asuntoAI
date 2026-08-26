"use client";

import { useState } from "react";
import { Slider } from "@/components/base/slider/slider";
import { formatEUR } from "@/lib/format";
import { useLang } from "@/providers/lang";

/* Engine-published miss-cost statistics — the mock of GET /stats/miss-cost
   (Landing board annotation). highFlagRate 0.38 backs the "1 in 2.6" line;
   that ratio string is engine copy, never derived client-side. */
const MISS_COST_STATS = { medianLiabilityShare: 0.079, highFlagRate: 0.38 } as const;

const SLIDER_MIN = 80_000;
const SLIDER_MAX = 300_000;
const SLIDER_STEP = 5_000; // board: slider steps 5 000 €
const SLIDER_DEFAULT = 150_000;

/**
 * #cost miss-cost calculator (Landing board). THE ONE SANCTIONED CLIENT MATH:
 * the slider multiplies the engine-published median liability share by the
 * chosen price — an explicit §6.2 exception on this marketing surface only,
 * never in product. DS Slider, show-label off — the big figure is the display.
 */
export function MissCostCalculator() {
    const { lang, t } = useLang();
    const m = t.marketing.cost;
    const [price, setPrice] = useState(SLIDER_DEFAULT);

    // price × engine-published share — the sanctioned multiplication above.
    const liability = Math.round(price * MISS_COST_STATS.medianLiabilityShare);

    return (
        <div className="flex flex-col rounded-rsm-card border border-rsm-hairline bg-white p-6 md:p-8">
            <p className="text-[10.5px] leading-[14px] font-bold tracking-[0.08em] text-rsm-steel uppercase">{m.searchEyebrow}</p>
            <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="tnum font-display text-3xl leading-none font-medium text-rsm-midnight">{formatEUR(price, lang)}</span>
                <span className="text-[12.5px] leading-[1.4] font-medium text-rsm-misty">{m.priceLabel}</span>
            </div>
            <div className="marketing-slider mt-3">
                <Slider
                    aria-label={m.sliderAria}
                    minValue={SLIDER_MIN}
                    maxValue={SLIDER_MAX}
                    step={SLIDER_STEP}
                    value={price}
                    onChange={(value) => setPrice(Array.isArray(value) ? value[0] : value)}
                    /* The DS default formats the thumb's aria value as a percent;
                       this slider is euros — keep the accessible value honest
                       (the visible label stays off per the board). */
                    formatOptions={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
                />
            </div>
            <div className="tnum flex justify-between text-[10.5px] leading-[1.4] font-medium text-rsm-slate-50">
                <span>{formatEUR(SLIDER_MIN, lang)}</span>
                <span>{formatEUR(SLIDER_MAX, lang)}</span>
            </div>
            <div className="tnum mt-5 flex flex-col">
                <div className="flex items-baseline gap-2.5 border-t border-rsm-row-line py-[11px]">
                    <span className="min-w-0 flex-1 text-[13.5px] leading-[1.5] font-medium wrap-anywhere text-rsm-charcoal">{m.row1Label}</span>
                    <span className="tnum font-display text-[17px] leading-[1.2] font-medium whitespace-nowrap text-rsm-midnight">
                        {formatEUR(liability, lang)}
                    </span>
                </div>
                <p className="pb-[9px] text-[11px] leading-[1.5] font-medium text-rsm-misty">
                    {m.row1Sub}{" "}
                    <span className="rounded px-[5px] py-[1px] text-[9px] leading-[11px] font-bold tracking-[0.05em] text-rsm-misty shadow-[inset_0_0_0_1px_var(--color-rsm-hairline)]">
                        {t.provenance.MODELLED}
                    </span>
                </p>
                <div className="flex items-baseline gap-2.5 border-t border-rsm-row-line py-[11px]">
                    <span className="min-w-0 flex-1 text-[13.5px] leading-[1.5] font-medium wrap-anywhere text-rsm-charcoal">{m.row2Label}</span>
                    <span className="tnum font-display text-[17px] leading-[1.2] font-medium whitespace-nowrap text-rsm-midnight">{m.row2Value}</span>
                </div>
                <div className="flex items-baseline gap-2.5 border-t border-rsm-row-line py-[11px]">
                    <span className="min-w-0 flex-1 text-[13.5px] leading-[1.5] font-medium wrap-anywhere text-rsm-charcoal">{m.row3Label}</span>
                    <span className="tnum font-display text-[17px] leading-[1.2] font-medium whitespace-nowrap text-rsm-midnight">{m.row3Value}</span>
                </div>
            </div>
            <p className="mt-auto pt-3.5 text-xs leading-[1.6] font-medium text-rsm-misty">{m.honesty}</p>
        </div>
    );
}
