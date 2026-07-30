import { completeRun, getRun } from "@/lib/store";
import { canonicalAnalysis } from "@/mocks/fixtures";

/**
 * GET /api/analysing/:id — SSE stream of analysis steps (R1-4).
 * Events: `step` (per completed step, engine-authored found-fact), then `done` {slug}.
 * Refresh re-attaches: a finished run answers `done` immediately (state machine, R1 notes).
 * `?fast=1` compresses timings — smoke-test hook for the mock only.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const run = getRun(id);
    if (!run) {
        return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    }

    const fast = new URL(request.url).searchParams.get("fast") === "1";
    const steps = canonicalAnalysis.steps;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: string, data: unknown) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };
            const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

            if (run.status === "done") {
                send("done", { slug: run.slug, status: "done" });
                controller.close();
                return;
            }

            send("start", {
                total: steps.length,
                estimateSeconds: 60,
                listing: {
                    addr: `${canonicalAnalysis.listing?.addr}, ${canonicalAnalysis.listing?.city}`,
                    oikotieId: canonicalAnalysis.listing?.oikotieId,
                    fetchedAt: canonicalAnalysis.listing?.fetchedAt,
                },
            });

            let prev = 0;
            for (const [index, step] of steps.entries()) {
                const wait = fast ? 120 : (step.t - prev) * 1000;
                prev = step.t;
                await sleep(wait);
                send("step", { index, total: steps.length, ...step });
            }

            completeRun(id);
            send("done", { slug: run.slug, status: "done" });
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
