# Achievement System Architecture

## Overview

The achievement system consists of two complementary modules that work together to recognize and celebrate user health patterns:

### 1. Enhanced Achievements (`achievementsEnhanced.ts`)
**Purpose:** General pattern detection and consistency tracking

**Capabilities:**
- Consistency streaks (daily logging, regular meals, workout frequency)
- Reduction patterns (decreasing symptom severity over time)
- Correlation detection (workout → mood improvements)
- Automatic pattern recognition from timeline data

**Database Tables:**
- `achievements` - Active patterns and streaks
- `achievement_progress` - Progress toward new patterns
- `achievement_notifications` - User notifications

**When it runs:** 
- Asynchronously after timeline events are saved
- Non-blocking to prevent UI delays

---

### 2. Lifestyle Achievements (`lifestyleAchievements.ts`)
**Purpose:** User-declared lifestyle focus tracking

**Capabilities:**
- Tracks progress on specific lifestyle goals (e.g., "cutting sugar", "increasing protein")
- Detects lifestyle shifts, avoidance patterns, recovery periods
- Higher confidence scoring for user-declared goals vs auto-detected patterns
- Manages lifestyle focus areas

**Database Tables:**
- `lifestyle_focus` - User's declared focus areas
- `lifestyle_achievements` - Achievements tied to specific focus areas

**When it runs:** 
- Asynchronously after timeline events are saved
- Non-blocking to prevent UI delays

---

## How They Work Together

1. **User logs a timeline event** (meal, workout, symptom, etc.)
2. Event is saved to `timeline_events` table immediately
3. UI shows success feedback right away
4. **Both systems process in background:**
   - `achievementsEnhanced` scans for new patterns
   - `lifestyleAchievements` checks against user's declared goals
5. If patterns found, notifications are shown (priority: lifestyle > new achievements > progress)
6. If calculation fails, error is logged but doesn't affect the save

---

## Performance Optimization

### Current Implementation
- Both systems run in parallel using `Promise.all()`
- Fire-and-forget pattern (don't await, just catch errors)
- Typical execution time: 500ms-2s
- Non-blocking: Users can continue using the app immediately

### Future Optimization Options

**Option A: Database Trigger** (Recommended for scale)
```sql
CREATE TRIGGER after_timeline_insert
  AFTER INSERT ON timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_achievement_calculation();
```
This would move all calculation to the backend, removing any client-side wait time.

**Option B: Background Job Queue**
Use a job queue system (like pg_cron + edge function) to batch process achievements periodically.

**Option C: Edge Function with Background Tasks**
Use `EdgeRuntime.waitUntil()` in an edge function to handle calculation asynchronously.

---

## Error Handling

The system is designed to **never block saves due to achievement failures**:

1. Timeline event save happens first
2. Success feedback shown immediately
3. Achievement calculations run in background
4. If they fail:
   - Error is logged to console
   - No error shown to user
   - User's data is safe

This prevents scenarios where achievement bugs prevent users from logging critical health data.

---

## Adding New Achievement Types

### For General Patterns (achievementsEnhanced.ts)
1. Add detection logic in `detectNewPatterns()`
2. Define insight text templates
3. Add progress thresholds
4. Test with various timeline event patterns

### For Lifestyle Goals (lifestyleAchievements.ts)
1. Add focus type to detection system
2. Define achievement triggers
3. Set confidence scoring rules
4. Link to lifestyle_focus entries

---

## Migration Path

**Current Status:** Both systems are active and working

**Future Consolidation Plan:**
1. Create unified `src/lib/achievements/` module
2. Move shared types to `types.ts`
3. Move notification logic to `notifications.ts`
4. Keep separate detection modules but unified interface
5. Deprecate old files with clear migration guide

**Do NOT consolidate yet** - both systems are actively used and work well. Consolidation should only happen when we identify concrete performance or maintenance issues.
