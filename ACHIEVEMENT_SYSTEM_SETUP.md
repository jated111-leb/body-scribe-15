# Enhanced Achievement System - Setup Guide

## Overview

The enhanced achievement system includes:
- **Background Calculation**: Edge function calculates achievements every 6 hours
- **Smart Notifications**: Contextual toast messages for unlocks and progress
- **Progress Indicators**: "Emerging Patterns" showing almost-unlocked achievements
- **Achievement Details**: Click any achievement to see detailed timeline and insights
- **Contextual Prompts**: Suggestions based on data gaps
- **Progressive Disclosure**: Gradual complexity reveal over 4 weeks
- **User Preferences**: Control notification frequency and settings

## Database Tables

Three new tables have been created:

1. **achievement_progress**: Tracks "almost there" states
2. **user_achievement_preferences**: User settings for notifications
3. **achievement_notifications**: Queue of notifications to display

## Edge Function Setup

The `calculate-user-achievements` edge function processes all active users every 6 hours.

### Option 1: Manual Cron Setup (Recommended)

To set up automated background processing, run this SQL in your Supabase SQL editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule achievement calculation every 6 hours
SELECT cron.schedule(
  'calculate-achievements-every-6-hours',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT net.http_post(
    url:='https://vmuytzlhapllajxjdoph.supabase.co/functions/v1/calculate-user-achievements',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdXl0emxoYXBsbGFqeGpkb3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTcyMDgsImV4cCI6MjA3NzQ5MzIwOH0.qU9IHpiRfO1iN9cH1akhKQNIp93wGhuToh9nmaPFJuk"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Option 2: Manual Testing

You can manually trigger achievement calculation by calling the edge function:

```bash
curl -X POST \
  'https://vmuytzlhapllajxjdoph.supabase.co/functions/v1/calculate-user-achievements' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## How It Works

### 1. User Logs Entry
When a user logs an entry via QuickLogDialog:
- Entry is saved to `timeline_events`
- `updateAchievementsEnhanced()` is called
- New achievements or progress updates are detected
- Smart toast notification is shown

### 2. Background Processing
Every 6 hours (via cron):
- Edge function fetches users who logged entries in last 24 hours
- Calculates achievements for each user
- Creates notifications in `achievement_notifications` table
- Frontend shows toasts via realtime subscription

### 3. Progressive Disclosure
Users unlock new achievement types over time:
- **Week 1**: Consistency tracking only
- **Week 2**: + Symptom reduction
- **Week 3**: + Correlation insights
- **Week 4+**: + Lifestyle shifts

The system automatically advances users through weeks based on their account age (can be customized).

## Components

### Dashboard Integration
- `<EmergingPatterns />`: Shows progress toward unlocking achievements
- `<ContextualPrompts />`: Suggests what to track next
- `<Achievements />`: Displays active achievements (click for details)

### Hooks
- `useAchievementNotifications()`: Listens for and displays realtime notifications

### Libraries
- `achievementsEnhanced.ts`: Core logic for calculating achievements and progress
- `initializeUserPreferences.ts`: User preference management

## User Preferences

Users can control their achievement experience via settings:

```typescript
{
  notifications_enabled: boolean,
  notification_frequency: 'realtime' | 'daily' | 'weekly',
  progressive_complexity: 1 | 2 | 3 | 4 // Week level
}
```

## Customization

### Adjust Calculation Frequency
Edit the cron schedule (currently `0 */6 * * *` for every 6 hours):
- Every 4 hours: `0 */4 * * *`
- Twice daily: `0 9,21 * * *`
- Daily at midnight: `0 0 * * *`

### Add New Achievement Types
Edit `achievementsEnhanced.ts` and add calculation functions:

```typescript
async function calculateNewAchievementType(
  userId: string,
  events: TimelineEvent[],
  achievementMap: Map<string, any>
): Promise<Achievement[]> {
  // Your logic here
}
```

### Customize Notification Messages
Edit notification text in `useAchievementNotifications.ts`:

```typescript
const icons = {
  unlock: "🌱",
  progress: "💫",
  shift: "🔄",
  correlation: "🔍",
};
```

## Testing

1. **Log some entries**: Use QuickLogDialog to create test data
2. **Check achievements**: Should appear in Achievements card
3. **Check progress**: Should show in Emerging Patterns
4. **Trigger manual calculation**: Call edge function directly
5. **Verify notifications**: Watch for toast messages

## Monitoring

Check edge function logs:
- Navigate to Backend → Edge Functions → calculate-user-achievements → Logs
- Look for: "Processing achievements for X users"
- Monitor for errors or timeouts

## Security Note

The security warning about leaked password protection is unrelated to this achievement system. It's a general auth setting that can be enabled in Supabase Auth settings if needed.

## Future Enhancements

Potential improvements:
1. Achievement sharing with dieticians
2. Weekly email digests of achievements
3. Achievement history page
4. Custom achievement goals
5. Social sharing of milestones
6. Badge/reward system
7. Streak recovery grace periods
8. Team/group achievements