const recent: number[] = [];

export function recordRedirect(): boolean {
  const now = Date.now();
  while (recent.length && now - recent[0] > 2500) recent.shift();
  recent.push(now);
  return recent.length > 8;
}

export function resetRedirectLoop() {
  recent.length = 0;
}
