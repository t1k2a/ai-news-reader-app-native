# GlotNexus Phase 2 Marketing Strategy

**Created**: 2026-02-19
**Phase**: 2 (Marketing Strategy Build-out)
**Phase 1 Status**: Completed (Enhanced tweet format, A/B testing, posting schedule, translation quality)

---

## Executive Summary

GlotNexus is an AI news aggregator that collects English-language AI news via RSS, translates it to Japanese, and auto-posts to X (Twitter). Phase 1 established the technical foundation (enhanced tweet format, optimized posting schedule, improved translations). Phase 2 focuses on building a systematic marketing strategy to achieve measurable growth on X.

**Phase 2 Goals (1 month):**

| Metric | Target |
|--------|--------|
| Monthly impressions | 8,000-12,000 |
| Follower growth | +50-100 |
| Site visits | 200-350/month |

---

## 1. Current State Analysis

### What We Have

- **17 RSS feeds** from major AI sources (OpenAI, Google AI, Anthropic, etc.)
- **Auto-posting** via Vercel Cron (3x daily: 08:00, 12:30, 20:00 JST)
- **Enhanced tweet format** with hooks, value propositions, CTAs, Japanese hashtags
- **A/B testing** infrastructure (simple vs enhanced format)
- **Brand card** image generation capability (not yet enabled in production)
- **Thread format** support (URL-in-reply to avoid algorithm penalty)
- **Time-based posting volume**: Peak hours = 5 posts, off-peak = 2 posts
- **Source priority system**: AI labs > media > academic papers

### What We Need

- Systematic engagement strategy beyond auto-posting
- Content variety (not just RSS news reposts)
- Community building tactics
- Measurement and iteration framework
- X Premium account for algorithmic reach advantage

---

## 2. Target Audience Definition

### Primary Audience: Japanese AI Professionals

| Segment | Description | Estimated Size on X |
|---------|-------------|---------------------|
| AI Engineers/Developers | Write code using AI APIs and tools daily | Large |
| Tech Business Leaders | CTOs, PMs evaluating AI for their products | Medium |
| AI Researchers | Academic and industry researchers in Japan | Medium |
| AI Enthusiasts | Non-technical people interested in AI trends | Large |

### Audience Characteristics

- **Language**: Japanese-primary, can read some English but prefer Japanese summaries
- **Active hours on X**: 7-9 AM, 12-1 PM, 6-10 PM JST (already aligned with our Cron schedule)
- **Content preferences**: Actionable insights > raw news, Japanese context > direct translations
- **Pain point**: Overwhelming volume of English-language AI news, hard to filter what matters

### Value Proposition

> "GlotNexus delivers the most important AI news from 17 global sources, translated and summarized in Japanese, so you never miss a critical development."

---

## 3. Selected Marketing Strategies

Based on X algorithm analysis (2026), competitive research, and GlotNexus's unique strengths, the following 7 strategies are prioritized by impact and implementation feasibility.

### Strategy 1: Enable X Premium Account

**Priority**: Critical
**Cost**: ~1,000 JPY/month (X Premium Basic)
**Expected Impact**: 5-10x reach per post

**Rationale**: Unverified accounts need approximately 10x more engagement to achieve the same reach as verified accounts. This is the single highest-ROI investment available.

**Action Items**:
- [ ] Subscribe to X Premium for the GlotNexus account
- [ ] Enable long-form posts (for deeper analysis threads)
- [ ] Use Premium analytics for detailed performance tracking

---

### Strategy 2: Enable Brand Card Images (USE_BRAND_CARD=true)

**Priority**: High
**Cost**: Zero (already implemented in code)
**Expected Impact**: +50-100% engagement rate

**Rationale**: The brand card generation feature (`lib/brand-card.ts`) is already implemented but disabled (`USE_BRAND_CARD=false`). Visual posts on X get significantly higher engagement. The brand card creates a consistent, recognizable visual identity across posts.

**Action Items**:
- [ ] Set `USE_BRAND_CARD=true` in Vercel environment variables
- [ ] Monitor image upload success rate in Vercel logs
- [ ] A/B test: Run 1 week with images vs 1 week without, compare impressions and engagement

---

### Strategy 3: Enable Thread Format (USE_THREAD_FORMAT=true)

**Priority**: High
**Cost**: Zero (already implemented in code)
**Expected Impact**: +200% engagement (threads get 3x more engagement than single tweets)

