import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AccountRepository } from './repositories/account.repository';
import { RateRepository } from './repositories/rate.repository';
import { TransferRepository } from './repositories/transfer.repository';
import { AuditRepository } from './repositories/audit.repository';

@Global()
@Module({
  providers: [
    DatabaseService,
    AccountRepository,
    RateRepository,
    TransferRepository,
    AuditRepository,
  ],
  exports: [
    DatabaseService,
    AccountRepository,
    RateRepository,
    TransferRepository,
    AuditRepository,
  ],
})
export class DatabaseModule {}
