import { Injectable } from '@nestjs/common';
import { DatabaseService, RateRecord } from '../database.service';

@Injectable()
export class RateRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllActive(): Promise<RateRecord[]> {
    return this.db.getAllRates();
  }

  async findById(rateId: string): Promise<RateRecord | null> {
    return this.db.getRateById(rateId);
  }
}
