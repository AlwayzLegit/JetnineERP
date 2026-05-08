import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface CapturedEmail extends SendEmailInput {
  sentAt: Date;
  via: 'resend' | 'memory' | 'log';
}

export interface EmailTransport {
  send(input: SendEmailInput): Promise<void>;
  // Tests inspect this; production transport returns an empty array.
  drain(): CapturedEmail[];
}

class ResendTransport implements EmailTransport {
  private readonly logger = new Logger('ResendTransport');
  private readonly resend: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.resend = new Resend(apiKey);
    this.from = from;
  }

  async send(input: SendEmailInput): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      this.logger.error({ error }, 'resend send failed');
      throw new Error(`resend: ${error.name}: ${error.message}`);
    }
  }

  drain(): CapturedEmail[] {
    return [];
  }
}

// Captures emails in memory (used for tests and local dev without a Resend
// API key) and also logs them at info level so the developer can see what
// would have been sent.
class MemoryTransport implements EmailTransport {
  private readonly logger = new Logger('MemoryTransport');
  private readonly captured: CapturedEmail[] = [];
  private readonly via: 'memory' | 'log';

  constructor(via: 'memory' | 'log' = 'memory') {
    this.via = via;
  }

  async send(input: SendEmailInput): Promise<void> {
    const captured: CapturedEmail = { ...input, sentAt: new Date(), via: this.via };
    this.captured.push(captured);
    this.logger.log(
      { to: input.to, subject: input.subject, preview: input.text?.slice(0, 200) },
      'email captured (no Resend key configured)',
    );
  }

  drain(): CapturedEmail[] {
    const out = this.captured.slice();
    this.captured.length = 0;
    return out;
  }
}

export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT');

@Injectable()
export class EmailService {
  constructor(@Inject(EMAIL_TRANSPORT) private readonly transport: EmailTransport) {}

  async send(input: SendEmailInput): Promise<void> {
    await this.transport.send(input);
  }

  drainCaptured(): CapturedEmail[] {
    return this.transport.drain();
  }
}

export function createEmailTransport(config: ConfigService): EmailTransport {
  const apiKey = config.get<string>('RESEND_API_KEY');
  // Accept either env name. EMAIL_FROM is the legacy var; RESEND_FROM_EMAIL
  // pairs visually with RESEND_API_KEY in the Vercel dashboard. Default
  // points at Resend's testing-only sender, which lets a fresh deploy
  // send to the address that owns the Resend account before the
  // merchant verifies their own domain.
  const from =
    config.get<string>('RESEND_FROM_EMAIL') ??
    config.get<string>('EMAIL_FROM') ??
    'Jetnine <onboarding@resend.dev>';
  if (apiKey) {
    return new ResendTransport(apiKey, from);
  }
  return new MemoryTransport('memory');
}
