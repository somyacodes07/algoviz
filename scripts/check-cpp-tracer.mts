// Instruments every C++ template with the tracer and checks the result still compiles.
// Run from the repository root:  npx tsx scripts/check-cpp-tracer.mts
// Uses $CXX (default clang++). Exits non-zero if any template fails.
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { CppInstrumenter } from '../backend/sandbox/transpiler/cppInstrumenter';
import { CPP_TEMPLATES } from '../frontend/templates/cppTemplates';

const cxx = process.env.CXX || 'clang++';
const dir = mkdtempSync(join(tmpdir(), 'algoviz-tracer-'));
const failures: string[] = [];

for (const template of CPP_TEMPLATES) {
  const file = join(dir, 'traced.cpp');
  writeFileSync(file, await new CppInstrumenter().instrument(template.code));
  try {
    execFileSync(cxx, ['-std=c++17', '-fsyntax-only', file], { stdio: 'pipe' });
  } catch (error: any) {
    const first = String(error.stderr).split('\n').find((line) => line.includes('error')) || 'unknown error';
    failures.push(`${template.name}: ${first}`);
  }
}

console.log(`${CPP_TEMPLATES.length - failures.length}/${CPP_TEMPLATES.length} traced templates compile with ${cxx}`);
failures.forEach((f) => console.log(`  ✗ ${f}`));
process.exit(failures.length ? 1 : 0);
