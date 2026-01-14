let app: any;

try {
  const mod: any = await import('../server/dist/index.js');
  app = mod?.default?.default ?? mod?.default ?? mod;
} catch {
  const mod: any = await import('../server/src/index');
  app = mod?.default?.default ?? mod?.default ?? mod;
}

export default app;
