import { readFileSync, existsSync } from 'node:fs';
import { assert, test } from './harness';
import { getProduct, moveSelection, CHART_MIN, CHART_MAX } from '../src/engine/multiplicationChart';

const source = (p: string) => readFileSync(p, 'utf8');

const LINKING_PAGES = [
  'src/pages/multiplication/index.astro',
  'src/pages/multiplication/facts.astro',
  'src/pages/multiplication/times-tables/index.astro',
  'src/pages/multiplication/times-tables/[table].astro',
  'src/pages/division/divide-by/index.astro',
];

export const tests = [
  test('getProduct is correct for every 1–12 combination', () => {
    for (let row = CHART_MIN; row <= CHART_MAX; row++) {
      for (let col = CHART_MIN; col <= CHART_MAX; col++) {
        assert.equal(getProduct(row, col), row * col, `${row}×${col}`);
      }
    }
  }),
  test('moveSelection moves one step per arrow key', () => {
    assert.deepEqual(moveSelection({ row: 5, col: 5 }, 'ArrowUp'), { row: 4, col: 5 });
    assert.deepEqual(moveSelection({ row: 5, col: 5 }, 'ArrowDown'), { row: 6, col: 5 });
    assert.deepEqual(moveSelection({ row: 5, col: 5 }, 'ArrowLeft'), { row: 5, col: 4 });
    assert.deepEqual(moveSelection({ row: 5, col: 5 }, 'ArrowRight'), { row: 5, col: 6 });
  }),
  test('moveSelection clamps at every edge and corner without wrapping', () => {
    assert.deepEqual(moveSelection({ row: CHART_MIN, col: 5 }, 'ArrowUp'), { row: CHART_MIN, col: 5 });
    assert.deepEqual(moveSelection({ row: CHART_MAX, col: 5 }, 'ArrowDown'), { row: CHART_MAX, col: 5 });
    assert.deepEqual(moveSelection({ row: 5, col: CHART_MIN }, 'ArrowLeft'), { row: 5, col: CHART_MIN });
    assert.deepEqual(moveSelection({ row: 5, col: CHART_MAX }, 'ArrowRight'), { row: 5, col: CHART_MAX });
    assert.deepEqual(moveSelection({ row: CHART_MIN, col: CHART_MIN }, 'ArrowUp'), { row: CHART_MIN, col: CHART_MIN });
    assert.deepEqual(moveSelection({ row: CHART_MIN, col: CHART_MIN }, 'ArrowLeft'), { row: CHART_MIN, col: CHART_MIN });
    assert.deepEqual(moveSelection({ row: CHART_MAX, col: CHART_MAX }, 'ArrowDown'), { row: CHART_MAX, col: CHART_MAX });
    assert.deepEqual(moveSelection({ row: CHART_MAX, col: CHART_MAX }, 'ArrowRight'), { row: CHART_MAX, col: CHART_MAX });
  }),
  test('multiplication chart route and component exist', () => {
    assert.ok(existsSync('src/pages/multiplication-chart/index.astro'));
    assert.ok(existsSync('src/components/MultiplicationChart.tsx'));
    assert.ok(existsSync('src/engine/multiplicationChart.ts'));
  }),
  test('no alternate blank-chart route was created', () => {
    assert.equal(existsSync('src/pages/multiplication-chart/blank.astro'), false);
    assert.equal(existsSync('src/pages/multiplication-chart-blank'), false);
    assert.equal(existsSync('src/pages/multiplication-chart/blank'), false);
  }),
  test('every intended page links to the multiplication chart with a canonical trailing-slash href', () => {
    for (const page of LINKING_PAGES) {
      const s = source(page);
      assert.ok(
        s.includes("'/multiplication-chart/'") || s.includes('"/multiplication-chart/"'),
        `${page} should link to /multiplication-chart/`
      );
    }
  }),
  test('the multiplication hub promotes the chart with a featured callout, not just a Related Practice card', () => {
    const s = source('src/pages/multiplication/index.astro');
    assert.ok(s.includes('id="chart-callout-heading"'), 'expected a dedicated chart callout section');
    assert.ok(s.includes('Multiplication Chart 1–12'), 'expected the callout label');
    assert.ok(s.includes('href="/multiplication-chart/"'), 'callout must link to the canonical chart URL');
  }),
  test('the times tables hub has a prominent chart callout below the table grid, ahead of Recommended Learning Order', () => {
    const s = source('src/pages/multiplication/times-tables/index.astro');
    assert.ok(s.includes('id="chart-callout-heading"'), 'expected a dedicated chart callout section');
    assert.ok(s.includes('Need the full picture? Open the Multiplication Chart'), 'expected the callout label');
    assert.ok(s.includes('href="/multiplication-chart/"'), 'callout must link to the canonical chart URL');
    assert.ok(
      s.indexOf('id="tables-grid-heading"') < s.indexOf('id="chart-callout-heading"'),
      'the chart callout should appear after the 1–12 table grid, so the primary table selector stays first'
    );
    assert.ok(
      s.indexOf('id="chart-callout-heading"') < s.indexOf('id="order-heading"'),
      'the chart callout should appear before Recommended Learning Order'
    );
  }),
  test('the multiplication facts page has a light contextual chart callout distinct from its Related Practice list', () => {
    const s = source('src/pages/multiplication/facts.astro');
    assert.ok(s.includes('View the Multiplication Chart'), 'expected the lighter contextual callout copy');
    assert.ok(s.includes("href=\"/multiplication-chart/\""), 'callout must link to the canonical chart URL');
  }),
  test('the chart page links out to Times Tables, Facts, Create Practice, and Divide By', () => {
    const s = source('src/pages/multiplication-chart/index.astro');
    for (const href of ['/multiplication/times-tables/', '/multiplication/facts/', '/create/', '/division/divide-by/']) {
      assert.ok(s.includes(`'${href}'`), href);
    }
  }),
  test('the chart page has canonical, breadcrumb, and LearningResource/FAQPage schema', () => {
    const s = source('src/pages/multiplication-chart/index.astro');
    assert.ok(s.includes("canonical={`${SITE}/multiplication-chart`}"));
    assert.ok(s.includes("{ label: 'Multiplication Chart' }"));
    assert.ok(s.includes('"@type": "LearningResource"'));
    assert.ok(s.includes('"@type": "FAQPage"'));
  }),
  test('normal webpage chrome (H1, intro, how-it-works) is marked print-hidden so only the chart prints', () => {
    const s = source('src/pages/multiplication-chart/index.astro');
    assert.ok(s.includes('<div slot="h1" class="no-print">'), 'H1 wrapper must carry no-print');
    assert.ok(s.includes('<div slot="intro" class="no-print">'), 'intro wrapper must carry no-print');
    assert.ok(s.includes('<div slot="how-it-works" class="no-print">'), 'how-it-works wrapper must carry no-print');
  }),
  test('the print-only chart title lives once in the component (reacting to blank state), not duplicated in the page', () => {
    const page = source('src/pages/multiplication-chart/index.astro');
    const component = source('src/components/MultiplicationChart.tsx');
    assert.equal(page.includes('hidden print:block'), false, 'the page must not hard-code its own print-only header block alongside the component’s');
    assert.ok(component.includes("'Blank Multiplication Chart 1–12'"));
    assert.ok(component.includes("'Multiplication Chart 1–12'"));
    assert.equal((component.match(/hidden print:block/g) || []).length, 1, 'exactly one print-only header block should exist');
  }),
  test('the chart container avoids breaking across a printed page', () => {
    const s = source('src/pages/multiplication-chart/index.astro');
    assert.ok(s.includes('page-break-inside: avoid'));
    assert.ok(s.includes('break-inside: avoid'));
  }),
  test('Blank Chart copy clarifies it is for on-screen quizzing or printing, not typing into cells', () => {
    const s = source('src/pages/multiplication-chart/index.astro');
    assert.ok(s.includes('quiz yourself on screen'), 'intro/how-to-use/FAQ copy should clarify Blank Chart is not an editable field');
    assert.ok(s.includes('no typing boxes'), 'FAQ should explicitly rule out editable input fields in the chart');
  }),
];
