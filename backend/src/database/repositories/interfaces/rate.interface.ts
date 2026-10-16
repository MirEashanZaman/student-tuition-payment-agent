import { RateRecord } from '../../database.service';

export interface IRateReader {
  findAllActive(): Promise<RateRecord[]>;
  findById(rateId: string): Promise<RateRecord | null>;
}

export interface IRateWriter {
  updateRate(id: string, updates: Partial<RateRecord>): Promise<RateRecord>;
  deleteRate(id: string): Promise<boolean>;
}

export interface IRateRepository extends IRateReader, IRateWriter {}
