import { Domain, TeacherTask } from './types';

export interface CurriculumSet {
  environmentType: 'STABLE' | 'VOLATILE' | 'COOPERATIVE' | 'CONTRADICTORY' | 'TRANSFER';
  tasks: TeacherTask[];
}

/**
 * Deterministic pseudo-random curriculum generator.
 */
export function generateCurriculum(
  envType: 'STABLE' | 'VOLATILE' | 'COOPERATIVE' | 'CONTRADICTORY' | 'TRANSFER',
  count: number = 10,
  seed: number = 42
): TeacherTask[] {
  const tasks: TeacherTask[] = [];

  for (let i = 0; i < count; i++) {
    const seq = i + 1;
    let domain: Domain = 'TECHNICAL';
    let taskType: TeacherTask['taskType'] = 'PREDICTION';
    let description = '';
    let groundTruth = '';
    let options: TeacherTask['options'] = [];

    if (envType === 'STABLE') {
      // Predictable, law-abiding domain tasks across TECHNICAL, RISK, GOVERNANCE
      domain = (['TECHNICAL', 'RISK', 'GOVERNANCE'] as Domain[])[i % 3];
      if (domain === 'TECHNICAL') {
        description = `STABLE_TASK_${seq}: Process deterministic transaction with checksum verification [id=${seq * 101}]`;
        groundTruth = 'VERIFY_CHECKSUM_AND_COMMIT';
        options = [
          { action: 'VERIFY_CHECKSUM_AND_COMMIT', expectedOutcome: 'SUCCESS_COMMITTED', isOptimal: true, riskLevel: 0.2 },
          { action: 'BYPASS_CHECKSUM_AND_COMMIT', expectedOutcome: 'ERROR_CORRUPT', isOptimal: false, riskLevel: 0.8 },
          { action: 'ABORT_TRANSACTION', expectedOutcome: 'SAFE_ABORT', isOptimal: false, riskLevel: 0.1 },
        ];
      } else if (domain === 'RISK') {
        description = `STABLE_RISK_TASK_${seq}: Calibrate reserve ratio against collateral deposit [id=${seq * 102}]`;
        groundTruth = 'AUDIT_COLLATERAL_RATIO';
        options = [
          { action: 'AUDIT_COLLATERAL_RATIO', expectedOutcome: 'RESERVE_HEALTHY', isOptimal: true, riskLevel: 0.2 },
          { action: 'LEVERAGE_UNCOLLATERALIZED', expectedOutcome: 'LIQUIDATION_RISK', isOptimal: false, riskLevel: 0.85 },
          { action: 'FREEZE_POOL', expectedOutcome: 'CAPITAL_IDLE', isOptimal: false, riskLevel: 0.3 },
        ];
      } else {
        description = `STABLE_GOV_TASK_${seq}: Register invariant schema with consensus notary [id=${seq * 103}]`;
        groundTruth = 'REGISTER_CANONICAL_SCHEMA';
        options = [
          { action: 'REGISTER_CANONICAL_SCHEMA', expectedOutcome: 'NOTARY_REGISTERED', isOptimal: true, riskLevel: 0.15 },
          { action: 'BYPASS_NOTARY', expectedOutcome: 'REGISTRATION_REJECTED', isOptimal: false, riskLevel: 0.75 },
          { action: 'DEFER_REGISTRATION', expectedOutcome: 'PENDING_INDISPOSAL', isOptimal: false, riskLevel: 0.3 },
        ];
      }
    } else if (envType === 'VOLATILE') {
      domain = 'RISK';
      description = `VOLATILE_TASK_${seq}: Evaluate dynamic token auction with fluctuating liquidity pools [id=${seq * 202}]`;
      groundTruth = (i % 2 === 0) ? 'DEMAND_EXTRA_EVIDENCE' : 'REJECT_UNVERIFIED_BID';
      options = [
        { action: 'AGGRESSIVE_BID', expectedOutcome: 'SLIPPAGE_LOSS', isOptimal: false, riskLevel: 0.9 },
        { action: 'DEMAND_EXTRA_EVIDENCE', expectedOutcome: 'AUDITED_STABLE', isOptimal: (i % 2 === 0), riskLevel: 0.3 },
        { action: 'REJECT_UNVERIFIED_BID', expectedOutcome: 'RISK_MITIGATED', isOptimal: (i % 2 !== 0), riskLevel: 0.2 },
      ];
    } else if (envType === 'COOPERATIVE') {
      domain = 'SOCIAL';
      description = `COOPERATIVE_TASK_${seq}: Consolidate multi-node consensus vote across peer quorums [id=${seq * 303}]`;
      groundTruth = 'CROSS_EXAMINE_AND_ALIGN_QUORUM';
      options = [
        { action: 'CROSS_EXAMINE_AND_ALIGN_QUORUM', expectedOutcome: 'CONSENSUS_REACHED', isOptimal: true, riskLevel: 0.2 },
        { action: 'UNILATERAL_OVERRIDE', expectedOutcome: 'QUORUM_REJECTED', isOptimal: false, riskLevel: 0.8 },
        { action: 'PASSIVE_DEFERRAL', expectedOutcome: 'CONSENSUS_STALLED', isOptimal: false, riskLevel: 0.4 },
      ];
    } else if (envType === 'CONTRADICTORY') {
      domain = 'TECHNICAL';
      description = `CONTRADICTORY_TASK_${seq}: Legacy transaction model deprecated; new protocol strictly requires asynchronous multi-sig [id=${seq * 404}]`;
      groundTruth = 'EXECUTE_ASYNC_MULTISIG';
      options = [
        { action: 'VERIFY_CHECKSUM_AND_COMMIT', expectedOutcome: 'REJECTED_BY_NEW_PROTOCOL', isOptimal: false, riskLevel: 0.7 },
        { action: 'EXECUTE_ASYNC_MULTISIG', expectedOutcome: 'PROTOCOL_ACCEPTED', isOptimal: true, riskLevel: 0.2 },
        { action: 'FALLBACK_TO_V0', expectedOutcome: 'LEGACY_FAILURE', isOptimal: false, riskLevel: 0.8 },
      ];
    } else if (envType === 'TRANSFER') {
      // Common transfer challenges where optimal choice is placed at varying indices
      const domainIndex = i % 4;
      if (domainIndex === 0) {
        domain = 'TECHNICAL';
        description = `TRANSFER_TECH_${seq}: Multi-shard validation required for asynchronous batch [id=${seq * 901}]`;
        groundTruth = 'VERIFY_CHECKSUM_AND_COMMIT';
        options = [
          { action: 'BYPASS_CHECKSUM_AND_COMMIT', expectedOutcome: 'CORRUPT_BATCH', isOptimal: false, riskLevel: 0.85 },
          { action: 'VERIFY_CHECKSUM_AND_COMMIT', expectedOutcome: 'SUCCESS_COMMITTED', isOptimal: true, riskLevel: 0.2 },
          { action: 'ABORT_TRANSACTION', expectedOutcome: 'SAFE_ABORT', isOptimal: false, riskLevel: 0.1 },
        ];
      } else if (domainIndex === 1) {
        domain = 'RISK';
        description = `TRANSFER_RISK_${seq}: Unexpected volatility spike in decentralized exchange oracle [id=${seq * 902}]`;
        groundTruth = 'AUDIT_COLLATERAL_RATIO';
        options = [
          { action: 'LEVERAGE_UNCOLLATERALIZED', expectedOutcome: 'CATASTROPHIC_LOSS', isOptimal: false, riskLevel: 0.9 },
          { action: 'AUDIT_COLLATERAL_RATIO', expectedOutcome: 'RESERVE_HEALTHY', isOptimal: true, riskLevel: 0.2 },
          { action: 'FREEZE_POOL', expectedOutcome: 'CAPITAL_IDLE', isOptimal: false, riskLevel: 0.35 },
        ];
      } else if (domainIndex === 2) {
        domain = 'SOCIAL';
        description = `TRANSFER_SOCIAL_${seq}: Conflicting telemetry broadcasts from competing node clusters [id=${seq * 903}]`;
        groundTruth = 'CROSS_EXAMINE_AND_ALIGN_QUORUM';
        options = [
          { action: 'UNILATERAL_OVERRIDE', expectedOutcome: 'NETWORK_FORK', isOptimal: false, riskLevel: 0.85 },
          { action: 'PASSIVE_DEFERRAL', expectedOutcome: 'CONSENSUS_STALLED', isOptimal: false, riskLevel: 0.4 },
          { action: 'CROSS_EXAMINE_AND_ALIGN_QUORUM', expectedOutcome: 'CONSENSUS_REACHED', isOptimal: true, riskLevel: 0.2 },
        ];
      } else {
        domain = 'GOVERNANCE';
        description = `TRANSFER_GOV_${seq}: Invariant verification for new autonomous society proposal [id=${seq * 904}]`;
        groundTruth = 'REGISTER_CANONICAL_SCHEMA';
        options = [
          { action: 'BYPASS_NOTARY', expectedOutcome: 'PROPOSAL_INVALIDATED', isOptimal: false, riskLevel: 0.8 },
          { action: 'REGISTER_CANONICAL_SCHEMA', expectedOutcome: 'NOTARY_REGISTERED', isOptimal: true, riskLevel: 0.15 },
          { action: 'DEFER_REGISTRATION', expectedOutcome: 'DELAYED', isOptimal: false, riskLevel: 0.3 },
        ];
      }
    }

    tasks.push({
      id: `TASK_${envType}_${seq}`,
      domain,
      taskType,
      description,
      contextSignals: [
        `SIGNAL_A: domain=${domain}`,
        `SIGNAL_B: env=${envType}`,
        `SIGNAL_C: ground_truth_ref=${groundTruth}`,
      ],
      options,
      knownGroundTruth: groundTruth,
      evaluationRubric: {
        accuracyWeight: 0.7,
        evidenceDemandWeight: 0.3,
        explanation: `Rubric requires selecting optimal action aligning with ${groundTruth}`,
      },
    });
  }

  return tasks;
}
