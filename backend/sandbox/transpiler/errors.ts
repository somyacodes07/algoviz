/**
 * Error/warning reporting for the C++ → JS transpiler.
 *
 * Collects warnings for unsupported C++ constructs and can emit
 * them as JS comments in the generated output for debugging.
 */

export interface TranspilerWarning {
  line: number;
  column: number;
  message: string;
  nodeType: string;
}

export class WarningCollector {
  private warnings: TranspilerWarning[] = [];

  /** Record a warning about an unsupported or partially-supported construct */
  warn(line: number, column: number, nodeType: string, message: string): void {
    this.warnings.push({ line, column, nodeType, message });
  }

  /** Get all collected warnings */
  getWarnings(): TranspilerWarning[] {
    return [...this.warnings];
  }

  /** Get warnings as human-readable strings */
  getWarningStrings(): string[] {
    return this.warnings.map((w) => `Line ${w.line}: [${w.nodeType}] ${w.message}`);
  }

  /** Emit all warnings as JS comments, suitable for prepending to output */
  toJsComments(): string {
    if (this.warnings.length === 0) return '';
    const lines = this.warnings.map((w) => `// ⚠️ Line ${w.line}: ${w.message}`);
    return lines.join('\n') + '\n';
  }

  /** Reset all warnings */
  clear(): void {
    this.warnings = [];
  }
}
