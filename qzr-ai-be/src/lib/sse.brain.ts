import type { Response } from "express";

export function prepareSseResponse(response: Response) {
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();
}

export function writeSse(response: Response, event: string, data: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function startSseHeartbeat(response: Response) {
  return setInterval(() => {
    if (!response.writableEnded && !response.destroyed) {
      response.write(": keep-alive\n\n");
    }
  }, 15_000);
}
