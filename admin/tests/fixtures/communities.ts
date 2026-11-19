// AI-GENERATED — not an architecture reference

const federation = (id: number, apiVersion: string, verifiedAt: string | null) => ({
  id,
  apiVersion,
  endPoint: `http://localhost/api/${apiVersion}`,
  lastAnnouncedAt: '2026-11-07T12:00:00.000Z',
  verifiedAt,
  lastErrorAt: null,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: null,
})

export const homeCommunity = {
  foreign: false,
  url: 'http://localhost/api/',
  publicKey: 'a'.repeat(64),
  uuid: '2d7f7a1e-6b8e-4a0a-9c3e-8f1f6a2b9c11',
  authenticatedAt: null,
  name: 'Home',
  description: 'Our own community',
  gmsApiKey: 'gms-key',
  location: { latitude: 49.28, longitude: 9.74 },
  creationDate: '2026-01-01T12:00:00.000Z',
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: null,
  hieroTopicId: '0.0.1234',
  federatedCommunities: [
    federation(1, '1_0', '2026-11-08T12:00:00.000Z'),
    federation(2, '1_1', null),
  ],
}

export const foreignCommunity = {
  ...homeCommunity,
  foreign: true,
  url: 'http://elsewhere.example/api/',
  publicKey: 'b'.repeat(64),
  uuid: '7c1f0d2e-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
  authenticatedAt: '2026-10-01T12:00:00.000Z',
  name: 'Elsewhere',
  description: 'A community far away',
  gmsApiKey: null,
  location: null,
  hieroTopicId: '0.0.5678',
  federatedCommunities: [],
}
