import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AUTH_INSTANCE } from './auth.tokens';
import type { AuthInstance } from './auth.config';

// Mount better-auth's Web Fetch handler under /api/auth/*. NestJS's Express
// adapter delivers the raw req/res; we adapt to/from a Fetch Request/Response
// so better-auth (which is framework-agnostic) handles the rest.
@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: AuthInstance) {}

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const url = new URL(req.originalUrl ?? req.url, `${req.protocol}://${req.get('host')}`);

    // Build a Fetch Request from the Express request.
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else if (value !== undefined) {
        headers.set(key, String(value));
      }
    }

    const method = req.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const body = hasBody ? JSON.stringify(req.body ?? {}) : undefined;

    const fetchReq = new Request(url.toString(), {
      method,
      headers,
      body,
    });

    const fetchRes = await this.auth.handler(fetchReq);

    res.status(fetchRes.status);
    fetchRes.headers.forEach((value, key) => {
      // Multiple Set-Cookie headers come through as a comma-joined string in
      // Fetch APIs. We split them so Express writes each as a discrete header.
      if (key.toLowerCase() === 'set-cookie') {
        for (const cookie of value.split(/,(?=[^;]*=)/)) {
          res.append('set-cookie', cookie.trim());
        }
      } else {
        res.setHeader(key, value);
      }
    });

    const text = await fetchRes.text();
    res.send(text);
  }
}
