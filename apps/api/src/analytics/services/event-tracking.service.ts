import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// Event types
export type EventType =
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'video_play'
  | 'video_pause'
  | 'video_complete'
  | 'search'
  | 'quiz_start'
  | 'quiz_submit'
  | 'chapter_start'
  | 'chapter_complete'
  | 'download'
  | 'share'
  | 'error';

export interface TrackEventDto {
  eventType: EventType;
  eventName: string;
  properties?: Record<string, unknown>;
  pageUrl?: string;
  referrer?: string;
  sessionId?: string;
}

export interface EventFilter {
  eventType?: EventType;
  eventName?: string;
  userId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EventAggregation {
  eventType: string;
  eventName: string;
  count: number;
  uniqueUsers: number;
}

export interface EventTimeline {
  timestamp: string;
  count: number;
}

@Injectable()
export class EventTrackingService {
  private readonly logger = new Logger(EventTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Spåra en händelse
   */
  async trackEvent(userId: string | null, dto: TrackEventDto) {
    try {
      const event = await this.prisma.analyticsEvent.create({
        data: {
          userId,
          sessionId: dto.sessionId,
          eventType: dto.eventType,
          eventName: dto.eventName,
          properties: dto.properties as Record<string, unknown> | undefined,
          pageUrl: dto.pageUrl,
          referrer: dto.referrer,
        },
      });

      this.logger.debug(`Event tracked: ${dto.eventType}/${dto.eventName} for user ${userId || 'anonymous'}`);
      return event;
    } catch (error) {
      this.logger.error(`Failed to track event: ${error}`);
      throw error;
    }
  }

  /**
   * Spåra flera händelser i batch
   */
  async trackEvents(userId: string | null, events: TrackEventDto[]) {
    const data = events.map((dto) => ({
      userId,
      sessionId: dto.sessionId,
      eventType: dto.eventType,
      eventName: dto.eventName,
      properties: dto.properties as Record<string, unknown> | undefined,
      pageUrl: dto.pageUrl,
      referrer: dto.referrer,
    }));

    const result = await this.prisma.analyticsEvent.createMany({ data });
    this.logger.debug(`Batch tracked ${result.count} events`);
    return { count: result.count };
  }

  /**
   * Hämta händelser med filter
   */
  async getEvents(filter: EventFilter, limit = 100, offset = 0) {
    const where: Record<string, unknown> = {};

    if (filter.eventType) where.eventType = filter.eventType;
    if (filter.eventName) where.eventName = filter.eventName;
    if (filter.userId) where.userId = filter.userId;
    if (filter.sessionId) where.sessionId = filter.sessionId;
    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) (where.timestamp as Record<string, Date>).gte = filter.startDate;
      if (filter.endDate) (where.timestamp as Record<string, Date>).lte = filter.endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.analyticsEvent.count({ where }),
    ]);

    return { events, total, limit, offset };
  }

  /**
   * Aggregera händelser per typ
   */
  async getEventAggregations(filter: EventFilter): Promise<EventAggregation[]> {
    const where: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) (where.timestamp as Record<string, Date>).gte = filter.startDate;
      if (filter.endDate) (where.timestamp as Record<string, Date>).lte = filter.endDate;
    }

    const aggregations = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType', 'eventName'],
      where,
      _count: { id: true },
    });

    // Beräkna unika användare per händelse
    const results: EventAggregation[] = [];
    for (const agg of aggregations) {
      const uniqueUsers = await this.prisma.analyticsEvent.findMany({
        where: {
          ...where,
          eventType: agg.eventType,
          eventName: agg.eventName,
          userId: { not: null },
        },
        distinct: ['userId'],
        select: { userId: true },
      });

      results.push({
        eventType: agg.eventType,
        eventName: agg.eventName,
        count: agg._count.id,
        uniqueUsers: uniqueUsers.length,
      });
    }

    return results.sort((a, b) => b.count - a.count);
  }

  /**
   * Händelser över tid (tidslinje)
   */
  async getEventTimeline(
    eventType: EventType | null,
    days = 30,
    granularity: 'hour' | 'day' = 'day',
  ): Promise<EventTimeline[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: Record<string, unknown> = {
      timestamp: { gte: startDate },
    };
    if (eventType) where.eventType = eventType;

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    // Gruppera per tidsenhet
    const timeline = new Map<string, number>();

    for (const event of events) {
      let key: string;
      if (granularity === 'hour') {
        key = event.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      } else {
        key = event.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      timeline.set(key, (timeline.get(key) || 0) + 1);
    }

    return Array.from(timeline.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Populära sidor (page views)
   */
  async getPopularPages(days = 30, limit = 20) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pages = await this.prisma.analyticsEvent.groupBy({
      by: ['pageUrl'],
      where: {
        eventType: 'page_view',
        timestamp: { gte: startDate },
        pageUrl: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return pages.map((p) => ({
      pageUrl: p.pageUrl,
      views: p._count.id,
    }));
  }

  /**
   * Användarresa (funnel)
   */
  async getUserJourney(userId: string, sessionId?: string) {
    const where: Record<string, unknown> = { userId };
    if (sessionId) where.sessionId = sessionId;

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      select: {
        eventType: true,
        eventName: true,
        pageUrl: true,
        timestamp: true,
      },
    });

    return events;
  }

  /**
   * Sökanalys
   */
  async getSearchAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const searches = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'search',
        timestamp: { gte: startDate },
      },
      select: { properties: true },
    });

    // Extrahera söktermer
    const termCounts = new Map<string, number>();
    for (const search of searches) {
      const props = search.properties as { query?: string } | null;
      const query = props?.query?.toLowerCase().trim();
      if (query) {
        termCounts.set(query, (termCounts.get(query) || 0) + 1);
      }
    }

    return Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }

  /**
   * Rensa gamla händelser (för underhåll)
   */
  async cleanupOldEvents(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.analyticsEvent.deleteMany({
      where: { timestamp: { lt: cutoffDate } },
    });

    this.logger.log(`Cleaned up ${result.count} old events`);
    return { deleted: result.count };
  }
}
