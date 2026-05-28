import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDev
    ? { transport: { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } } }
    : { level: 'info' }
);

export default logger;
