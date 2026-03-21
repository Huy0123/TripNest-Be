export const CacheKeys = {
  tours: {
    list: (version: number, queryHash: string) =>
      `tours:list:v${version}:${queryHash}`,
    one: (id: string) => `tours:${id}`,
    location: (locationId: string) => `tours:location:${locationId}`,
    version: () => 'tours:version',
  },
  bookings: {
    byUser: (userId: string) => `bookings:user:${userId}`,
  },
  reviews: {
    byTour: (tourId: string) => `reviews:${tourId}`,
  },
  sessions: {
    one: (id: string) => `sessions:${id}`,
  },
};