**Rationale**: The URL-in-reply format (`formatTweetWithReplyAsync`) is already implemented. X's algorithm penalizes external links in the main tweet. The thread format:
1. Main tweet: Hook + value proposition + hashtags (no URL = better reach)
2. Reply: Article URL + original source link

This exploits the algorithm scoring: Replies x13.5 weight + avoiding the external link penalty on the main tweet.

**Action Items**:
- [ ] Set `USE_THREAD_FORMAT=true` in Vercel environment variables
- [ ] Monitor reply posting success rate (the code already has error handling for failed replies)
- [ ] Compare impression/engagement data: single tweet vs thread format over 2 weeks

---

### Strategy 4: Daily Engagement Routine (Manual, 30 min/day)

**Priority**: High
**Cost**: 30 minutes of time daily
**Expected Impact**: +100-200% follower growth rate, algorithmic boost from engagement activity

**Rationale**: X's algorithm rewards accounts that engage with others. Spending 70% of time engaging and 30% creating is the recommended ratio. Replies carry 13.5x the weight of likes in the algorithm.

**Daily Routine (30 minutes)**:

| Time Block | Duration | Activity |
|-----------|----------|----------|
| Morning (7-8 AM) | 10 min | Reply to 3-5 trending AI posts in Japanese |
| Midday (12-1 PM) | 10 min | Repost with comment on 2-3 high-quality AI news items |
| Evening (7-8 PM) | 10 min | Reply to followers, engage with AI community discussions |

**Target Account Categories** (build a list of 30-50 accounts):

| Category | Examples | Engagement Style |
|----------|----------|-----------------|
| Japanese AI Researchers | University professors, lab leads | Thoughtful questions, share related GlotNexus articles |
| Japanese AI Startups | CTO/founders of AI companies | Comment with industry context |
| Japanese Tech Media | ITmedia AI+, Ledge.ai journalists | Provide additional data points |
| Global AI Labs | @OpenAI, @AnthropicAI, @GoogleAI | Quote tweet with Japanese translation/commentary |

**Quality Comment Templates**:
- Add new perspective: "This connects to [related trend]. GlotNexus covered similar developments from [source]..."
- Ask deep question: "[Specific detail] is interesting. How do you see this affecting [Japanese market context]?"
- Share data: "For context, [related statistic or timeline]. We've been tracking this at GlotNexus."

---

### Strategy 5: Content Mix Beyond Auto-Posts

**Priority**: High
**Cost**: 2-3 hours/week
**Expected Impact**: +50% follower retention, higher engagement rate

**Rationale**: Pure news reposts make the account feel like a bot. Adding editorial content builds trust and authority. X's algorithm favors accounts that create conversation.

**Content Calendar (Weekly)**:

| Content Type | Frequency | Format | Source |
|-------------|-----------|--------|--------|
| Auto RSS News | 3x/day (auto) | Enhanced tweet or thread | Vercel Cron |
| Weekly AI Roundup | 1x/week (Fri) | Thread (5-8 tweets) | Manual, curated from week's top stories |
| Quick Take / Opinion | 2-3x/week | Single tweet, no link | Manual, reaction to breaking AI news |
| Poll / Question | 1x/week | X Poll | Manual |
| Infographic / Data | 1x/week | Image post | Manual, using Canva or similar |

**Weekly AI Roundup Thread Format**:
```
Tweet 1: "This week's top 5 AI developments you need to know (thread)"
Tweet 2: #1 [Most important story] + brief Japanese commentary
Tweet 3: #2 [Second story] + commentary
Tweet 4: #3 [Third story] + commentary
Tweet 5: #4 [Fourth story] + commentary
Tweet 6: #5 [Fifth story] + commentary
Tweet 7: "Follow @GlotNexus for daily AI news in Japanese. Visit glotnexus.jp for the full collection."
```

**Quick Take Format**:
```
[Hot take or opinion on breaking AI news]

What do you think?

#AI #[relevant tag]
```

No external link, pure text. Optimized for algorithm reach and replies (13.5x weight).

---

### Strategy 6: Hashtag Strategy Optimization

**Priority**: Medium
**Cost**: Zero (code change)
**Expected Impact**: +30-50% discoverability

