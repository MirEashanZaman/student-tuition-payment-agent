import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AccountRepository } from './repositories/account.repository';
import { RateRepository } from './repositories/rate.repository';
import { TransferRepository } from './repositories/transfer.repository';
import { AuditRepository } from './repositories/audit.repository';
import {
  ACCOUNT_REPOSITORY_TOKEN,
  RATE_REPOSITORY_TOKEN,
  TRANSFER_REPOSITORY_TOKEN,
  AUDIT_REPOSITORY_TOKEN,
} from './repositories/interfaces/repository.tokens';

@Global()
@Module({
  providers: [
    DatabaseService,
    AccountRepository,
    RateRepository,
    TransferRepository,
    AuditRepository,
    { provide: ACCOUNT_REPOSITORY_TOKEN, useClass: AccountRepository },
    { provide: RATE_REPOSITORY_TOKEN, useClass: RateRepository },
    { provide: TRANSFER_REPOSITORY_TOKEN, useClass: TransferRepository },
    { provide: AUDIT_REPOSITORY_TOKEN, useClass: AuditRepository },
  ],
  exports: [
    DatabaseService,
    AccountRepository,
    RateRepository,
    TransferRepository,
    AuditRepository,
    ACCOUNT_REPOSITORY_TOKEN,
    RATE_REPOSITORY_TOKEN,
    TRANSFER_REPOSITORY_TOKEN,
    AUDIT_REPOSITORY_TOKEN,
  ],
})
export class DatabaseModule {}
