# Complete Achievement System Setup

This guide covers setup for both **regular achievements** and **lifestyle/recovery achievements**.

---

## Database Tables

The following tables have been created:

### Regular Achievement Tables
- `achievements` - Main achievement tracking
- `achievement_progress` - "Almost there" states
- `achievement_notifications` - Notification queue
- `user_achievement_preferences` - User settings

### Lifestyle Achievement Tables
- `lifestyle_focus` - User-declared and inferred focus areas
- `lifestyle_achievements` - Lifestyle-specific achievements
- `inferred_patterns` - Aura's pattern detection

---

## Edge Function Setup

The `calculate-user-achievements` edge function has been updated to include lifestyle achievement calculations.

### Automated Background Processing (Recommended)

Run this SQL in Supabase SQL Editor to enable automated calculations every 6 hours:

```sql
-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule achievement calculation every 6 hours
SELECT cron.schedule(
  'calculate-achievements-every-6-hours',
  '0 */6 * * *', -- Every 6 hours at the top of the hour
  $$
  SELECT net.http_post(
    url:='https://vmuytzlhapllajxjdoph.supabase.co/functions/v1/calculate-user-achievements',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdXl0emxoYXBsbGFqeGpkb3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTcyMDgsImV4cCI6MjA3NzQ5MzIwOH0.qU9IHpiRfO1iN9cH1akhKQNIp93wGhuToh9nmaPFJuk"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Manual Testing

Test the edge function manually:

```bash
curl -X POST \
  'https://vmuytzlhapllajxjdoph.supabase.co/functions/v1/calculate-user-achievements' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

---

## Feature Overview

### For Users

**Dashboard Components:**
1. **Lifestyle Focus Manager** - Select focus areas to observe
2. **Inferred Pattern Prompts** - Aura's suggestions based on detected patterns
3. **Contextual Prompts** - Suggestions for what to track next
4. **Emerging Patterns** - Progress toward unlocking regular achievements
5. **Lifestyle Achievements** - Observations of intentional choices
6. **Regular Achievements** - Pattern-based milestone tracking

### Achievement Types

#### Regular Achievements (Existing)
- **Consistency**: 3+ consecutive days of tracking
- **Reduction**: Symptom frequency decrease
- **Correlation**: Activity → outcome relationships
- **Lifestyle** (original): Long-term behavior tracking

#### New Lifestyle Achievements
- **Lifestyle Shift**: Intention + 1 day aligned behavior
- **Avoidance**: Successful avoidance of harmful patterns
- **Recovery-Safe**: Wise rest during injury/symptoms
- **Restart**: Resuming after ≥3 day break

---

## User Flow Examples

### Example 1: User-Declared Focus

1. User goes to Dashboard
2. Clicks Lifestyle Focus → Manage
3. Selects "Alcohol-free"
4. Clicks Save
5. Later logs: "No alcohol today"
6. Gets toast: "You chose no alcohol today — Aura will observe how this affects your sleep rhythm."
7. Achievement appears in Lifestyle Achievements card

### Example 2: Aura Inference

1. User logs naturally over 10 days:
   - Day 1: "Early bed tonight, 9pm"
   - Day 4: "Another early night"
   - Day 7: "Sleep by 9:30pm"
2. Aura detects pattern
3. Prompt appears: "It looks like you're choosing earlier sleep. Want Aura to observe this?"
4. User clicks "Yes, observe this"
5. Focus area activated
6. Future aligned behaviors trigger achievements

### Example 3: Recovery-Safe

1. User logs: "Knee pain, moderate"
2. Next day logs: "Rest day, no running"
3. Gets achievement: "You honored your body's need for rest — stronger recovery ahead."

---

## Design Philosophy

### Visual Language

**Colors:**
- Regular achievements: Primary theme colors
- Lifestyle achievements: `#6CB792` (calm green)

**Icons:**
- Lifestyle Focus: `Leaf`
- Lifestyle Shift: `Leaf`
- Avoidance: `Shield`
- Recovery-Safe: `Heart`
- Restart: `Sparkles`

**Tone:**
- Quiet validation
- Observational curiosity
- No judgment or pressure
- Supporting learning, not performance

### Copy Principles

✅ **Do:**
- "Let's observe how this affects..."
- "Steady changes reshape..."
- "Aura will watch..."
- "You honored..."

❌ **Don't:**
- "Great job! Keep it up!"
- "You lost your streak!"
- "Challenge completed!"
- Performance comparisons

---

## Technical Implementation

### Real-time Calculations

