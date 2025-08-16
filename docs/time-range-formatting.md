# Time Range Formatting

## Overview
The AI automatically parses and formats time ranges entered by users to ensure consistent display in gig summaries and proper scheduling.

## How It Works

### User Input Examples
Users can enter time ranges in various formats:
- `"12PM to 4pm"`
- `"9am to 5pm"`
- `"2:30 PM to 6:30 PM"`
- `"12:00-14:30"`
- `"12:00 to 14:30"`

### AI Processing
The AI validation system automatically:
1. **Recognizes** time range patterns
2. **Converts** to 24-hour format
3. **Standardizes** to "HH:MM to HH:MM" format
4. **Stores** the formatted version for display

### Output Examples
Input → AI Formatted Output:
- `"12PM to 4pm"` → `"12:00 to 16:00"`
- `"9am to 5pm"` → `"09:00 to 17:00"`
- `"2:30 PM to 6:30 PM"` → `"14:30 to 18:30"`
- `"12:00-14:30"` → `"12:00 to 14:30"`

### Display Formatting
When displayed in gig summaries, the 24-hour format is converted to user-friendly 12-hour format:
- `"12:00 to 16:00"` → `"12:00 PM to 4:00 PM"`
- `"09:00 to 17:00"` → `"9:00 AM to 5:00 PM"`

## Benefits

1. **Consistency**: All time ranges are stored in a standardized format
2. **Scheduling**: 24-hour format is ideal for backend processing and scheduling
3. **User-Friendly**: Display shows times in familiar 12-hour format
4. **Flexibility**: Accepts various input formats from users
5. **Validation**: AI ensures time ranges are valid and properly formatted

## Implementation

### AI Validation Prompt
The AI validation system includes specific instructions for time handling:
```
SPECIAL TIME HANDLING: For time fields (gigTime), if the user provides a time range like "12PM to 4pm" or "12:00-14:30" or "12:00 PM - 2:30 PM":
- Accept it as valid
- In sanitizedValue, convert to 24-hour format: "12:00 to 16:00" or "12:00 to 14:30"
- For time ranges, always use the format "HH:MM to HH:MM" in 24-hour time
- Examples:
  * "12PM to 4pm" → "12:00 to 16:00"
  * "9am to 5pm" → "09:00 to 17:00"
  * "2:30 PM to 6:30 PM" → "14:30 to 18:30"
  * "12:00-14:30" → "12:00 to 14:30"
- This standardized format helps with gig scheduling and display
```

### Display Functions
The `formatTimeForDisplay()` function handles both single times and time ranges:
- Detects time ranges by looking for " to " separator
- Splits range into start and end times
- Formats each time individually
- Recombines into user-friendly display format

## Use Cases

1. **Buyer Gig Creation**: When buyers specify gig duration
2. **Worker Availability**: When workers set their available hours
3. **Gig Summaries**: Displaying formatted time ranges
4. **Calendar Events**: Consistent time formatting across the platform
