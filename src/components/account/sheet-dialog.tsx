"use client";

import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { useLang } from "@/providers/lang";

/**
 * Account sheet/dialog primitive (R11-5 annotation: "one component, three
 * positions" — bottom sheet ≤767 px, the same dialog centered at 480 px from
 * 768 px up, over a 6 % midnight scrim; the deletion dialog shares the
 * anatomy, R16-3). react-aria Modal carries the §11 behavior out of the box:
 * focus trapped while open, Esc closes, focus returns to the invoking control.
 */
export function SheetDialog({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
    const { t } = useLang();
    return (
        <ModalOverlay
            isOpen={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose();
            }}
            isDismissable
            className="fixed inset-0 z-50 flex items-end justify-center bg-rsm-midnight/6 md:items-center md:p-6"
        >
            <Modal className="w-full outline-none md:max-w-[480px]">
                <Dialog
                    aria-label={label}
                    className="relative flex max-h-[88dvh] w-full flex-col overflow-y-auto rounded-t-rsm-card bg-white p-6 shadow-rsm-stack outline-none md:rounded-rsm-card"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t.common.close}
                        className="absolute top-3 right-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-rsm-slate transition-colors duration-200 ease-rsm hover:text-rsm-midnight"
                    >
                        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M3 3l10 10M13 3L3 13" />
                        </svg>
                    </button>
                    {children}
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
