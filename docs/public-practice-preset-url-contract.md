# Public Practice Preset URL Contract

Public Practice Preset V1 is the small, public configuration boundary for practice routes. It may contain `version`, `facts`, `operations`, `mode`, `durationSeconds`, and `questionCount`; it never contains route identity, storage, generator, rendering, analytics, or SEO fields.

## V1 query vocabulary

The URL representation uses these parameters in canonical order:

1. `v` (required and exactly `1`)
2. `facts` (comma-separated integers)
3. `operations` (comma-separated `addition`, `subtraction`, `multiplication`, and/or `division`)
4. `mode` (`untimed` or `timed`)
5. `duration` (seconds)
6. `questions` (question count)

Only present fields are serialized; the codec never infers or omits route defaults. Lists use normalized schema order and serialize with literal commas and no spaces. For example:

```text
v=1&facts=6,7,8&mode=timed&duration=120&questions=20
```

Parsing is strict. Missing or unsupported versions, unknown parameters, duplicate keys, empty values, malformed integers or lists, duplicate list entries, and non-canonical whitespace fail the entire preset. Percent-encoded commas are accepted because `URLSearchParams` naturally decodes them to the same list separator. No field is partially applied or silently repaired.

The codec performs syntactic decoding first, then passes the structured candidate to `validatePublicPracticePreset`. That validator remains authoritative for V1 values, cross-field rules, normalization, and the supplied route capability. A future page integration must treat parse failure as no preset and retain safe route defaults.

## SEO and page identity

A query preset is configuration of an existing page, not a content page. Thus `/multiplication/facts/?v=1&facts=6,7,8` retains `/multiplication/facts/` as its canonical URL. Query variants are not generated as static routes, emitted in sitemaps, or given separate SEO identity. The base route remains indexable, and the codec itself creates no internal links.

Future incompatible formats must use a new explicit `v` value. V1 parsing will not infer a version or accept another version's fields.
