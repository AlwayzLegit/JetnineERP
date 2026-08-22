import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../tenancy/decorators';
import { openapiSpec } from './openapi.spec.data';

/**
 * Serves the public OpenAPI 3.1 spec and a self-contained Swagger UI
 * page that loads the bundle from a CDN. Both routes are @Public()
 * since the spec is meant to be discoverable — it documents the
 * shape, not any sensitive data.
 *
 * Pairs with the API keys (Phase 2.8) + idempotency headers (2.9)
 * + cursor pagination (2.10): integrators have a single source of
 * truth for the surface they're allowed to drive.
 */
@Controller('v1')
export class OpenApiController {
  @Get('openapi.json')
  @Public()
  @Header('Cache-Control', 'public, max-age=300')
  spec(): typeof openapiSpec {
    return openapiSpec;
  }

  @Get('docs')
  @Public()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  docs(): string {
    return DOCS_HTML;
  }
}

// Self-contained Swagger UI page. Fetches the JSON spec from
// `/v1/openapi.json` and renders it. We pin Swagger UI to a known
// version so the rendered docs don't drift if the CDN bumps.
const SWAGGER_VERSION = '5.17.14';
const DOCS_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>LA Mattress ERP API — docs</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css">
<style>body { margin: 0 } #swagger-ui { max-width: 1200px; margin: 0 auto }</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js" crossorigin></script>
<script>
window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: '/v1/openapi.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis],
    deepLinking: true,
    persistAuthorization: true,
  });
};
</script>
</body>
</html>`;
