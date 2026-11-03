const LostFoundItem = require('../models/LostFoundItem');

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'from',
  'by', 'of', 'is', 'was', 'are', 'it', 'my', 'i', 'have', 'has', 'had', 'lost',
  'found', 'near', 'around', 'inside', 'some', 'any', 'color', 'brand'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function calculateJaccardSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection++;
    }
  }
  
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

function calculateLocationScore(locA, locB) {
  if (!locA || !locB) return 0;
  const tokensA = tokenize(locA);
  const tokensB = tokenize(locB);
  const similarity = calculateJaccardSimilarity(tokensA, tokensB);
  if (locA.toLowerCase().trim() === locB.toLowerCase().trim()) return 1.0;
  return similarity;
}

function calculateDateScore(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const d1 = new Date(dateA).getTime();
  const d2 = new Date(dateB).getTime();
  const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return 1.0;
  if (diffDays <= 3) return 0.8;
  if (diffDays <= 7) return 0.5;
  if (diffDays <= 14) return 0.25;
  return 0.05;
}

/**
 * Intelligent Lost-Item Matching
 * Compares target item against reciprocal items (Lost <-> Found)
 */
async function findPotentialMatches(itemId) {
  const targetItem = await LostFoundItem.findById(itemId).populate('reporter', 'name email');
  if (!targetItem) {
    throw new Error('Item not found');
  }

  // Reciprocal search: If Lost, match against Found; if Found, match against Lost
  const reciprocalType = targetItem.reportType === 'Lost' ? 'Found' : 'Lost';

  const candidates = await LostFoundItem.find({
    reportType: reciprocalType,
    status: { $in: ['Open', 'Claimed'] },
    _id: { $ne: targetItem._id },
  }).populate('reporter', 'name email department');

  const targetTokens = [
    ...tokenize(targetItem.title),
    ...tokenize(targetItem.description),
  ];

  const results = candidates.map((candidate) => {
    // 1. Category Score (Weight: 30%)
    const categoryScore = candidate.category === targetItem.category ? 1.0 : 0.0;

    // 2. Keyword/Description Similarity (Weight: 35%)
    const candidateTokens = [
      ...tokenize(candidate.title),
      ...tokenize(candidate.description),
    ];
    const textScore = calculateJaccardSimilarity(targetTokens, candidateTokens);

    // 3. Location Proximity (Weight: 20%)
    const locationScore = calculateLocationScore(targetItem.location, candidate.location);

    // 4. Date Proximity (Weight: 15%)
    const dateScore = calculateDateScore(targetItem.dateLostFound, candidate.dateLostFound);

    // Weighted Combined Score (0.0 to 1.0)
    const compositeScore =
      categoryScore * 0.3 +
      textScore * 0.35 +
      locationScore * 0.2 +
      dateScore * 0.15;

    const percentage = Math.round(compositeScore * 100);

    return {
      item: candidate,
      score: percentage,
      breakdown: {
        categoryMatch: Math.round(categoryScore * 100),
        textSimilarity: Math.round(textScore * 100),
        locationProximity: Math.round(locationScore * 100),
        dateProximity: Math.round(dateScore * 100),
      },
    };
  });

  // Filter to items with >= 20% score and sort descending
  return results
    .filter((r) => r.score >= 20)
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  findPotentialMatches,
  calculateJaccardSimilarity,
  calculateLocationScore,
  calculateDateScore,
};
