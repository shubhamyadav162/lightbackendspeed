/**
 * LightSpeedPay - Structured Logging System
 * 
 * This module provides a structured logging system with different severity levels,
 * context enrichment, and production/development environment handling.
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Numeric values for log levels (used for filtering)
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4
};

// Environment-specific configurations
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MIN_LOG_LEVEL = IS_PRODUCTION ? LogLevel.INFO : LogLevel.DEBUG;

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  [key: string]: any;
}

/**
 * Base logger class that handles structured logging
 */
class Logger {
  private context: Record<string, any> = {};
  
  /**
   * Create a new logger instance
   * @param name Logger name/category
   */
  constructor(private name: string) {}
  
  /**
   * Set context data to be included with all log entries
   */
  setContext(context: Record<string, any>): this {
    this.context = { ...this.context, ...context };
    return this;
  }
  
  /**
   * Create a child logger with additional context
   */
  child(name: string, context: Record<string, any> = {}): Logger {
    const childLogger = new Logger(`${this.name}:${name}`);
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
  
  /**
   * Log a message at the specified level
   */
  log(level: LogLevel, message: string, context: Record<string, any> = {}): void {
    // Skip if below minimum log level
    if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[MIN_LOG_LEVEL]) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      logger: this.name
    };
    
    this.writeLog(entry);
  }
  
  /**
   * Write the log entry to the appropriate destination
   */
  private writeLog(entry: LogEntry): void {
    // In production, format as JSON for log aggregation systems
    if (IS_PRODUCTION) {
      console[entry.level === LogLevel.FATAL ? 'error' : entry.level](JSON.stringify(entry));
      
      // For error/fatal logs in production, also send to error monitoring service
      if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
        // Here you would integrate with your error reporting service (e.g., Sentry)
        // Example: errorReportingService.captureException(entry);
      }
    } else {
      // In development, format for readability
      const timestamp = entry.timestamp.split('T')[1].split('.')[0];
      const level = entry.level.toUpperCase().padEnd(5);
      const context = Object.keys(entry.context || {}).length 
        ? `\n${JSON.stringify(entry.context, null, 2)}` 
        : '';
      
      console[entry.level === LogLevel.FATAL ? 'error' : entry.level](
        `[${timestamp}] ${level} [${entry.logger}] ${entry.message}${context}`
      );
    }
    
    // For fatal errors, exit the process (in server environments)
    if (entry.level === LogLevel.FATAL && typeof window === 'undefined') {
      console.error('FATAL ERROR: Exiting process');
      process.exit(1);
    }
  }
  
  // Convenience methods for each log level
  debug(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  info(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  warn(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  error(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.ERROR, message, context);
  }
  
  fatal(message: string, context: Record<string, any> = {}): void {
    this.log(LogLevel.FATAL, message, context);
  }
  
  /**
   * Log API request information
   */
  logApiRequest(
    method: string, 
    url: string, 
    status?: number, 
    duration?: number, 
    error?: any
  ): void {
    const level = error ? LogLevel.ERROR : LogLevel.INFO;
    const message = error 
      ? `API ${method} ${url} failed (${status || 'unknown'})`
      : `API ${method} ${url} completed (${status})`;
    
    this.log(level, message, {
      method,
      url,
      status,
      duration,
      error: error ? {
        name: error.name,
        message: error.message,
        status: error.status,
        stack: IS_PRODUCTION ? undefined : error.stack
      } : undefined
    });
  }
  
  /**
   * Time execution of a function and log the result
   */
  async time<T>(
    name: string, 
    fn: () => Promise<T>, 
    level: LogLevel = LogLevel.DEBUG
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.log(level, `${name} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.log(LogLevel.ERROR, `${name} failed after ${duration.toFixed(2)}ms`, { error });
      throw error;
    }
  }
}

// Create root logger
export const logger = new Logger('lightspeedpay');

// Create loggers for specific modules
export const apiLogger = logger.child('api');
export const transactionLogger = logger.child('transaction');
export const gatewayLogger = logger.child('gateway');
export const webhookLogger = logger.child('webhook');
export const analyticsLogger = logger.child('analytics');

// Default export
export default logger; 