export async function register() {
  // hook reservado para futuros monitores
}

export async function onRequestError(
  err: { digest?: string } & Error,
  request: { path: string; method: string; headers: { get(name: string): string | null } },
) {
  // Edge runtime — não importar Prisma/pg aqui (quebra o middleware).
  console.error(
    "[request-error]",
    request.method,
    request.path,
    err.message,
    err.stack,
  );
}
