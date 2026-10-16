export enum PermissionTier {
  READ_ONLY = 'READ_ONLY',
  DRAFT = 'DRAFT',
  EXECUTE = 'EXECUTE',
}

export class PermissionPolicyException extends Error {
  constructor(message: string, public readonly tier: PermissionTier) {
    super(message);
    this.name = 'PermissionPolicyException';
  }
}

export class PermissionTierValidator {
  static validateToolExecution(
    toolName: string,
    isUserInitiatedExecution: boolean,
  ): { tier: PermissionTier; allowed: boolean; reason?: string } {
    switch (toolName) {
      case 'getBalance':
      case 'compareRoutes':
      case 'getAuditLog':
        return { tier: PermissionTier.READ_ONLY, allowed: true };

      case 'createTransferDraft':
        return { tier: PermissionTier.DRAFT, allowed: true };

      case 'confirmTransfer':
        if (!isUserInitiatedExecution) {
          return {
            tier: PermissionTier.EXECUTE,
            allowed: false,
            reason:
              'Security Policy Violation: Agent cannot execute fund transfers unilaterally. Explicit user confirmation via the secure confirmation token is strictly required.',
          };
        }
        return { tier: PermissionTier.EXECUTE, allowed: true };

      default:
        return {
          tier: PermissionTier.READ_ONLY,
          allowed: false,
          reason: `Unknown tool "${toolName}" rejected by security policy.`,
        };
    }
  }
}
