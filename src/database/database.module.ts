import { Module, Global } from '@nestjs/common';
import { DatabaseInitService } from './database-init.service';

/**
 * Database Module
 * 
 * Global module that handles database initialization
 * and provides shared database utilities.
 */
@Global()
@Module({
  providers: [DatabaseInitService],
  exports: [DatabaseInitService],
})
export class DatabaseModule {}
