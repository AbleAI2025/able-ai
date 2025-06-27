// File: app/lib/drizzle/schema/index.ts
export * from './enums';
export * from './users';
export * from './gigs';
export * from './interactions';
export * from './payments';
export * from './admin';
export * from './vector';
export * from './notification-preferences'

// It's generally cleaner to keep relations in their own file (relations.ts)
// and import them separately in your db instance setup.
// So, this file primarily exports table schemas and enums.
