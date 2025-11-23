# Lifestyle & Recovery Achievement System

## Philosophy

**Reward intention & safe changes, not perfection.**

This system:
- ✅ Respects autonomy
- ✅ Recognizes intention
- ✅ Observes instead of judges
- ✅ Supports learning, not performance
- ✅ Never punishes or shames
- ✅ Validates quiet choices

---

## Achievement Types

### 1. Lifestyle Shift
**Triggered:** When user logs intention AND shows ≥1 day aligned behavior

**No streaks required. Rewards the attempt.**

**Examples:**
- "You chose no alcohol today — Aura will observe how this affects your sleep rhythm."
- "Low-sugar choices today — let's observe how your energy responds."
- "Earlier rest tonight — Aura will watch how this shapes your rhythm."

**Detection logic:**
- User declares focus area (e.g., "alcohol-free")
- Logs aligned behavior in notes/meals
- Achievement triggers immediately

### 2. Avoidance/Absence
**Triggered:** When user avoids a tracked harmful behavior

**Examples:**
- "No late meals today — easier digestion expected tonight."
- "No caffeine today — calmer nervous system ahead."

**Detection logic:**
- User has active focus on reducing something
- Explicitly notes avoidance in journal
- Achievement acknowledges the safe choice

### 3. Recovery-Safe
**Triggered:** When user avoids risky activity due to injury/symptom

**Examples:**
- "You honored your body's need for rest — stronger recovery from shoulder pain ahead."
- "You stayed away from high-impact training — recovery-minded choice."

**Detection logic:**
- Recent symptom logged (last 3 days)
- User either:
  - Takes rest day
  - Does only gentle movement (yoga, walking, stretching)
  - Notes recovery intention
- Achievement validates the wisdom

### 4. Restart
**Triggered:** When user resumes behavior after ≥3 days break

**Examples:**
- "You returned to movement — we'll continue learning your rhythm."
- "Welcome back to tracking nutrition — patterns will re-emerge."

**Detection logic:**
- Category (workout/meal) has ≥3 day gap
- User logs again
- Achievement welcomes them back without judgment

---

## Hybrid System: User-Declared + Aura-Inferred

### User-Declared Goals

**Location:** Dashboard → Lifestyle Focus card

**Available focuses:**
- Alcohol-free
- Reduce Sugar
- Improve Sleep Timing
- Reduce Caffeine
- Reduce Late Meals
- Gut Health

**How it works:**
1. User selects focus areas
2. Stored as `user_declared` status
3. Aura observes aligned behaviors
4. No pressure, no streaks, no failures

**UI copy:**
> "Aura will observe these patterns and highlight meaningful changes."

### Aura-Inferred Patterns

**How Aura detects:**
- Analyzes last 10 days of events
- Looks for ≥3 repeated patterns
- Examples:
  - 3 alcohol-free notes → infers alcohol-free intention
  - 3 early bed notes → infers sleep restructuring
  - 3 high-vegetable meals → infers nutrition shift

**Confirmation prompt:**
> "It looks like you're choosing alcohol-free days. Want Aura to observe this?"

**User options:**
- **"Yes, observe this"** → Becomes active focus
- **"Not now"** → Pattern dismissed, no further prompts
- **Ignore** → Quietly continues observing without achievements

---

## Data Model

### Tables

#### `lifestyle_focus`
```sql
{
  id: UUID,
  user_id: UUID,
  focus_type: TEXT,
  status: 'active' | 'inferred' | 'user_declared' | 'ignored' | 'removed',
  start_date: TIMESTAMP,
  last_detected: TIMESTAMP,
  confidence: NUMERIC (0-1),
  insight_reference: TEXT
}
```

**Status meanings:**
- `user_declared`: User manually selected
- `inferred`: Aura detected, awaiting confirmation
- `active`: Confirmed and actively observing
- `ignored`: User said "not now"
- `removed`: User deactivated

#### `lifestyle_achievements`
```sql
{
  id: UUID,
  user_id: UUID,
  focus_id: UUID (nullable),
  achievement_type: 'lifestyle_shift' | 'avoidance' | 'recovery_safe' | 'restart',
  title: TEXT,
  insight_text: TEXT,
  date_triggered: TIMESTAMP,
  confidence: NUMERIC (0-1),
  metadata: JSONB
}
```

**No expiration. No negative status.**

#### `inferred_patterns`
```sql
{
  id: UUID,
  user_id: UUID,
  pattern_type: TEXT,
  detection_count: INTEGER,
  first_detected: TIMESTAMP,
  last_detected: TIMESTAMP,
  confirmation_shown: BOOLEAN,
  user_response: 'accepted' | 'ignored' | 'dismissed',
  metadata: JSONB
}
```

---

## How To Log Behaviors

### For Lifestyle Shift

**Alcohol-free:**
```
Quick Log → Note: "No alcohol today"
```

**Low sugar:**
```
Quick Log → Meal: "Salad with no dressing, sugar-free"
```

**Better sleep:**
```
Quick Log → Note: "Early bed tonight, 9:30pm"
```

**Less caffeine:**
```
Quick Log → Note: "No coffee today, only herbal tea"
```

**No late meals:**
```
Quick Log → Note: "Finished dinner by 7pm, no late snacks"
```

### For Avoidance

Same as Lifestyle Shift, but emphasizes what was **not** done:
```
"Skipped caffeine after 2pm"
"No late meal tonight"
```

### For Recovery-Safe

