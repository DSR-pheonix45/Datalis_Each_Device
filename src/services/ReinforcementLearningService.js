
// Simple RL implementation using Epsilon-Greedy strategy for "Monte Carlo" sampling of strategies
// "Episode" = One Chat Session
// "Action" = Choosing a System Prompt Strategy
// "Reward" = User Sentiment / Engagement (Simplified)

const STRATEGIES = [
  {
    id: 'concise_direct',
    name: 'Concise & Direct',
    prompt: "Be extremely concise. Direct answers only. No fluff. Bullet points where possible.",
    weight: 1.0, // Initial weight
    wins: 0,
    selections: 0
  },
  {
    id: 'detailed_analytical',
    name: 'Detailed & Analytical',
    prompt: "Provide deep, step-by-step analysis. Explore edge cases. Be thorough and comprehensive.",
    weight: 1.0,
    wins: 0,
    selections: 0
  },
  {
    id: 'educational_consultative',
    name: 'Educational & Consultative',
    prompt: "Act as a teacher/consultant. Explain 'why' behind the numbers. Define terms. Guide the user.",
    weight: 1.0,
    wins: 0,
    selections: 0
  },
  {
    id: 'visual_structured',
    name: 'Visual & Structured',
    prompt: "Use heavy formatting. Tables, bolding, headers. Structure data for visual scanning.",
    weight: 1.0,
    wins: 0,
    selections: 0
  }
];

class ReinforcementLearningService {
  constructor() {
    this.currentStrategies = {}; // Map userId -> strategy
    this.epsilon = 0.2; // 20% exploration
    // Cache for loaded strategies and learnings to avoid reading localStorage on every call
    this.strategiesCache = {};
    this.learningsCache = {};
  }

  _getStorageKey(userId, keyType) {
    if (!userId) return `datalis_${keyType}_default`;
    return `datalis_${keyType}_${userId}`;
  }

  loadPolicy(userId) {
    const key = this._getStorageKey(userId, 'rl_policy');
    if (this.strategiesCache[key]) return this.strategiesCache[key];

    const stored = localStorage.getItem(key);
    const strategies = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(STRATEGIES)); // Deep copy defaults
    this.strategiesCache[key] = strategies;
    return strategies;
  }

  savePolicy(userId, strategies) {
    const key = this._getStorageKey(userId, 'rl_policy');
    this.strategiesCache[key] = strategies;
    localStorage.setItem(key, JSON.stringify(strategies));
  }

  loadLearnings(userId) {
    const key = this._getStorageKey(userId, 'user_learnings');
    if (this.learningsCache[key]) return this.learningsCache[key];

    const stored = localStorage.getItem(key);
    const learnings = stored ? JSON.parse(stored) : [];
    this.learningsCache[key] = learnings;
    return learnings;
  }

  saveLearnings(userId, learnings) {
    const key = this._getStorageKey(userId, 'user_learnings');
    this.learningsCache[key] = learnings;
    localStorage.setItem(key, JSON.stringify(learnings));
  }

  // "Monte Carlo" Selection: Sample a strategy based on weights (or explore)
  selectStrategy(userId) {
    const strategies = this.loadPolicy(userId);
    let selectedStrategy;

    // Epsilon-greedy
    if (Math.random() < this.epsilon) {
      // Explore: Random choice
      const randomIndex = Math.floor(Math.random() * strategies.length);
      selectedStrategy = strategies[randomIndex];
      console.log(`[RL] Exploring strategy for user ${userId}: ${selectedStrategy.name}`);
    } else {
      // Exploit: Choose highest weight
      selectedStrategy = strategies.reduce((prev, current) => 
        (prev.weight > current.weight) ? prev : current
      );
      console.log(`[RL] Exploiting strategy for user ${userId}: ${selectedStrategy.name} (Weight: ${selectedStrategy.weight})`);
    }
    
    // Increment selection count
    selectedStrategy.selections++;
    this.savePolicy(userId, strategies);
    
    // Store strategy for this specific user
    const key = userId || 'default';
    this.currentStrategies[key] = selectedStrategy; 
    
    return selectedStrategy;
  }

  // Calculate Reward based on session metrics (simplified)
  async evaluateSession(userId, messages) {
    const key = userId || 'default';
    const currentStrategy = this.currentStrategies[key];
    
    if (!currentStrategy) return;

    const strategies = this.loadPolicy(userId);
    // Find the strategy object in the current user's policy that matches the one used
    const strategyToUpdate = strategies.find(s => s.id === currentStrategy.id);
    if (!strategyToUpdate) return;

    // specific logic to calculate reward
    // 1. Positive keywords in user messages
    // 2. Number of user turns (engagement)
    // 3. Negative keywords (correction)
    
    let reward = 0;
    const userMessages = messages.filter(m => m.role === 'user');
    
    // Simple heuristic
    userMessages.forEach(msg => {
      const text = msg.content.toLowerCase();
      if (text.includes('great') || text.includes('thanks') || text.includes('good') || text.includes('helpful')) reward += 1;
      if (text.includes('wrong') || text.includes('bad') || text.includes('stop') || text.includes('incorrect')) reward -= 1;
    });

    // Length bonus (engagement) - capped
    reward += Math.min(userMessages.length * 0.1, 1.0);

    console.log(`[RL] Session Reward for user ${userId}: ${reward}`);

    // Update Policy (Monte Carlo update - average return)
    // New Weight = Old Weight + Alpha * (Reward - Old Weight)
    const alpha = 0.1; // Learning rate
    strategyToUpdate.weight = strategyToUpdate.weight + alpha * (reward - strategyToUpdate.weight);
    
    if (reward > 0.5) strategyToUpdate.wins++;
    
    this.savePolicy(userId, strategies);
    
    // Also extract specific learnings from this session
    await this.extractLearnings(userId, messages);
  }

  async extractLearnings(userId, messages) {
    // Use LLM to summarize what we learned about the user
    // This is the "User Model" update
    if (messages.length < 2) return;

    // Mock extraction:
    const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content).join(" ");
    if (userMsgs.includes("budget")) this.addLearning(userId, "Interested in budgeting");
    if (userMsgs.includes("forecast")) this.addLearning(userId, "Focuses on forecasting");
    if (userMsgs.includes("detail")) this.addLearning(userId, "Prefers detailed breakdowns");
    if (userMsgs.includes("summary")) this.addLearning(userId, "Prefers high-level summaries");
  }

  addLearning(userId, text) {
    const learnings = this.loadLearnings(userId);
    if (!learnings.includes(text)) {
      learnings.push(text);
      // Keep only last 10 learnings
      if (learnings.length > 10) learnings.shift();
      this.saveLearnings(userId, learnings);
    }
  }

  getLearningsContext(userId) {
    const learnings = this.loadLearnings(userId);
    if (learnings.length === 0) return "";
    return `\nUser Preferences (Learned from past episodes):\n- ${learnings.join("\n- ")}\n`;
  }
}

export const rlService = new ReinforcementLearningService();
