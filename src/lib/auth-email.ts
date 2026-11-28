import nodemailer from "nodemailer";

type MailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
};

function mailConfig(): MailConfig {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.");
  }
  return { host: SMTP_HOST, port, user: SMTP_USER, password: SMTP_PASSWORD, from: SMTP_FROM };
}

export function assertMailConfigured() {
  mailConfig();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export async function sendAuthEmail(to: string, subject: string, text: string, html: string) {
  const config = mailConfig();
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: { user: config.user, pass: config.password },
  });
  await transport.sendMail({ from: config.from, to, subject, text, html });
}

export function verificationEmail(code: string) {
  return {
    subject: "Verify your Calibration Masters account",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${escapeHtml(code)}</strong>.</p><p>It expires in 10 minutes.</p>`,
  };
}

export function passwordResetEmail(name: string | null, url: string) {
  const greeting = name ? `Hello ${name},` : "Hello,";
  const safeGreeting = escapeHtml(greeting);
  const safeUrl = escapeHtml(url);
  return {
    subject: "Reset your Calibration Masters password",
    text: `${greeting}\n\nUse this link within 30 minutes to reset your password:\n${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>${safeGreeting}</p><p><a href="${safeUrl}">Reset your password</a>. This link expires in 30 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
  };
}
