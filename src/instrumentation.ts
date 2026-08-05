import { captureException } from "@/lib/systemErrors";

export async function register() {
  // hook reservado para futuros monitores
}

export async function onRequestError(
  err: { digest?: string } & Error,
  request: { path: string; method: string; headers: { get(name: string): string | null } },
) {
  try {
    await captureException(err, {
      source: "next-request",
      url: `${request.method} ${request.path}`,
    });
  } catch {
    /* ignore */
  }
}
