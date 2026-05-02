/**
 * Server-side helpers for streaming `ReasoningEvent`s as Server-Sent Events.
 *
 * Each event is encoded with a typed `event:` line and a JSON `data:` payload,
 * which lets the client demux without parsing the data twice. The framing uses
 * the standard SSE protocol so any EventSource-compatible client can consume it.
 */
import type { ReasoningEvent } from "@/lib/types";

const encoder = new TextEncoder();

function encodeEvent(event: ReasoningEvent): Uint8Array {
  // Pretty-conservative SSE frame: type as `event:`, body as JSON `data:`.
  const payload = JSON.stringify(event);
  return encoder.encode(`event: ${event.type}\ndata: ${payload}\n\n`);
}

function encodeComment(text: string): Uint8Array {
  return encoder.encode(`: ${text}\n\n`);
}

/**
 * Wrap an async iterable of `ReasoningEvent`s into a streaming `Response`.
 *
 * Heartbeat comments are sent every 15s to keep proxies from buffering or
 * killing the connection on quiet stretches between events.
 */
export function streamReasoningEvents(
  iter: AsyncIterable<ReasoningEvent>,
  signal?: AbortSignal,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      const close = () => {
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      if (signal) {
        if (signal.aborted) {
          close();
          return;
        }
        signal.addEventListener("abort", close, { once: true });
      }

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encodeComment("hb"));
        } catch {
          // controller closed
        }
      }, 15_000);

      try {
        for await (const event of iter) {
          controller.enqueue(encodeEvent(event));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown streaming error";
        controller.enqueue(
          encodeEvent({
            type: "error",
            step: "stream",
            message,
          }),
        );
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
