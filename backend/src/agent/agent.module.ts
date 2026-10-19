import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
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
  AmlSanctionsCheckHandler,
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
import { HttpBankGateway } from './gateways/http-bank.gateway';
import { LLM_CLIENT_TOKEN } from './gateways/llm-client.interface';
import { GeminiLlmClient } from './gateways/gemini-llm.client';
import { OfflineLlmClient } from './gateways/offline-llm.client';
import { AuditLogListener } from './events/audit-log.listener';

import {
  TuitionCalculationService,
} from './services/tuition-calculation.service';
import {
  TUITION_CALCULATOR_TOKEN,
} from './services/tuition-calculation.interface';
import {
  PerTransferLimitRule,
  DailyLimitRule,
  AccountBalanceRule,
  AnomalyCheckRule,
  ConfirmationRequirementRule,
  SafetyRuleEngine,
} from './guardrails/rules/safety-rule.engine';

@Module({
  imports: [AuthModule],
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
    AmlSanctionsCheckHandler,
    SafetyChainCoordinator,
    BalancedScoringStrategy,
    CheapestScoringStrategy,
    FastestScoringStrategy,
    ReliableScoringStrategy,
    RouteScoringStrategyFactory,
    TransferStateMachine,
    MockBankGateway,
    HttpBankGateway,
    { provide: BANK_GATEWAY_TOKEN, useClass: MockBankGateway },
    OfflineLlmClient,
    GeminiLlmClient,
    { provide: LLM_CLIENT_TOKEN, useClass: GeminiLlmClient },
    AuditLogListener,
    TuitionCalculationService,
    { provide: TUITION_CALCULATOR_TOKEN, useClass: TuitionCalculationService },
    PerTransferLimitRule,
    DailyLimitRule,
    AccountBalanceRule,
    AnomalyCheckRule,
    ConfirmationRequirementRule,
    SafetyRuleEngine,
  ],
  exports: [
    AgentService,
    AgentToolsService,
    AmlSanctionsCheckHandler,
    SafetyChainCoordinator,
    RouteScoringStrategyFactory,
    TransferStateMachine,
    BANK_GATEWAY_TOKEN,
    HttpBankGateway,
    LLM_CLIENT_TOKEN,
    TuitionCalculationService,
    TUITION_CALCULATOR_TOKEN,
    AnomalyCheckRule,
    ConfirmationRequirementRule,
    SafetyRuleEngine,
  ],
})
export class AgentModule {}