**Current Implementation Analysis**:
The current system uses 5 hashtags (max) combining source tag + topic tags + base tags (#AI, #海外のAIニュース) + brand tag (#GlotNexus).

**Recommended Optimization**:

Research shows 1-2 hashtags is optimal for X engagement. The current 5 hashtags may appear spammy. Recommend:

| Slot | Purpose | Example |
|------|---------|---------|
| 1 | High-volume discovery tag | #AI or #生成AI |
| 2 | Topic-specific niche tag | #LLM, #ChatGPT, #OpenAI (based on article content) |

Remove: #GlotNexus (too niche, no search volume), #海外のAIニュース (too long, low search volume)

Instead, put brand attribution in the profile bio and pinned tweet.

**Implementation**: Modify `generateHashtags()` in `lib/auto-post-enhanced.ts` to return max 2 tags.

---

### Strategy 7: Profile Optimization

**Priority**: Medium
**Cost**: Zero
**Expected Impact**: +20-40% follow-through rate from profile visitors

**Profile Checklist**:

- [ ] **Display Name**: "GlotNexus | AI News in Japanese" (clear value prop)
- [ ] **Bio**: "17+のグローバルAIソースから、最重要ニュースを日本語で毎日配信。OpenAI, Google AI, Anthropic, DeepMindなど。"
- [ ] **Pinned Tweet**: Best-performing weekly roundup thread, or an introduction thread explaining what GlotNexus does
- [ ] **Profile Image**: Clean, professional logo
- [ ] **Banner Image**: Show value proposition visually (e.g., "17 AI sources -> Japanese news feed")
- [ ] **Link**: https://glotnexus.jp
- [ ] **Location**: "Global AI News for Japan"

---

## 4. Implementation Roadmap

### Week 1 (Feb 19-25): Quick Wins

| Day | Action | Owner | Status |
|-----|--------|-------|--------|
| 1 | Enable USE_BRAND_CARD=true in Vercel | Dev | Pending |
| 1 | Enable USE_THREAD_FORMAT=true in Vercel | Dev | Pending |
| 1 | Optimize profile (bio, pinned tweet, banner) | Marketing | Pending |
| 2-3 | Start daily engagement routine (30 min/day) | Marketing | Pending |
| 3 | Subscribe to X Premium | Owner | Pending |
| 5 | Review first week's analytics | Marketing | Pending |

### Week 2 (Feb 26-Mar 4): Content Diversification

| Day | Action | Owner | Status |
|-----|--------|-------|--------|
| 1 | Create first Weekly AI Roundup thread | Marketing | Pending |
| 2 | Post first Quick Take (opinion tweet) | Marketing | Pending |
| 3 | Post first X Poll | Marketing | Pending |
| 4 | Reduce hashtags to max 2 (code change) | Dev | Pending |
| 5 | Week 2 analytics review | Marketing | Pending |

### Week 3-4 (Mar 5-18): Scale & Optimize

| Day | Action | Owner | Status |
|-----|--------|-------|--------|
| Ongoing | Daily engagement routine (refine target list) | Marketing | Pending |
| Weekly | Weekly AI Roundup thread (every Friday) | Marketing | Pending |
| Weekly | 2-3 Quick Takes + 1 Poll | Marketing | Pending |
| Week 3 | Analyze thread vs single tweet A/B data | Dev/Marketing | Pending |
| Week 4 | Analyze brand card impact on engagement | Dev/Marketing | Pending |
| Week 4 | Month-end comprehensive review | Marketing | Pending |

---

## 5. Measurement Framework

### Key Metrics (Weekly Tracking)

| Metric | Week 1 Target | Week 2 Target | Week 3 Target | Week 4 Target |
|--------|---------------|---------------|---------------|---------------|
| Impressions/post | 100-200 | 200-400 | 300-500 | 400-600 |
| Weekly impressions | 2,000-3,000 | 3,000-5,000 | 4,000-6,000 | 5,000-8,000 |
| Engagement rate | 1-2% | 2-3% | 2.5-4% | 3-5% |
| New followers | +5-10 | +10-20 | +15-25 | +20-30 |
| Site visits (weekly) | 20-40 | 40-70 | 60-100 | 80-120 |

### Tracking Tools

1. **X Analytics** (analytics.twitter.com): Impressions, engagement, follower growth
2. **Google Analytics**: Site visits from X (referrer tracking)
3. **Vercel Logs**: Auto-post success rates, brand card upload success, thread reply success
4. **Weekly Spreadsheet**: Manual tracking of all metrics

### Weekly Review Template

```
## Week N Review (Date)

### Numbers
- Total impressions: [number]
- Average impressions/post: [number]
- Engagement rate: [%]
- New followers: [+number]
- Site visits from X: [number]

### Top 3 Performing Posts
1. [post] - [impressions] impressions, [engagement] engagements. Why: [analysis]
2. [post] - ...
3. [post] - ...

### Bottom 3 Performing Posts
1. [post] - [impressions] impressions. Why: [analysis]
2. ...
3. ...

### Learnings
- What worked: ...
- What didn't: ...
- Surprises: ...

### Next Week Actions
1. ...
2. ...
3. ...
```

---

## 6. Budget Summary

| Item | Monthly Cost | Priority |
|------|-------------|----------|
| X Premium Basic | ~1,000 JPY | Critical |
| Time: Daily engagement (30 min/day) | ~15 hours | High |
| Time: Content creation (2-3 hr/week) | ~10 hours | High |
| Time: Weekly review (1 hr/week) | ~4 hours | Medium |
| **Total monetary cost** | **~1,000 JPY/month** | |
| **Total time investment** | **~29 hours/month** | |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| X API rate limits from thread posting | Medium | High | Monitor API errors in Vercel logs; reduce posting volume if needed |
| Brand card generation failures | Low | Low | Code already has fallback to text-only posting |
| Translation quality issues in enhanced tweets | Medium | Medium | Monitor via weekly content review; maintain translation dictionary |
| X account suspension (too many auto-posts) | Low | Critical | Stay within API limits; mix auto/manual content; avoid follow/unfollow tactics |
| Low engagement despite optimizations | Medium | Medium | Iterate on hook templates; increase manual engagement time; try different content types |

---

## 8. Success Criteria for Phase 2 Completion

Phase 2 is considered **complete** when all of the following are achieved:

- [ ] Monthly impressions >= 8,000
- [ ] Follower growth >= +50 in the month
- [ ] Site visits >= 200/month
- [ ] Weekly AI Roundup is established as a regular series
- [ ] Daily engagement routine has been maintained for 3+ weeks
- [ ] Brand card and thread format have been tested with data

**Estimated completion**: End of March 2026

**Next phase**: Phase 3 (SEO Foundation) - as documented in `docs/marketing-implementation-plan.md`

---

## Appendix A: X Algorithm Scoring Reference (2026)

Based on research from Sprout Social, SocialBee, and PostEverywhere:

| Signal | Weight | Implication for GlotNexus |
|--------|--------|---------------------------|
| Likes | x1 | Baseline engagement |
| Retweets | x20 | Create shareable content (weekly roundups) |
| Replies | x13.5 | Ask questions, create discussion |
| Profile clicks | x12 | Strong bio and profile optimization |
| Link clicks | x11 | Clear CTA and value proposition |
| Bookmarks | x10 | Create reference-worthy content (roundups, data) |
| Conversation depth | Dominant | Thread format drives multi-level replies |

**Key takeaway**: Replies and retweets are dramatically more valuable than likes. Design content that provokes responses and sharing.

## Appendix B: Immediate Environment Variable Changes

```bash
# Enable in Vercel Dashboard immediately
USE_BRAND_CARD=true
USE_THREAD_FORMAT=true

# Already set (verify these are correct)
TWEET_FORMAT_VARIANT=enhanced
AUTO_POST_MAX_PER_RUN=10
AUTO_POST_DELAY_SECONDS=10
APP_BASE_URL=https://glotnexus.jp
```

## Appendix C: Reference Sources

- [X Marketing Benchmarks for 2026 - WebFX](https://www.webfx.com/blog/social-media/x-twitter-marketing-benchmarks/)
- [How to Grow on X: Complete Guide 2026 - SocialRails](https://socialrails.com/blog/how-to-grow-on-twitter-x-complete-guide)
- [X Algorithm 2026 - Sprout Social](https://sproutsocial.com/insights/twitter-algorithm/)
- [X Algorithm 2026 - PostEverywhere](https://posteverywhere.ai/blog/how-the-x-twitter-algorithm-works)
- [X Tips 2026 - Brand24](https://brand24.com/blog/twitter-tips/)
- [Twitter Growth Strategies - Dan Siepen](https://www.dansiepen.io/growth-checklists/twitter-x-growth-strategies)
- [X Organic Guide 2025/2026 - Avenue Z](https://avenuez.com/blog/2025-2026-x-twitter-organic-social-media-guide-for-brands/)
- [X Algorithm (Japanese) - shubihiro.com](https://shubihiro.com/column/x-algorithm2025/)