After every log (`QuickLogDialog.tsx`):
```typescript
// 1. Save event to database
const { error } = await supabase.from("timeline_events").insert(eventData);

// 2. Calculate achievements
const { newAchievements, progressUpdates } = await updateAchievementsEnhanced(user.id);
const lifestyleAchievements = await calculateLifestyleAchievements(user.id);

// 3. Show notification (priority order)
if (lifestyleAchievements.length > 0) {
  // Lifestyle achievements have highest priority
  toast({ title: lifestyle.title, description: lifestyle.insight_text });
} else if (newAchievements.length > 0) {
  // Regular achievements
  toast({ title: "🌱 New Pattern Detected", description: achievement.insight_text });
} else if (progressUpdates.length > 0) {
  // Progress updates
  toast({ title: "💫 Almost There", description: progress.progress_message });
}
```

### Background Processing

Edge function runs every 6 hours:
1. Fetches users with events in last 24 hours
2. Calculates regular achievements
3. Calculates lifestyle achievements
4. Creates notifications in database
5. Frontend shows via realtime subscription

### Progressive Complexity

Users unlock achievement types gradually:
- **Week 1**: Consistency only
- **Week 2**: + Reduction
- **Week 3**: + Correlation
- **Week 4+**: + Original Lifestyle

New lifestyle achievements are available from day 1.

---

## Monitoring

### Check Edge Function Logs

Navigate to:
- Backend → Edge Functions → `calculate-user-achievements` → Logs

Look for:
- "Processing achievements for X users"
- "newAchievements: N, lifestyleAchievements: M"
- Any errors or timeouts

### Verify Realtime Updates

Open browser console and run:
```javascript
// Check if realtime is working
const channel = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lifestyle_achievements'
  }, (payload) => console.log('Lifestyle achievement:', payload))
  .subscribe();
```

---

## Common Issues

### Issue: Lifestyle achievements not triggering

**Solution:**
1. Verify user has active focus area in `lifestyle_focus` table
2. Check that log description contains expected keywords
3. Ensure keywords are lowercase in detection logic
4. Check edge function logs for errors

### Issue: Inferred patterns not showing

**Solution:**
1. User needs ≥3 similar behaviors in 10 days
2. Check `inferred_patterns` table for detection_count
3. Verify `confirmation_shown = false`
4. Manually trigger inference: `inferLifestylePatterns(userId)`

### Issue: Notifications not appearing

**Solution:**
1. Check `achievement_notifications` table for new records
2. Verify realtime subscription is active
3. Check `useAchievementNotifications` hook is called
4. Test with manual notification insert

---

## Performance Considerations

### Database Queries

**Optimized with indexes:**
- `idx_lifestyle_focus_user_id` on `(user_id, status)`
- `idx_lifestyle_achievements_user_id` on `(user_id, date_triggered)`
- `idx_inferred_patterns_user_id` on `(user_id, confirmation_shown)`

### Edge Function Optimization

- Processes only users with recent activity (last 24 hours)
- Batches database operations
- Skips users with notifications disabled
- Timeout: 60 seconds per function invocation

### Frontend Optimization

- Realtime subscriptions only for current user
- Components unmount cleanly (prevent memory leaks)
- Lazy loading of achievement details
- Debounced inference checks

---

## Scaling Considerations

**Current limits:**
- Edge function: 60s timeout
- Realtime: 100 concurrent channels per connection
- Database: Standard Supabase limits

**For growth:**
- Shard users across multiple scheduled functions
- Add rate limiting to prevent spam
- Cache frequently accessed achievements
- Consider Redis for high-frequency updates

---

## Security

All tables have proper RLS policies:
- Users can only view/modify their own data
- Dieticians can view client achievements
- Service role key for edge functions only

**Remaining warning:**
- Leaked password protection (general auth setting)
- Unrelated to achievement system
- Can be enabled in Supabase dashboard if needed

---

## Testing Checklist

### Regular Achievements
- [ ] Log 3 consecutive workouts → Consistency achievement
- [ ] Check Emerging Patterns for progress indicators
- [ ] Click achievement card → Detail modal opens
- [ ] Verify toast notification on unlock

### Lifestyle Achievements
- [ ] Add lifestyle focus → Appears in card
- [ ] Log aligned behavior → Achievement unlocks
- [ ] Verify toast shows lifestyle message
- [ ] Check Lifestyle Achievements card displays it

### Aura Inference
- [ ] Log 3+ similar patterns → Prompt appears
- [ ] Click "Yes, observe this" → Becomes active focus
- [ ] Click "Not now" → Prompt disappears
- [ ] Verify focus appears in Lifestyle Focus card

### Recovery & Restart
- [ ] Log symptom → Log rest → Recovery achievement
- [ ] Stop logging for 4 days → Resume → Restart achievement

---

## Documentation

- **Achievement System Setup**: `ACHIEVEMENT_SYSTEM_SETUP.md`
- **Lifestyle Achievements Guide**: `LIFESTYLE_ACHIEVEMENTS_GUIDE.md`
- **This file**: Complete setup overview

---

## Support

For issues or questions:
1. Check edge function logs
2. Verify database tables exist with correct RLS
3. Test realtime subscriptions
4. Review user's `lifestyle_focus` and `user_achievement_preferences` records