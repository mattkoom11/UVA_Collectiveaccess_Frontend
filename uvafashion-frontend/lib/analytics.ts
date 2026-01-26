/**
 * Analytics tracking utilities
 */

export interface AnalyticsEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 1000;

  /**
   * Track an event
   */
  track(category: string, action: string, label?: string, value?: number): void {
    const event: AnalyticsEvent = {
      type: 'event',
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Store in localStorage
    this.saveToStorage();

    // Send to external analytics if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string): void {
    this.track('navigation', 'page_view', path);
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number): void {
    this.track('search', 'query', query, resultsCount);
  }

  /**
   * Track garment view
   */
  trackGarmentView(garmentId: string, garmentName: string): void {
    this.track('garment', 'view', `${garmentId}:${garmentName}`);
  }

  /**
   * Track filter usage
   */
  trackFilter(filterType: string, filterValue: string): void {
    this.track('filter', 'apply', `${filterType}:${filterValue}`);
  }

  /**
   * Track export
   */
  trackExport(format: string, itemCount: number): void {
    this.track('export', format, undefined, itemCount);
  }

  /**
   * Track share
   */
  trackShare(platform: string, url: string): void {
    this.track('share', platform, url);
  }

  /**
   * Get analytics data
   */
  getAnalytics(): {
    totalEvents: number;
    events: AnalyticsEvent[];
    popularGarments: Array<{ id: string; views: number }>;
    popularSearches: Array<{ query: string; count: number }>;
    filterUsage: Record<string, number>;
  } {
    const garmentViews = new Map<string, number>();
    const searches = new Map<string, number>();
    const filterUsage: Record<string, number> = {};

    this.events.forEach((event) => {
      if (event.category === 'garment' && event.action === 'view' && event.label) {
        const [id] = event.label.split(':');
        garmentViews.set(id, (garmentViews.get(id) || 0) + 1);
      }

      if (event.category === 'search' && event.action === 'query' && event.label) {
        searches.set(event.label, (searches.get(event.label) || 0) + 1);
      }

      if (event.category === 'filter' && event.label) {
        const [type] = event.label.split(':');
        filterUsage[type] = (filterUsage[type] || 0) + 1;
      }
    });

    return {
      totalEvents: this.events.length,
      events: this.events,
      popularGarments: Array.from(garmentViews.entries())
        .map(([id, views]) => ({ id, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      popularSearches: Array.from(searches.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      filterUsage,
    };
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): string {
    const data = this.getAnalytics();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear analytics
   */
  clear(): void {
    this.events = [];
    this.saveToStorage();
  }

  /**
   * Load from localStorage
   */
  loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('uva-fashion-analytics');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading analytics from storage:', error);
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('uva-fashion-analytics', JSON.stringify(this.events));
    } catch (error) {
      console.error('Error saving analytics to storage:', error);
    }
  }
}

// Singleton instance
let analyticsInstance: Analytics | null = null;

export function getAnalytics(): Analytics {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
    analyticsInstance.loadFromStorage();
  }
  return analyticsInstance;
}
