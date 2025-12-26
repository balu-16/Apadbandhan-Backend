import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

/**
 * Database Initialization Service
 * 
 * Creates all required collections on first run of the application.
 * This ensures the database structure is properly set up before use.
 */
@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectConnection() private connection: Connection,
  ) { }

  async onModuleInit() {
    this.logger.log('🗄️  Initializing database collections...');
    await this.initializeCollections();
    this.logger.log('✅ Database initialization complete!');
  }

  private async initializeCollections() {
    const db = this.connection.db;

    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);

    // Define all required collections with their options
    const requiredCollections = [
      {
        name: 'users',
        description: 'User accounts and profiles',
      },
      {
        name: 'devices',
        description: 'User registered devices with emergency contacts',
      },
      {
        name: 'device_locations',
        description: 'Device location history with coordinates',
      },
      {
        name: 'mqtt_events',
        description: 'MQTT events from IoT devices (accidents, telemetry)',
      },
      {
        name: 'qrcodes',
        description: 'Pre-generated QR codes for device registration',
      },
      {
        name: 'alerts',
        description: 'Emergency alerts triggered by devices',
      },
      {
        name: 'otps',
        description: 'One-time passwords for authentication',
      },
    ];

    // Create missing collections
    for (const collection of requiredCollections) {
      if (!existingNames.includes(collection.name)) {
        try {
          await db.createCollection(collection.name);
          this.logger.log(`  ✓ Created collection: ${collection.name} (${collection.description})`);
        } catch (error) {
          this.logger.warn(`  ⚠ Collection ${collection.name} may already exist: ${error.message}`);
        }
      } else {
        this.logger.log(`  ✓ Collection exists: ${collection.name}`);
      }
    }

    // Log database info
    const stats = await db.stats();
    this.logger.log(`📊 Database: ${db.databaseName}`);
    this.logger.log(`   Collections: ${stats.collections}`);
    this.logger.log(`   Documents: ${stats.objects}`);
  }
}
