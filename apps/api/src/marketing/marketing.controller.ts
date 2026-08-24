import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { and, desc, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE, ROOT_DRIZZLE } from '../database/database.module';
import { EMAIL_TRANSPORT, type EmailTransport } from '../email/email.service';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service';

interface SegmentFilter {
  /** Customers carrying ANY of these tags; empty/absent = all customers. */
  tagIds?: string[];
  /** Only customers created in the last N days. */
  sinceDays?: number;
}

interface SegmentBody {
  name?: string;
  filter?: SegmentFilter;
}

interface CampaignBody {
  name?: string;
  segmentId?: string;
  subject?: string;
  bodyText?: string;
}

/**
 * Marketing: saved segments + one-shot campaigns over the CRM tag
 * system. Membership resolves at preview/send time; only customers
 * with an email address are ever recipients. Imported (D8) customers
 * ARE included — after a migration they are the customer base, and
 * D8's exclusions cover operational money flows, not outreach.
 */
@TenantScoped()
@Controller('v1/marketing')
export class MarketingController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    /**
     * The sent-flip must be durable BEFORE the first email leaves: the
     * request-scoped RLS transaction only commits after the handler
     * returns, so writing 'sent' through the tenant tx would roll back
     * on a mid-send crash and a retry would double-blast everyone. The
     * root pool autocommits; the row was already tenant-verified above.
     */
    @Inject(ROOT_DRIZZLE) private readonly rootDb: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(EMAIL_TRANSPORT) private readonly email: EmailTransport,
    @Inject(WebhookDispatcher) private readonly webhooks: WebhookDispatcher,
  ) {}

  @Get('segments')
  @RequirePermission('crm.campaigns.manage')
  async listSegments(@CurrentTenant() _tenant: RequestTenantContext) {
    return this.db
      .select()
      .from(schema.customerSegments)
      .orderBy(desc(schema.customerSegments.createdAt));
  }

  @Post('segments')
  @RequirePermission('crm.campaigns.manage')
  async createSegment(@CurrentTenant() tenant: RequestTenantContext, @Body() body: SegmentBody) {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    const filter = await this.validateFilter(body.filter ?? {});
    const [row] = await this.db
      .insert(schema.customerSegments)
      .values({ businessId: tenant.businessId!, name, filterJson: filter })
      .returning();
    await this.audit.log({
      action: 'marketing.segment.create',
      targetType: 'customer_segment',
      targetId: row!.id,
      after: { name, filter },
    });
    return row;
  }

  @Get('segments/:id/preview')
  @RequirePermission('crm.campaigns.manage')
  async previewSegment(@CurrentTenant() _tenant: RequestTenantContext, @Param('id') id: string) {
    const segment = await this.getSegment(id);
    const members = await this.resolveMembers(segment.filterJson as SegmentFilter);
    return {
      count: members.length,
      sample: members.slice(0, 10).map((m) => ({
        id: m.id,
        name: [m.firstName, m.lastName].filter(Boolean).join(' ') || null,
        email: m.email,
      })),
    };
  }

  @Delete('segments/:id')
  @RequirePermission('crm.campaigns.manage')
  async deleteSegment(@CurrentTenant() _tenant: RequestTenantContext, @Param('id') id: string) {
    await this.getSegment(id);
    const [campaign] = await this.db
      .select({ id: schema.campaigns.id })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.segmentId, id))
      .limit(1);
    if (campaign) {
      throw new ConflictException('Segment is referenced by a campaign and cannot be deleted');
    }
    await this.db.delete(schema.customerSegments).where(eq(schema.customerSegments.id, id));
    await this.audit.log({
      action: 'marketing.segment.delete',
      targetType: 'customer_segment',
      targetId: id,
    });
    return { deleted: true };
  }

  @Get('campaigns')
  @RequirePermission('crm.campaigns.manage')
  async listCampaigns(@CurrentTenant() _tenant: RequestTenantContext) {
    const rows = await this.db
      .select({
        id: schema.campaigns.id,
        name: schema.campaigns.name,
        subject: schema.campaigns.subject,
        status: schema.campaigns.status,
        sentAt: schema.campaigns.sentAt,
        recipientCount: schema.campaigns.recipientCount,
        segmentId: schema.campaigns.segmentId,
        segmentName: schema.customerSegments.name,
        createdAt: schema.campaigns.createdAt,
      })
      .from(schema.campaigns)
      .innerJoin(
        schema.customerSegments,
        eq(schema.customerSegments.id, schema.campaigns.segmentId),
      )
      .orderBy(desc(schema.campaigns.createdAt));
    return rows;
  }

  @Post('campaigns')
  @RequirePermission('crm.campaigns.manage')
  async createCampaign(@CurrentTenant() tenant: RequestTenantContext, @Body() body: CampaignBody) {
    const name = body.name?.trim();
    const subject = body.subject?.trim();
    const bodyText = body.bodyText?.trim();
    if (!name) throw new BadRequestException('name is required');
    if (!subject) throw new BadRequestException('subject is required');
    if (!bodyText) throw new BadRequestException('bodyText is required');
    if (!body.segmentId) throw new BadRequestException('segmentId is required');
    await this.getSegment(body.segmentId);

    const [row] = await this.db
      .insert(schema.campaigns)
      .values({
        businessId: tenant.businessId!,
        segmentId: body.segmentId,
        name,
        subject,
        bodyText,
      })
      .returning();
    await this.audit.log({
      action: 'marketing.campaign.create',
      targetType: 'campaign',
      targetId: row!.id,
      after: { name, subject, segmentId: body.segmentId },
    });
    return row;
  }

  /**
   * Send a draft campaign to every emailable member of its segment.
   * One-shot: a sent campaign can't be re-sent (duplicate more instead)
   * — re-sending marketing email by accident is unrecoverable.
   */
  @Post('campaigns/:id/send')
  @RequirePermission('crm.campaigns.manage')
  async sendCampaign(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    const [campaign] = await this.db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, id))
      .limit(1);
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'draft') {
      throw new ConflictException(`Campaign is ${campaign.status}; only drafts can be sent`);
    }
    const [segment] = await this.db
      .select()
      .from(schema.customerSegments)
      .where(eq(schema.customerSegments.id, campaign.segmentId))
      .limit(1);
    if (!segment) throw new NotFoundException('Segment not found');

    const members = await this.resolveMembers(segment.filterJson as SegmentFilter);
    const recipients = members.filter((m): m is typeof m & { email: string } => Boolean(m.email));

    // Mark sent BEFORE the send loop — via the ROOT pool so it commits
    // immediately, not when the request's RLS transaction does. If the
    // process dies mid-send we must fail toward "some people missed an
    // email", never toward a re-send double-blasting everyone.
    const [updated] = await this.rootDb
      .update(schema.campaigns)
      .set({
        status: 'sent',
        sentAt: new Date(),
        sentByUserId: actor.id,
        recipientCount: recipients.length,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.status, 'draft')))
      .returning();
    if (!updated) throw new ConflictException('Campaign was already sent');

    const html = renderCampaignHtml(campaign.subject, campaign.bodyText);
    let sent = 0;
    for (const r of recipients) {
      try {
        await this.email.send({
          to: r.email,
          subject: campaign.subject,
          html,
          text: campaign.bodyText,
        });
        sent += 1;
      } catch {
        // Individual failures don't abort the batch; the count reflects
        // attempts that succeeded.
      }
    }

    await this.audit.log({
      action: 'marketing.campaign.send',
      targetType: 'campaign',
      targetId: id,
      after: { recipients: recipients.length, sent },
    });
    void this.webhooks.fire({
      businessId: tenant.businessId!,
      eventType: 'campaign.sent',
      payload: {
        campaignId: id,
        name: campaign.name,
        segmentId: campaign.segmentId,
        recipientCount: recipients.length,
      },
    });

    return { status: 'sent', recipientCount: recipients.length, sent };
  }

  private async getSegment(id: string) {
    const [segment] = await this.db
      .select()
      .from(schema.customerSegments)
      .where(eq(schema.customerSegments.id, id))
      .limit(1);
    if (!segment) throw new NotFoundException('Segment not found');
    return segment;
  }

  private async validateFilter(filter: SegmentFilter): Promise<SegmentFilter> {
    const out: SegmentFilter = {};
    if (filter.tagIds !== undefined) {
      if (!Array.isArray(filter.tagIds) || filter.tagIds.some((t) => typeof t !== 'string')) {
        throw new BadRequestException('filter.tagIds must be an array of tag ids');
      }
      if (filter.tagIds.length > 0) {
        const found = await this.db
          .select({ id: schema.customerTags.id })
          .from(schema.customerTags)
          .where(inArray(schema.customerTags.id, filter.tagIds));
        if (found.length !== new Set(filter.tagIds).size) {
          throw new BadRequestException('filter.tagIds contains unknown tags');
        }
        out.tagIds = [...new Set(filter.tagIds)];
      }
    }
    if (filter.sinceDays !== undefined) {
      // Cap at ~10 years: beyond that the cutoff arithmetic overflows
      // the JS Date range and the stored segment 500s forever.
      if (!Number.isInteger(filter.sinceDays) || filter.sinceDays < 1 || filter.sinceDays > 3650) {
        throw new BadRequestException('filter.sinceDays must be an integer between 1 and 3650');
      }
      out.sinceDays = filter.sinceDays;
    }
    return out;
  }

  private async resolveMembers(filter: SegmentFilter) {
    const conditions = [isNotNull(schema.customers.email)];
    if (filter.sinceDays) {
      const cutoff = new Date(Date.now() - filter.sinceDays * 86_400_000);
      conditions.push(gte(schema.customers.createdAt, cutoff));
    }
    if (filter.tagIds && filter.tagIds.length > 0) {
      // Subquery, not a materialized id list: a big tag would otherwise
      // ship tens of thousands of bind parameters (postgres caps at
      // ~65k) just to filter customers we're about to read anyway.
      conditions.push(
        inArray(
          schema.customers.id,
          this.db
            .select({ customerId: schema.customerTagLinks.customerId })
            .from(schema.customerTagLinks)
            .where(inArray(schema.customerTagLinks.tagId, filter.tagIds)),
        ),
      );
    }
    return this.db
      .select({
        id: schema.customers.id,
        firstName: schema.customers.firstName,
        lastName: schema.customers.lastName,
        email: schema.customers.email,
      })
      .from(schema.customers)
      .where(and(...conditions))
      .orderBy(schema.customers.createdAt);
  }
}

function renderCampaignHtml(subject: string, bodyText: string): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
<h2 style="font-size:18px">${subject
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</h2>
<p style="font-size:14px;line-height:1.6">${escaped}</p>
</body></html>`;
}
