import fs from 'node:fs';

const path = 'vite.config.ts';
if (!fs.existsSync(path)) {
  console.error('❌ vite.config.ts not found');
  process.exit(1);
}
const txt = fs.readFileSync(path, 'utf8');

// very lightweight checks (regex-based to avoid AST complexity in CI)
const checks = [
  { re: /server:\s*{[^}]*host:\s*['"]127\.0\.0\.1['"]/s, msg: 'host must be 127.0.0.1' },
  { re: /server:\s*{[^}]*port:\s*3000\b/s,           msg: 'port must be 3000' },
  { re: /server:\s*{[^}]*strictPort:\s*true\b/s,     msg: 'strictPort must be true' },
  { re: /proxy:\s*{[^}]*['"]\/api['"]\s*:\s*{[^}]*target:\s*['"]http:\/\/127\.0\.0\.1:5000['"]/s,
    msg: 'proxy /api target must be http://127.0.0.1:5000' },
];

const failures = checks.filter(c => !c.re.test(txt));
if (failures.length) {
  failures.forEach(f => console.error('❌', f.msg));
  process.exit(1);
}
console.log('✅ Vite proxy config OK');

