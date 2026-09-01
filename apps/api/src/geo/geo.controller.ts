import { BadRequestException, Controller, Get, NotFoundException, Param } from '@nestjs/common';
import zipcodes from 'zipcodes';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';

interface ZipLookup {
  zip: string;
  city: string;
  /** Two-letter state / province code. */
  state: string;
  country: string;
}

/**
 * ZIP → city/state for address forms (owner 2026-09-01): the register
 * should not make anyone type "Los Angeles, CA" after "90036". Backed by
 * the bundled US/CA table, so it works offline and never rate-limits —
 * a POS must not depend on a third-party lookup being up.
 *
 * Signed-in members only: it touches no tenant data, but an open
 * endpoint is an open proxy, and `customers.view` is the broadest grant
 * every selling role already holds.
 */
@TenantScoped()
@Controller('v1/geo')
export class GeoController {
  @Get('zip/:zip')
  @RequirePermission('customers.view')
  lookup(@Param('zip') raw: string): ZipLookup {
    const zip = (raw ?? '').trim().toUpperCase();
    // US 5-digit (a ZIP+4 suffix is tolerated and dropped) or Canadian FSA+LDU.
    const us = zip.match(/^(\d{5})(?:-\d{4})?$/);
    const ca = zip.match(/^([A-Z]\d[A-Z])\s?(\d[A-Z]\d)$/);
    if (!us && !ca)
      throw new BadRequestException('zip must be a 5-digit US ZIP or a Canadian postal code');
    const key = us ? us[1]! : `${ca![1]} ${ca![2]}`;
    const hit = zipcodes.lookup(key);
    if (!hit) throw new NotFoundException(`No city on file for ${key}`);
    return { zip: hit.zip, city: hit.city, state: hit.state, country: hit.country };
  }
}
