export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? JSON.stringify(meta) : '');
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? JSON.stringify(meta) : '');
  },
  error: (msg: string, meta?: any) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? meta : '');
  },
  debug: (msg: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? JSON.stringify(meta) : '');
    }
  },
};
