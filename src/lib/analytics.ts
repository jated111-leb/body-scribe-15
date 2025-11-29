import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = 'a34fee5625082095403b42d3ddaefd10';

// Initialize Mixpanel
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined') {
    mixpanel.init(MIXPANEL_TOKEN, {
      track_pageview: true,
      persistence: 'localStorage',
      ignore_dnt: false,
    });
  }
};

export const analytics = {
  // Identify user with traits
  identify: (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      mixpanel.identify(userId);
      if (traits) {
        mixpanel.people.set(traits);
      }
    }
  },

  // Track custom event
  track: (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      mixpanel.track(event, properties);
    }
  },

  // Track page view
  pageView: (pageName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      mixpanel.track('Page View', {
        page: pageName,
        ...properties,
      });
    }
  },

  // Reset user (on sign out)
  reset: () => {
    if (typeof window !== 'undefined') {
      mixpanel.reset();
    }
  },

  // Set user properties
  setUserProperties: (properties: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      mixpanel.people.set(properties);
    }
  },

  // Increment a user property
  incrementUserProperty: (property: string, value: number = 1) => {
    if (typeof window !== 'undefined') {
      mixpanel.people.increment(property, value);
    }
  },
};
