import { env } from "@/lib/env";

/**
 * Envio de e-mail via SMTP (transporte nativo Node quando possível).
 * Sem pacote extra: usa socket TLS na porta 465; na 587 registra e retorna
 * orientação (STARTTLS completo exige cliente SMTP dedicado).
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { host, port, user, pass, from } = env.smtp;
  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP não configurado (SMTP_HOST/USER/PASS)." };
  }
  if (!opts.to?.includes("@")) {
    return { ok: false, error: "Destinatário inválido." };
  }

  const fromAddr = from || user;
  const p = port || 587;

  try {
    if (p === 465) {
      await sendViaImplicitTls({
        host,
        port: p,
        user,
        pass,
        from: fromAddr,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
      });
      return { ok: true };
    }

    // 587 / outros: tenta net + STARTTLS simplificado
    await sendViaStartTls({
      host,
      port: p,
      user,
      pass,
      from: fromAddr,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return { ok: true };
  } catch (e) {
    console.error("[mailer]", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Falha ao enviar e-mail",
    };
  }
}

function b64(s: string) {
  return Buffer.from(s, "utf8").toString("base64");
}

async function sendViaImplicitTls(cfg: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const tls = await import("tls");
  await dialogue(
    () =>
      tls.connect({
        host: cfg.host,
        port: cfg.port,
        servername: cfg.host,
        rejectUnauthorized: true,
      }),
    cfg,
  );
}

async function sendViaStartTls(cfg: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const net = await import("net");
  const tls = await import("tls");

  await new Promise<void>((resolve, reject) => {
    const socket = net.connect({ host: cfg.host, port: cfg.port });
    let buf = "";
    let phase:
      | "greet"
      | "ehlo1"
      | "starttls"
      | "ehlo2"
      | "auth"
      | "user"
      | "pass"
      | "mail"
      | "rcpt"
      | "data"
      | "body"
      | "quit" = "greet";
    let secure: import("tls").TLSSocket | null = null;

    const sock = () => secure || socket;

    const onData = (chunk: string) => {
      buf += chunk;
      const parts = buf.split(/\r?\n/);
      buf = parts.pop() || "";
      for (const line of parts) {
        if (!/^\d{3}[\s-]/.test(line)) continue;
        const code = Number(line.slice(0, 3));
        const last = line[3] === " ";

        try {
          if (phase === "greet") {
            if (code !== 220) throw new Error(line);
            sock().write("EHLO homequeen.local\r\n");
            phase = "ehlo1";
          } else if (phase === "ehlo1" && last) {
            if (code !== 250) throw new Error(line);
            sock().write("STARTTLS\r\n");
            phase = "starttls";
          } else if (phase === "starttls") {
            if (code !== 220) throw new Error(line);
            secure = tls.connect({
              socket,
              servername: cfg.host,
              rejectUnauthorized: true,
            });
            secure.setEncoding("utf8");
            secure.on("error", reject);
            secure.on("data", onData);
            socket.removeListener("data", onData);
            secure.write("EHLO homequeen.local\r\n");
            phase = "ehlo2";
          } else if (phase === "ehlo2" && last) {
            if (code !== 250) throw new Error(line);
            sock().write("AUTH LOGIN\r\n");
            phase = "auth";
          } else if (phase === "auth") {
            if (code !== 334) throw new Error(line);
            sock().write(b64(cfg.user) + "\r\n");
            phase = "user";
          } else if (phase === "user") {
            if (code !== 334) throw new Error(line);
            sock().write(b64(cfg.pass) + "\r\n");
            phase = "pass";
          } else if (phase === "pass") {
            if (code !== 235) throw new Error(line);
            sock().write(`MAIL FROM:<${cfg.from}>\r\n`);
            phase = "mail";
          } else if (phase === "mail") {
            if (code !== 250) throw new Error(line);
            sock().write(`RCPT TO:<${cfg.to}>\r\n`);
            phase = "rcpt";
          } else if (phase === "rcpt") {
            if (code !== 250 && code !== 251) throw new Error(line);
            sock().write("DATA\r\n");
            phase = "data";
          } else if (phase === "data") {
            if (code !== 354) throw new Error(line);
            const msg = [
              `From: ${cfg.from}`,
              `To: ${cfg.to}`,
              `Subject: ${cfg.subject}`,
              "MIME-Version: 1.0",
              "Content-Type: text/plain; charset=utf-8",
              "",
              cfg.text,
              ".",
            ].join("\r\n");
            sock().write(msg + "\r\n");
            phase = "body";
          } else if (phase === "body") {
            if (code !== 250) throw new Error(line);
            sock().write("QUIT\r\n");
            phase = "quit";
            sock().end();
            resolve();
          }
        } catch (e) {
          reject(e);
        }
      }
    };

    socket.setEncoding("utf8");
    socket.on("error", reject);
    socket.on("data", onData);
  });
}

async function dialogue(
  connect: () => import("tls").TLSSocket,
  cfg: {
    user: string;
    pass: string;
    from: string;
    to: string;
    subject: string;
    text: string;
  },
) {
  await new Promise<void>((resolve, reject) => {
    const socket = connect();
    let buf = "";
    let phase:
      | "greet"
      | "ehlo"
      | "auth"
      | "user"
      | "pass"
      | "mail"
      | "rcpt"
      | "data"
      | "body"
      | "quit" = "greet";

    socket.setEncoding("utf8");
    socket.on("error", reject);
    socket.on("data", (chunk: string) => {
      buf += chunk;
      const parts = buf.split(/\r?\n/);
      buf = parts.pop() || "";
      for (const line of parts) {
        if (!/^\d{3}[\s-]/.test(line)) continue;
        const code = Number(line.slice(0, 3));
        const last = line[3] === " ";
        try {
          if (phase === "greet") {
            if (code !== 220) throw new Error(line);
            socket.write("EHLO homequeen.local\r\n");
            phase = "ehlo";
          } else if (phase === "ehlo" && last) {
            if (code !== 250) throw new Error(line);
            socket.write("AUTH LOGIN\r\n");
            phase = "auth";
          } else if (phase === "auth") {
            if (code !== 334) throw new Error(line);
            socket.write(b64(cfg.user) + "\r\n");
            phase = "user";
          } else if (phase === "user") {
            if (code !== 334) throw new Error(line);
            socket.write(b64(cfg.pass) + "\r\n");
            phase = "pass";
          } else if (phase === "pass") {
            if (code !== 235) throw new Error(line);
            socket.write(`MAIL FROM:<${cfg.from}>\r\n`);
            phase = "mail";
          } else if (phase === "mail") {
            if (code !== 250) throw new Error(line);
            socket.write(`RCPT TO:<${cfg.to}>\r\n`);
            phase = "rcpt";
          } else if (phase === "rcpt") {
            if (code !== 250 && code !== 251) throw new Error(line);
            socket.write("DATA\r\n");
            phase = "data";
          } else if (phase === "data") {
            if (code !== 354) throw new Error(line);
            const msg = [
              `From: ${cfg.from}`,
              `To: ${cfg.to}`,
              `Subject: ${cfg.subject}`,
              "MIME-Version: 1.0",
              "Content-Type: text/plain; charset=utf-8",
              "",
              cfg.text,
              ".",
            ].join("\r\n");
            socket.write(msg + "\r\n");
            phase = "body";
          } else if (phase === "body") {
            if (code !== 250) throw new Error(line);
            socket.write("QUIT\r\n");
            phase = "quit";
            socket.end();
            resolve();
          }
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}
