/**
 * Generator: Thin assembly layer that takes transformer output
 * and applies final formatting / cleanup.
 *
 * Since the transformer directly emits JS strings, this layer is
 * intentionally minimal — it handles indentation normalization
 * and final cleanup only.
 */

/**
 * Post-process generated JS code for readability.
 */
export function formatGeneratedCode(code: string): string {
  let result = code;

  // Remove stray std:: prefixes that might have leaked through
  result = result.replace(/std::/g, '');

  // Remove stray reference operators in variable names
  result = result.replace(/\blet\s+&(\w+)/g, 'let $1');
  result = result.replace(/\bconst\s+&(\w+)/g, 'const $1');

  // Clean up empty call parens on property accesses that became .length
  // e.g., ".length()" → ".length"
  result = result.replace(/\.length\s*\(\s*\)/g, '.length');

  // Clean up .empty()() → duplicate parens from field_expression + call_expression
  result = result.replace(/\((\w+)\.length === 0\)\s*\(\s*\)/g, '($1.length === 0)');
  // Clean up .front()() → [0]()
  result = result.replace(/\[0\]\s*\(\s*\)/g, '[0]');
  // Clean up .back()()
  result = result.replace(/\[(\w+)\.length - 1\]\s*\(\s*\)/g, '[$1.length - 1]');
  // Clean .top()()
  result = result.replace(/\[(\w+)\.length - 1\]\s*\(\s*\)/g, '[$1.length - 1]');

  // Normalize multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim
  result = result.trim();

  return result;
}
