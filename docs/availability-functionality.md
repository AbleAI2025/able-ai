# Availability Functionality

This document describes the availability management functionality implemented for workers in the calendar system.

## Overview

The availability functionality allows workers to:
- Set their available time slots with recurring patterns
- Edit existing availability slots
- Delete individual slots or clear all availability
- View their availability in the calendar alongside gigs and offers

## Features

### 1. Availability Management
- **Create Availability**: Workers can click on empty calendar slots to create new availability
- **Edit Availability**: Click on existing availability events to edit time, days, and recurrence
- **Delete Availability**: Remove individual slots or clear all availability
- **Recurring Patterns**: Support for weekly, bi-weekly, and monthly recurring availability

### 2. Calendar Integration
- Availability events appear in the calendar with green styling
- Filter "Manage availability" shows only availability events
- Availability events are clickable and open the edit modal
- Date selection allows creating new availability slots

### 3. UI Components

#### AvailabilityEditModal
- Main modal for creating/editing availability slots
- Time picker for start and end times
- Day selection for recurring patterns
- Frequency selection (weekly, bi-weekly, monthly)
- End conditions (never, on date, after occurrences)

#### RepeatAvailabilityModal
- Sub-modal for configuring recurring patterns
- Day selection with visual indicators
- Frequency and end condition settings
- Summary display of the recurring pattern

#### ClearAvailabilityModal
- Confirmation dialog for clearing all availability
- Warning about irreversible action

## Database Schema

Availability data is stored in the `GigWorkerProfilesTable.availability_json` field as a JSON array of availability slots:

```typescript
interface AvailabilitySlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  days: string[]; // ['Mon', 'Tue', 'Wed', etc.]
  frequency: 'weekly' | 'biweekly' | 'monthly';
  ends: 'never' | 'on_date' | 'after_occurrences';
  endDate?: string; // ISO date string
  occurrences?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Actions

### `getWorkerAvailability(userId: string)`
Fetches availability slots for a worker.

### `createAvailabilitySlot(userId: string, data: AvailabilityFormData)`
Creates a new availability slot.

### `updateAvailabilitySlot(userId: string, slotId: string, data: Partial<AvailabilityFormData>)`
Updates an existing availability slot.

### `deleteAvailabilitySlot(userId: string, slotId: string)`
Deletes a specific availability slot.

### `clearAllAvailability(userId: string)`
Clears all availability slots for a worker.

## Usage

1. **Navigate to Worker Calendar**: Go to `/user/[userId]/worker/calendar`
2. **Select "Manage availability" filter**: This shows only availability events
3. **Create new availability**: Click on empty calendar slots
4. **Edit existing availability**: Click on green availability events
5. **Clear all availability**: Use the trash icon in the footer when "Manage availability" filter is active

## Styling

- Availability events are displayed in green (`#10b981`)
- Edit buttons for availability events are also green
- Clear button in footer shows a trash icon
- All modals use dark theme styling consistent with the app

## Future Enhancements

- Conflict detection with existing gigs
- Bulk availability operations
- Availability templates
- Integration with gig matching algorithm
- Availability analytics and insights
