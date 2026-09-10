import { assert, test } from './harness';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import ScoreCard from '../src/components/ScoreCard';
import { DEFAULT_STATS } from '../src/engine/storage';

const result = { correct: 8, total: 10, durationSeconds: 30, score: 80, timestamp: 'test' };
const common = {
  result,
  stats: { ...DEFAULT_STATS, currentStreak: 4, longestStreak: 12, personalBestScore: 9 },
  preSessionScore: 70,
  preSessionPersonalBest: 7,
  isNewStreakRecord: true,
  onRestart() {},
  variant: 'prototype' as const,
};

export const tests = [
  test('shared results focus on attempted-answer score and omit streak, best, and progress UI', () => {
    const html = renderToStaticMarkup(createElement(ScoreCard, { ...common, isTimed: false, presentation: 'shared', questionCount: 20 }));
    for (const text of ['Practice Complete', '8 / 10', '80%', '10 / 20 answered', 'Play Again']) assert.ok(html.includes(text), text);
    for (const text of ['Current Streak', 'Longest Streak', 'New Streak Record', 'Personal Best', 'View progress']) assert.equal(html.includes(text), false, text);
  }),
  test('timed shared results calculate accuracy from answers attempted before timeout', () => {
    const html = renderToStaticMarkup(createElement(ScoreCard, { ...common, isTimed: true, presentation: 'shared', questionCount: 20 }));
    assert.ok(html.includes('8 / 10'));
    assert.ok(html.includes('80%'));
    assert.ok(html.includes('10 / 20 answered'));
    assert.equal(html.includes('8 / 20'), false);
    assert.equal(html.includes('Personal Best'), false);
  }),
  test('canonical results retain streak cards, record treatment, replay, and progress', () => {
    const html = renderToStaticMarkup(createElement(ScoreCard, { ...common, isTimed: false }));
    for (const text of ['New Streak Record!', 'Current Streak', 'Longest Streak', 'Play Again', 'View progress']) assert.ok(html.includes(text), text);
  }),
];