After logging a symptom:
```
Quick Log → Symptom: "Shoulder pain, moderate"
(next day)
Quick Log → Note: "Rest day, no upper body work"
```

Or:
```
Quick Log → Workout: "Gentle yoga, 20min"
```

### For Restart

Just resume logging after a break:
```
(3+ days of no workouts)
Quick Log → Workout: "Morning walk, 30min"
```

Achievement automatically triggers: "Welcome back..."

---

## UI & Copy Guidelines

### Visual Style

**Color:** `#6CB792` (calm green)

**Tone:**
- Quiet
- Validating
- Observational
- Curious
- Never shaming

**Layout:**
- Subtle icons (Leaf, Heart, Shield, Sparkles)
- Breathable spacing
- Soft borders `border-[#6CB792]/20`
- Gentle backgrounds `bg-[#6CB792]/5`

### Copy Examples

**✅ Good:**
- "Steady changes like this can reshape your rhythm."
- "Let's watch how this affects your recovery."
- "Aura will observe how this shapes your sleep."

**❌ Bad:**
- "Great job! Keep it up!" (too performative)
- "You broke your streak." (punitive)
- "7-day challenge!" (gamified)

### What NOT To Show

- ❌ Streak counts for lifestyle
- ❌ "Failed" or "lost" badges
- ❌ Comparison to others
- ❌ Expired lifestyle achievements
- ❌ Trophies, fireworks, confetti
- ❌ Performance metrics

---

## Trigger Rules

### When Achievements Fire

✅ **Yes:**
- User actively chooses a behavior
- Correlation is possible later
- Intention is clear from notes
- Behavior aligns with declared focus

❌ **No:**
- Missing logs = lifestyle change
- One-off accidental behaviors
- Private health choices (medication)
- Passive gaps in tracking

### Confidence Scores

Achievements include confidence levels:
- **0.5**: Initial inference
- **0.6**: User-declared, first aligned behavior
- **0.7**: Avoidance with clear intent
- **0.75**: Recovery-safe with symptom context
- **0.8+**: Multiple observations strengthening pattern

Confidence grows with repeated observations.

---

## Integration Points

### Dashboard Layout

**Order of components:**
1. Profile Summary
2. Weekly Summary
3. **Lifestyle Focus Manager** ← New
4. **Inferred Pattern Prompt** ← New (if detected)
5. Contextual Prompts
6. Emerging Patterns
7. **Lifestyle Achievements** ← New
8. Regular Achievements

### QuickLog Integration

After every log:
1. Calculate regular achievements
2. Calculate lifestyle achievements
3. Priority notifications:
   - **Lifestyle achievements** (highest priority)
   - Regular achievements
   - Progress updates
   - Generic "logged" message

---

## Backend Processing

### Real-time (on user action)
- `QuickLogDialog` calls `calculateLifestyleAchievements()` after every log
- Immediate feedback for aligned behaviors

### Background (every 6 hours)
- Edge function `calculate-user-achievements` includes lifestyle logic
- Processes all active users
- Creates notifications

### Pattern Inference
- Called periodically (can be added to cron)
- Analyzes last 10 days
- Creates `inferred_patterns` records
- Triggers confirmation prompts

---

## Testing Guide

### Test Lifestyle Shift

1. Go to Dashboard → Lifestyle Focus → Add "Alcohol-free"
2. Quick Log → Note: "No alcohol today"
3. Wait 2 seconds
4. Check toast notification: "You chose no alcohol today..."
5. Verify in Lifestyle Achievements card

### Test Aura Inference

1. Log 3+ similar behaviors over 10 days:
   - Day 1: "No alcohol tonight"
   - Day 3: "Alcohol-free again"
   - Day 5: "Another alcohol-free day"
2. Wait for inference (can be triggered manually)
3. See prompt: "It looks like you're choosing alcohol-free days..."
4. Click "Yes, observe this"
5. Verify in Lifestyle Focus card

### Test Recovery-Safe

1. Log a symptom: "Shoulder pain, moderate"
2. Next day: Log note "Rest day, no upper body"
3. Check for achievement: "You honored your body's need for rest..."

### Test Restart

1. Log workouts daily for 3 days
2. Stop logging for 4 days
3. Log a workout again
4. Check for achievement: "Welcome back — we'll continue learning..."

---

## FAQ

### Q: Do lifestyle achievements expire?
**A:** No. They are permanent observations, never removed or marked as "failed."

### Q: What if I slip up?
**A:** Nothing negative happens. Aura only highlights positive choices. Gaps are ignored, not penalized.

### Q: Can I remove a focus?
**A:** Yes. Go to Lifestyle Focus → Manage → Uncheck any focus. Your past achievements remain.

### Q: How is this different from regular achievements?
**A:** 
- **Regular:** Patterns, streaks, consistency
- **Lifestyle:** Intentions, single choices, observations

### Q: Will Aura judge me?
**A:** Never. The system is designed to validate, not evaluate.

---

## Future Enhancements

Potential additions:
- Correlation tracking (e.g., alcohol-free → better sleep)
- Lifestyle insights in weekly summaries
- Dietician visibility of client lifestyle goals
- Export lifestyle journey timeline
- More focus types (stress, screen time, etc.)
- Confidence level visualizations
- Custom user-defined focuses

---

## Security Note

The remaining security warning about leaked password protection is a general Supabase auth setting and is unrelated to this lifestyle achievement system. It can be enabled in Supabase dashboard → Authentication → Policies if desired for production use.