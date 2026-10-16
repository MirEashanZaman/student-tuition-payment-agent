import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentToolsService } from './tools/agent-tools.service';
import { FinancialLimitsGuard } from './guardrails/financial-limits.guard';
import { PermissionTierValidator } from './guardrails/permission-tier.guard';
import { PromptInjectionFilter } from './guardrails/prompt-injection.filter';
import {
  PromptInjectionCheckHandler,
  PermissionTierCheckHandler,
  FinancialLimitCheckHandler,
  ConfirmationCheckHandler,
  AnomalyCheckHandler,
  SafetyChainCoordinator,
} from './guardrails/safety-chain';
import {
  BalancedScoringStrategy,
  CheapestScoringStrategy,
  FastestScoringStrategy,
  ReliableScoringStrategy,
  RouteScoringStrategyFactory,
} from './strategies/route-scoring.strategy';
import { TransferStateMachine } from './saga/transfer-state-machine';
import { BANK_GATEWAY_TOKEN } from './gateways/bank-gateway.interface';
import { MockBankGateway } from './gateways/mock-bank.gateway';
import { LLM_CLIENT_TOKEN } from './gateways/llm-client.interface';
import { GeminiLlmClient } from './gateways/gemini-llm.client';
import { OfflineLlmClient } from './gateways/offline-llm.client';
import { AuditLogListener } from './events/audit-log.listener';

@Module({
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentToolsService,
    FinancialLimitsGuard,
    PermissionTierValidator,
    PromptInjectionFilter,
    PromptInjectionCheckHandler,
    PermissionTierCheckHandler,
    FinancialLimitCheckHandler,
    ConfirmationCheckHandler,
    AnomalyCheckHandler,
    SafetyChainCoordinator,
    BalancedScoringStrategy,
    CheapestScoringStrategy,
    FastestScoringStrategy,
    ReliableScoringStrategy,
    RouteScoringStrategyFactory,
    TransferStateMachine,
    MockBankGateway,
    { provide: BANK_GATEWAY_TOKEN, useClass: MockBankGateway },
    OfflineLlmClient,
    GeminiLlmClient,
    { provide: LLM_CLIENT_TOKEN, useClass: GeminiLlmClient },
    AuditLogListener,
  ],
  exports: [
    AgentService,
    AgentToolsService,
    SafetyChainCoordinator,
    RouteScoringStrategyFactory,
    TransferStateMachine,
    BANK_GATEWAY_TOKEN,
    LLM_CLIENT_TOKEN,
  ],
})
export class AgentModule {}
