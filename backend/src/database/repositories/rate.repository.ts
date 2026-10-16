import { Injectable } from '@nestjs/common';
import { DatabaseService, RateRecord } from '../database.service';
import { IRateRepository } from './interfaces/rate.interface';

@Injectable()
export class RateRepository implements IRateRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllActive(): Promise<RateRecord[]> {
    return this.db.getAllRates();
  }

  async findById(rateId: string): Promise<RateRecord | null> {
    return this.db.getRateById(rateId);
  }

  async updateRate(id: string, updates: Partial<RateRecord>): Promise<RateRecord> {
    return this.db.updateRate(id, updates);
  }

  async deleteRate(id: string): Promise<boolean> {
    return this.db.deleteRate(id);
  }
}
