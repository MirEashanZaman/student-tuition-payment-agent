export class TransferDraftedEvent {
  constructor(
    public readonly transferId: string,
    public readonly studentId: string,
    public readonly targetAmountUsd: number,
    public readonly sourceAmountBdt: number,
    public readonly providerName: string,
  ) {}
}

export class TransferConfirmedEvent {
  constructor(
    public readonly transferId: string,
    public readonly studentId: string,
    public readonly sourceAmountBdt: number,
    public readonly targetAmountUsd: number,
    public readonly providerName: string,
  ) {}
}

export class TransferExecutedEvent {
  constructor(
    public readonly transferId: string,
    public readonly studentId: string,
    public readonly sourceAmountBdt: number,
    public readonly providerName: string,
  ) {}
}

export class TransferCompensatedEvent {
  constructor(
    public readonly transferId: string,
    public readonly studentId: string,
    public readonly amountReleasedBdt: number,
    public readonly reason: string,
  ) {}
}

export class SecurityCheckFailedEvent {
  constructor(
    public readonly eventType: string,
    public readonly studentId: string,
    public readonly reason: string,
    public readonly permissionTier: string,
  ) {}
}

export class RouteComparedEvent {
  constructor(
    public readonly studentId: string,
    public readonly amountUsd: number,
    public readonly chosenStrategy: string,
  ) {}
}
