import { execSync } from 'child_process';

console.log('正在启动测试环境...');
try {
  // 使用 execSync 调用 npx tsx 执行 test.ts，设置 shell: true 避开 Powershell 等策略限制并保证命令可执行
  execSync('npx tsx scripts/test.ts', { stdio: 'inherit', shell: true });
} catch (err) {
  console.error('测试运行失败:', err.message);
  process.exit(1);
}
