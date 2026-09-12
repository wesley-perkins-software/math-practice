import { assert, test } from './harness';
import { readFileSync, existsSync } from 'node:fs';
const source = (p: string) => readFileSync(p, 'utf8');

export const tests = [
  test('PracticeWidget gains exactly three additive, default-preserving seams for the Test feature', () => {
    const widget = source('src/components/PracticeWidget.tsx');
    assert.ok(widget.includes("feedbackVisibility?: 'shown' | 'hidden'"), 'feedbackVisibility prop must exist');
    assert.ok(widget.includes("feedbackVisibility = 'shown'"), 'feedbackVisibility must default to shown, preserving existing behavior');
    assert.ok(widget.includes('onAnswerSubmit?: (problem: Problem, isCorrect: boolean) => void'), 'onAnswerSubmit must expose correctness only, never the submitted value');
    assert.ok(widget.includes('writesProgress?: boolean'), 'writesProgress prop must exist');
    assert.ok(widget.includes('writesProgress = true'), 'writesProgress must default to true, preserving existing behavior for every current caller');
  }),
  test('onAnswerSubmit fires from the same accepted-submission guard as onFirstAcceptedAnswer, with correctness only', () => {
    const widget = source('src/components/PracticeWidget.tsx');
    assert.ok(widget.includes('if (!submission.accepted) return;'), 'the existing accept guard must still gate every side effect, including the new callback');
    const afterGuard = widget.slice(widget.indexOf('if (!submission.accepted) return;'));
    assert.ok(afterGuard.includes('lifecycleRef.current.onAnswerSubmit?.(problem, isCorrect);'), 'onAnswerSubmit must fire after the accept guard, not before it');
    assert.equal(afterGuard.indexOf('lifecycleRef.current.onAnswerSubmit?.(problem, isCorrect);') < afterGuard.indexOf('trackEvent(\'answer_submit\''), true);
  }),
  test('feedback visibility gates only what is revealed, never the accept/advance timing in session.ts', () => {
    const widget = source('src/components/PracticeWidget.tsx');
    assert.ok(widget.includes('const revealCorrectness = feedbackVisibility !== \'hidden\';'));
    assert.ok(widget.includes('state={revealCorrectness ? feedbackState : \'hidden\'}'), 'the banner must be forced to hidden, not the underlying feedbackState driving disabled/clear timing');
    assert.ok(widget.includes('revealCorrectness={revealCorrectness}'), 'WrittenProblemInput must receive the reveal flag separately from feedbackState');
    // The underlying state machine (session.ts) must be untouched by this feature.
    assert.equal(source('src/engine/session.ts').includes('feedbackVisibility'), false, 'the assessment/practice boundary must live in PracticeWidget only, not in the shared session state machine');
  }),
  test('WrittenProblemInput colors the typed answer from a gated colorState, not the raw feedbackState, while clear/refocus timing stays driven by the real feedbackState prop', () => {
    const written = source('src/components/WrittenProblemInput.tsx');
    assert.ok(written.includes('revealCorrectness?: boolean'));
    assert.ok(written.includes('revealCorrectness = true'));
    assert.ok(written.includes("const colorState = revealCorrectness ? feedbackState : 'idle';"));
    assert.ok(written.includes('colorState === \'correct\''), 'color must read the gated colorState');
    assert.equal(written.includes('feedbackState === \'correct\'\n      ? \'text-[#059669]\''), false, 'color must no longer read the raw feedbackState directly');
    // The clear/refocus effect must still depend on the real feedbackState so a hidden-feedback session still clears between problems.
    assert.ok(written.includes("if (feedbackState === 'idle') {\n      setValue('');"));
  }),
  test('writesProgress=false skips saveStats/appendSessionLog on both the per-answer and on-complete paths', () => {
    const widget = source('src/components/PracticeWidget.tsx');
    assert.ok(widget.includes('if (!isTimed && writesProgress) {'), 'the untimed per-answer stats block must be gated');
    assert.ok(widget.includes('if (writesProgress) {\n        const current = loadStats(config.storageKey);'), 'the on-complete stats/session-log block must be gated');
    assert.ok(widget.includes('|| !writesProgress) return;'), 'the tab-hidden partial-save path must also be gated');
  }),
  test('every current PracticeWidget caller omits the three new props (zero behavior change)', () => {
    for (const caller of ['src/components/SharedPracticeRunner.tsx', 'src/components/SpeedDrillSetup.tsx', 'src/components/DailyReviewWidget.tsx']) {
      if (!existsSync(caller)) continue;
      const contents = source(caller);
      assert.equal(contents.includes('feedbackVisibility='), false, `${caller} must not opt into hidden feedback`);
      assert.equal(contents.includes('writesProgress='), false, `${caller} must not opt out of progress writes`);
    }
  }),
  test('the Multiplication Test wires all three seams: hidden feedback, no progress writes, and missed-fact capture', () => {
    const runner = source('src/components/MultiplicationTestRunner.tsx');
    assert.ok(runner.includes('feedbackVisibility="hidden"'));
    assert.ok(runner.includes('writesProgress={false}'));
    assert.ok(runner.includes('onAnswerSubmit={(problem, isCorrect) => {'));
    assert.ok(runner.includes('sessionPresentation="shared"'), 'the active test session must not track streak/PB');
  }),
  test('feedbackVisibility also gates the timed+prototype live "Correct" counter (a second correctness-reveal path found only by rendering the page, not by reading FeedbackBanner alone)', () => {
    const widget = source('src/components/PracticeWidget.tsx');
    assert.ok(widget.includes('{isPrototype && revealCorrectness ? (\n                  // Correct: live count'), 'the Speed-Drill-only live Correct counter must not render during a hidden-feedback session');
  }),
  test('missed-fact practice restores normal PracticeWidget defaults (feedback shown, progress written)', () => {
    const runner = source('src/components/MultiplicationTestRunner.tsx');
    const missedSection = runner.slice(runner.indexOf("phase === 'missed-practice'"));
    assert.equal(missedSection.includes('feedbackVisibility='), false, 'missed-fact practice must use the default (shown) feedback');
    assert.equal(missedSection.includes('writesProgress='), false, 'missed-fact practice must use the default (true) progress writes — it is genuine practice');
    assert.ok(missedSection.includes('sessionPresentation="shared"'));
  }),
];
