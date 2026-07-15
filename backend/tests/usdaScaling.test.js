/**
 * Tests for USDA nutrient-per-100g → per-serving scaling.
 * Run with: node backend/tests/usdaScaling.test.js
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// ── Shared scaling helpers (mirrors the production code) ──────────────────────

function scaleBarcode(rawPer100g, servingSize) {
  const f = (servingSize || 100) / 100;
  return {
    calories: Math.round((rawPer100g.calories || 0) * f),
    protein:  parseFloat(((rawPer100g.protein  || 0) * f).toFixed(1)),
    fats:     parseFloat(((rawPer100g.fats     || 0) * f).toFixed(1)),
    carbs:    parseFloat(((rawPer100g.carbs    || 0) * f).toFixed(1)),
  };
}

function normaliseSearch(food, rawPer100g) {
  const isBranded   = food.dataType === "Branded";
  const servingSize = food.servingSize || (isBranded ? null : 100);

  if (isBranded && servingSize) {
    const f = servingSize / 100;
    return {
      calories:    Math.round((rawPer100g.calories || 0) * f),
      protein:     parseFloat(((rawPer100g.protein  || 0) * f).toFixed(1)),
      fats:        parseFloat(((rawPer100g.fats     || 0) * f).toFixed(1)),
      carbs:       parseFloat(((rawPer100g.carbs    || 0) * f).toFixed(1)),
      servingSize,
    };
  }
  return { ...rawPer100g, servingSize: 100 };
}

// ── Test 1: Barcode — chips (Doritos-style) ────────────────────────────────────
console.log("\nTest 1: Barcode scaling — branded chips");
{
  // USDA returns per-100g: 500 cal, 7g protein, 25g fat, 64g carbs
  // Serving size on label: 28g → label shows 140 cal, 2g protein, 7g fat, 18g carbs
  const raw = { calories: 500, protein: 7, fats: 25, carbs: 64 };
  const result = scaleBarcode(raw, 28);
  assert(result.calories === 140,  `calories 140 (got ${result.calories})`);
  assert(result.protein  === 2.0,  `protein 2.0g (got ${result.protein})`);
  assert(result.fats     === 7.0,  `fat 7.0g (got ${result.fats})`);
  assert(result.carbs    === 17.9, `carbs 17.9g (got ${result.carbs})`);
}

// ── Test 2: Barcode — missing servingSize falls back to 100g ─────────────────
console.log("\nTest 2: Barcode — no servingSize defaults to 100g (no scaling)");
{
  const raw = { calories: 200, protein: 10, fats: 8, carbs: 20 };
  const result = scaleBarcode(raw, null);
  assert(result.calories === 200, `calories unchanged at 200 (got ${result.calories})`);
  assert(result.protein  === 10,  `protein unchanged at 10g (got ${result.protein})`);
}

// ── Test 3: Barcode — 0-value nutrient (the || vs ?? bug) ────────────────────
console.log("\nTest 3: Barcode — zero-fat food stays 0 (not overridden)");
{
  const raw = { calories: 90, protein: 20, fats: 0, carbs: 3 };
  const result = scaleBarcode(raw, 100);
  assert(result.fats === 0, `fat is 0 (not overridden) (got ${result.fats})`);
}

// ── Test 4: Search — branded food scales to per-serving ──────────────────────
console.log("\nTest 4: Search — branded food scaled to per-serving");
{
  const food = { dataType: "Branded", servingSize: 45, servingSizeUnit: "g" };
  const raw  = { calories: 400, protein: 8, fats: 16, carbs: 56 };
  const result = normaliseSearch(food, raw);
  assert(result.calories    === 180,  `calories 180 (got ${result.calories})`);
  assert(result.protein     === 3.6,  `protein 3.6g (got ${result.protein})`);
  assert(result.servingSize === 45,   `servingSize 45 (got ${result.servingSize})`);
}

// ── Test 5: Search — Foundation food stays at 100g base ──────────────────────
console.log("\nTest 5: Search — Foundation food keeps 100g base (no scaling)");
{
  const food = { dataType: "Foundation", servingSize: null };
  const raw  = { calories: 165, protein: 31, fats: 3.6, carbs: 0 };
  const result = normaliseSearch(food, raw);
  assert(result.calories    === 165,  `calories 165 (got ${result.calories})`);
  assert(result.servingSize === 100,  `servingSize 100 (got ${result.servingSize})`);
}

// ── Test 6: Search — branded food with no servingSize stays per-100g ─────────
console.log("\nTest 6: Search — branded food with no servingSize stays per-100g");
{
  const food = { dataType: "Branded", servingSize: null };
  const raw  = { calories: 300, protein: 5, fats: 12, carbs: 40 };
  const result = normaliseSearch(food, raw);
  assert(result.calories    === 300,  `calories 300 (got ${result.calories})`);
  assert(result.servingSize === 100,  `servingSize 100 (got ${result.servingSize})`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("SOME TESTS FAILED");
  process.exit(1);
} else {
  console.log("All tests passed ✓");
}
