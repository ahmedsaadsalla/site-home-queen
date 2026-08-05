/** Amostragem de CPU do processo (entre chamadas) */
let lastCpu = process.cpuUsage();
let lastCpuAt = Date.now();

export function sampleCpuPercent(): number | null {
  const now = Date.now();
  const usage = process.cpuUsage(lastCpu);
  const elapsedUs = (now - lastCpuAt) * 1000;
  lastCpu = process.cpuUsage();
  lastCpuAt = now;
  if (elapsedUs <= 0) return null;
  const percent = ((usage.user + usage.system) / elapsedUs) * 100;
  return Math.min(100, Math.max(0, Number(percent.toFixed(1))));
}
