export interface HookFormula {
  id: string;
  formula: string;
  style: "question" | "statistic" | "story" | "controversial" | "visual";
  psychTrigger: string;
  niches: string[];
  tone: string[];
  exampleHook: string;
  estimatedRetention: number;
}

export const HOOK_FORMULAS: HookFormula[] = [
  {
    id: "nobody_tells_you",
    formula: "Nobody tells you [surprising fact about X] — but it's the reason [outcome].",
    style: "controversial",
    psychTrigger: "knowledge gap + betrayal",
    niches: ["finance", "productivity", "self-improvement", "health"],
    tone: ["dramatic", "curiosity"],
    exampleHook:
      "Nobody tells you that 90% of lottery winners go broke — but it's the reason most millionaires hide their wealth.",
    estimatedRetention: 78,
  },
  {
    id: "what_happens_when",
    formula:
      "What happens when [extreme scenario]? The answer will change how you [relevant action].",
    style: "question",
    psychTrigger: "curiosity gap + self-relevance",
    niches: ["science", "history", "psychology", "tech"],
    tone: ["curiosity", "dramatic"],
    exampleHook:
      "What happens when you stop eating sugar for 30 days? The answer will change how you look at every meal.",
    estimatedRetention: 74,
  },
  {
    id: "shocking_stat_open",
    formula: "[Shocking statistic]. And [counterintuitive implication].",
    style: "statistic",
    psychTrigger: "pattern interrupt + cognitive dissonance",
    niches: ["finance", "health", "business", "social"],
    tone: ["dramatic", "curiosity"],
    exampleHook:
      "93% of people who start a diet fail within the first week. And the reason has nothing to do with willpower.",
    estimatedRetention: 81,
  },
  {
    id: "mid_story_drop",
    formula:
      "I [did extreme thing / was in impossible situation] — and what I found changed everything.",
    style: "story",
    psychTrigger: "narrative tension + social proof",
    niches: ["self-improvement", "travel", "finance", "health"],
    tone: ["emotional", "dramatic"],
    exampleHook:
      "I lost $50,000 in a single day — and what I found in the aftermath changed everything about how I think about money.",
    estimatedRetention: 76,
  },
  {
    id: "the_real_reason",
    formula:
      "The real reason [widely believed thing] is [surprising alternative truth].",
    style: "controversial",
    psychTrigger: "myth-busting + contrarian curiosity",
    niches: ["health", "fitness", "productivity", "finance"],
    tone: ["dramatic", "curiosity"],
    exampleHook:
      "The real reason you can't lose weight isn't your diet — it's something you do every single morning without thinking.",
    estimatedRetention: 82,
  },
  {
    id: "in_x_years",
    formula:
      "In [timeframe], [dramatic change in world/life]. Here's what nobody is doing about it.",
    style: "controversial",
    psychTrigger: "FOMO + urgency",
    niches: ["tech", "finance", "future", "business"],
    tone: ["dramatic", "curiosity"],
    exampleHook:
      "In 5 years, AI will eliminate 40% of white-collar jobs. Here's what nobody is doing about it.",
    estimatedRetention: 79,
  },
  {
    id: "stop_doing",
    formula: "Stop [commonly accepted advice]. Do this instead.",
    style: "controversial",
    psychTrigger: "contrarian authority + pattern break",
    niches: ["productivity", "fitness", "finance", "parenting"],
    tone: ["dramatic"],
    exampleHook: "Stop drinking 8 glasses of water a day. Do this instead.",
    estimatedRetention: 73,
  },
  {
    id: "most_people_dont_know",
    formula:
      "Most people spend [time/money/effort] on [thing]. They don't know [better approach] exists.",
    style: "controversial",
    psychTrigger: "insider knowledge + FOMO",
    niches: ["finance", "productivity", "health", "business"],
    tone: ["curiosity", "dramatic"],
    exampleHook:
      "Most people spend years learning to invest. They don't know a 3-step system used by hedge funds has been public for decades.",
    estimatedRetention: 77,
  },
  {
    id: "visual_scene_setter",
    formula:
      "Picture this: [vivid, unexpected scene]. That's [relevant concept / what's about to happen to viewer].",
    style: "visual",
    psychTrigger: "mental simulation + self-relevance",
    niches: ["storytelling", "horror", "mystery", "self-improvement"],
    tone: ["emotional", "dramatic"],
    exampleHook:
      "Picture this: you wake up, check your bank account, and it's $0. That's the reality for 60% of Americans right now.",
    estimatedRetention: 75,
  },
  {
    id: "what_if_hook",
    formula: "What if [impossible / counterintuitive thing] was actually [accessible/true]?",
    style: "question",
    psychTrigger: "possibility thinking + open loop",
    niches: ["self-improvement", "science", "tech", "philosophy"],
    tone: ["curiosity", "emotional"],
    exampleHook: "What if retiring at 35 was actually easier than retiring at 65?",
    estimatedRetention: 72,
  },
  {
    id: "dark_secret",
    formula:
      "There's a [dark secret / hidden truth] about [familiar thing] that [industry] doesn't want you to know.",
    style: "controversial",
    psychTrigger: "conspiracy + insider knowledge",
    niches: ["health", "food", "finance", "tech"],
    tone: ["dramatic"],
    exampleHook:
      "There's a dark secret about the fitness industry that supplement companies don't want you to know.",
    estimatedRetention: 83,
  },
  {
    id: "personal_failure_pivot",
    formula:
      "I used to [embarrassing/painful situation]. Then I discovered [turning point]. Everything changed.",
    style: "story",
    psychTrigger: "vulnerability + relatability + hope",
    niches: ["self-improvement", "mental health", "finance", "fitness"],
    tone: ["emotional"],
    exampleHook:
      "I used to panic every time I checked my bank account. Then I discovered one habit that changed my relationship with money forever.",
    estimatedRetention: 77,
  },
  {
    id: "countdown_listicle",
    formula:
      "[Number] things you're doing right now that [negative consequence]. Number [X] will shock you.",
    style: "statistic",
    psychTrigger: "self-audit anxiety + curiosity",
    niches: ["health", "productivity", "relationships", "finance"],
    tone: ["dramatic", "curiosity"],
    exampleHook:
      "7 things you're doing right now that are slowly destroying your metabolism. Number 3 will shock you.",
    estimatedRetention: 74,
  },
  {
    id: "before_after",
    formula:
      "[Time period] ago I was [negative state]. Today I [dramatically better state]. This is what changed.",
    style: "story",
    psychTrigger: "transformation + aspiration",
    niches: ["fitness", "finance", "self-improvement", "business"],
    tone: ["emotional", "dramatic"],
    exampleHook:
      "Two years ago I was $80K in debt and working 3 jobs. Today I cleared everything. This is what changed.",
    estimatedRetention: 80,
  },
  {
    id: "they_lied_to_us",
    formula: "Everything you've been told about [topic] is wrong. Here's the truth.",
    style: "controversial",
    psychTrigger: "authority challenge + indignation",
    niches: ["health", "nutrition", "finance", "history"],
    tone: ["dramatic"],
    exampleHook:
      "Everything you've been told about how to save money is wrong. Here's what actually works.",
    estimatedRetention: 76,
  },
  {
    id: "experiment_hook",
    formula:
      "I tried [extreme experiment / challenge] for [duration]. Here's exactly what happened.",
    style: "story",
    psychTrigger: "vicarious experience + curiosity",
    niches: ["health", "productivity", "tech", "lifestyle"],
    tone: ["curiosity", "emotional"],
    exampleHook:
      "I tried sleeping only 4 hours a night for 30 days. Here's exactly what happened to my brain.",
    estimatedRetention: 78,
  },
  {
    id: "number_one_mistake",
    formula:
      "The #1 mistake [audience] make with [topic] — and it's costing them [consequence].",
    style: "statistic",
    psychTrigger: "loss aversion + self-improvement anxiety",
    niches: ["finance", "business", "relationships", "health"],
    tone: ["dramatic", "curiosity"],
    exampleHook:
      "The #1 mistake new investors make with their money — and it's costing them tens of thousands.",
    estimatedRetention: 79,
  },
  {
    id: "comparison_shock",
    formula:
      "[Group A] does [thing]. [Group B] does [opposite]. Guess which one [achieves better outcome].",
    style: "question",
    psychTrigger: "curiosity + confirmation bias challenge",
    niches: ["productivity", "finance", "health", "psychology"],
    tone: ["curiosity"],
    exampleHook:
      "Rich people buy assets. Poor people buy liabilities. Guess which one most financial advisors tell you to do.",
    estimatedRetention: 72,
  },
  {
    id: "you_already_know",
    formula:
      "You already know [uncomfortable truth]. You've just been too [fear/comfort] to act on it.",
    style: "controversial",
    psychTrigger: "self-confrontation + validation",
    niches: ["self-improvement", "mental health", "productivity"],
    tone: ["emotional", "dramatic"],
    exampleHook:
      "You already know your 9-to-5 isn't going to make you rich. You've just been too comfortable to do anything about it.",
    estimatedRetention: 75,
  },
  {
    id: "the_day_everything_changed",
    formula:
      "The day [major life event happened] was the day I learned [life-changing lesson].",
    style: "story",
    psychTrigger: "narrative hook + emotional anchoring",
    niches: ["self-improvement", "business", "relationships", "survival"],
    tone: ["emotional"],
    exampleHook:
      "The day my company fired me was the day I learned the only job security is building something of your own.",
    estimatedRetention: 73,
  },
  {
    id: "hidden_cost",
    formula:
      "Every [time unit] you [common habit], you're losing [quantified cost]. Most people never calculate this.",
    style: "statistic",
    psychTrigger: "loss aversion + precision shock",
    niches: ["finance", "health", "productivity", "business"],
    tone: ["dramatic", "curiosity"],
    exampleHook:
      "Every year you stay in a job you hate, you're losing roughly $200,000 in lifetime earnings. Most people never calculate this.",
    estimatedRetention: 80,
  },
  {
    id: "one_rule",
    formula:
      "I follow one rule that [impressive outcome]. It's [surprisingly simple/counterintuitive].",
    style: "controversial",
    psychTrigger: "simplicity appeal + curiosity",
    niches: ["productivity", "finance", "health", "business"],
    tone: ["curiosity", "dramatic"],
    exampleHook:
      "I follow one rule that has made me more productive than 99% of people. It goes against everything you've been taught.",
    estimatedRetention: 76,
  },
  {
    id: "warning_hook",
    formula: "WARNING: If you're [doing common thing], stop right now. Here's why.",
    style: "controversial",
    psychTrigger: "alarm + urgency + self-relevance",
    niches: ["health", "tech", "finance", "parenting"],
    tone: ["dramatic"],
    exampleHook:
      "WARNING: If you're using a debit card for everyday purchases, stop right now. Here's why.",
    estimatedRetention: 77,
  },
  {
    id: "secret_of_the_successful",
    formula:
      "The most successful [people in field] all share one [unexpected] habit. It's not what you think.",
    style: "question",
    psychTrigger: "aspirational modeling + curiosity",
    niches: ["business", "productivity", "finance", "sports"],
    tone: ["curiosity", "dramatic"],
    exampleHook:
      "The most successful founders all share one counterintuitive habit. It's not what you think.",
    estimatedRetention: 74,
  },
  {
    id: "breaking_point",
    formula:
      "There's a moment when [situation] stops being [perceived thing] and becomes [alarming thing]. You're probably there.",
    style: "visual",
    psychTrigger: "threshold anxiety + self-diagnosis",
    niches: ["health", "mental health", "relationships", "finance"],
    tone: ["emotional", "dramatic"],
    exampleHook:
      "There's a moment when stress stops being just stress and becomes something your body can't recover from. You're probably there.",
    estimatedRetention: 78,
  },
];
