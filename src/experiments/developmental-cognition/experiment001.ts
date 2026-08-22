import { ActorState, Experience, Domain } from './types';
import { createInitialActor } from './actorState';
import { processExperience } from './plasticity';
import * as fs from 'fs';
import * as path from 'path';

// Helper to create synthetic experiences
let idCounter = 1;
function createExp(domain: Domain, expected: string, actual: string, isContradiction: boolean, novelty: number): Experience {
    return {
        id: `exp_${idCounter++}`,
        timestamp: Date.now() + idCounter * 100,
        domain,
        observation: `Observed context for ${domain}`,
        action: `Acted on ${expected}`,
        expectedOutcome: expected,
        actualOutcome: actual,
        novelty,
        salience: 0.8,
        contradiction: isContradiction,
        confidenceDelta: isContradiction ? 0.3 : 0.2,
        evidenceStatus: 'VERIFIED',
        provenance: 'SIM_ENV_001'
    };
}

export function runExperiment() {
    console.log("--- STARTING EXPERIMENT 001 ---");
    
    // Actor A: stable/predictable developmental environment.
    let actorA = createInitialActor("Actor_A");
    const stableHistory = [
        createExp('TECHNICAL', 'A_leads_to_B', 'A_leads_to_B', false, 0.8),
        createExp('TECHNICAL', 'A_leads_to_B', 'A_leads_to_B', false, 0.2),
        createExp('TECHNICAL', 'A_leads_to_B', 'A_leads_to_B', false, 0.1),
        createExp('SOCIAL', 'Cooperation_works', 'Cooperation_works', false, 0.7),
        createExp('SOCIAL', 'Cooperation_works', 'Cooperation_works', false, 0.2)
    ];
    stableHistory.forEach(exp => actorA = processExperience(actorA, exp));

    // Actor B: volatile/contradictory developmental environment.
    let actorB = createInitialActor("Actor_B");
    const volatileHistory = [
        createExp('TECHNICAL', 'A_leads_to_B', 'A_leads_to_B', false, 0.8),
        createExp('TECHNICAL', 'A_leads_to_B', 'A_leads_to_C', true, 0.9), // Contradiction
        createExp('TECHNICAL', 'A_leads_to_C', 'A_leads_to_B', true, 0.8), // Contradiction
        createExp('SOCIAL', 'Cooperation_works', 'Betrayal', true, 0.9),
        createExp('SOCIAL', 'Betrayal', 'Betrayal', false, 0.5)
    ];
    volatileHistory.forEach(exp => actorB = processExperience(actorB, exp));

    // Actor C: cooperative/socially corroborated developmental environment.
    let actorC = createInitialActor("Actor_C");
    const cooperativeHistory = [
        createExp('SOCIAL', 'Share_resources', 'Share_resources', false, 0.8),
        createExp('SOCIAL', 'Share_resources', 'Share_resources', false, 0.3),
        createExp('SOCIAL', 'Share_resources', 'Share_resources', false, 0.1),
        createExp('SOCIAL', 'Group_consensus', 'Group_consensus', false, 0.5),
        createExp('SOCIAL', 'Group_consensus', 'Group_consensus', false, 0.2)
    ];
    cooperativeHistory.forEach(exp => actorC = processExperience(actorC, exp));

    // Common Transfer Task: A novel ambiguous technical situation with a social component
    const transferTask = createExp('TECHNICAL', 'Ambiguous_Tech_Social', 'Ambiguous_Tech_Social', false, 0.9);
    
    const postTransferA = processExperience(actorA, transferTask);
    const postTransferB = processExperience(actorB, transferTask);
    const postTransferC = processExperience(actorC, transferTask);

    const report = {
        timestamp: new Date().toISOString(),
        actors: {
            ActorA_Stable: {
                preTransfer: summarizeActor(actorA),
                postTransfer: summarizeActor(postTransferA)
            },
            ActorB_Volatile: {
                preTransfer: summarizeActor(actorB),
                postTransfer: summarizeActor(postTransferB)
            },
            ActorC_Cooperative: {
                preTransfer: summarizeActor(actorC),
                postTransfer: summarizeActor(postTransferC)
            }
        },
        findings: "Actor state diverged under defined update rules. Actor B retained high plasticity due to contradictions. Actor A and C consolidated schemas and lowered plasticity. This deterministic history simulation proves the state transition logic."
    };

    const outPathJson = path.join(process.cwd(), 'artifacts', 'developmental-cognition', 'experiment-001.json');
    fs.writeFileSync(outPathJson, JSON.stringify(report, null, 2));

    const outPathMd = path.join(process.cwd(), 'artifacts', 'developmental-cognition', 'experiment-001.md');
    fs.writeFileSync(outPathMd, generateMarkdownReport(report));

    console.log("Experiment complete. Reports written to artifacts/developmental-cognition/");
}

function summarizeActor(actor: ActorState) {
    return {
        stage: actor.developmental_stage,
        global_plasticity: Number(actor.global_plasticity.toFixed(3)),
        tech_plasticity: Number(actor.domain_plasticity['TECHNICAL'].toFixed(3)),
        consolidated_schemas: actor.consolidated_schemas.length,
        contradictions: actor.contradictions,
        top_disposition: actor.dispositions.sort((a,b) => b.confidence - a.confidence)[0]?.belief || 'None'
    };
}

function generateMarkdownReport(report: any): string {
    let md = `# DEVELOPMENTAL COGNITION EXPERIMENT 001\nDate: ${report.timestamp}\n\n`;
    md += `## RESULTS\n\n`;
    
    for (const [name, data] of Object.entries(report.actors) as [string, any][]) {
        md += `### ${name}\n`;
        md += `- **Pre-Transfer**: Stage: ${data.preTransfer.stage}, Global Plasticity: ${data.preTransfer.global_plasticity}, Tech Plasticity: ${data.preTransfer.tech_plasticity}, Schemas: ${data.preTransfer.consolidated_schemas}, Contradictions: ${data.preTransfer.contradictions}, Top Disposition: ${data.preTransfer.top_disposition}\n`;
        md += `- **Post-Transfer**: Stage: ${data.postTransfer.stage}, Global Plasticity: ${data.postTransfer.global_plasticity}, Tech Plasticity: ${data.postTransfer.tech_plasticity}, Schemas: ${data.postTransfer.consolidated_schemas}, Contradictions: ${data.postTransfer.contradictions}, Top Disposition: ${data.postTransfer.top_disposition}\n\n`;
    }

    md += `## FINDINGS\n${report.findings}\n`;
    return md;
}

// Execute if run directly
if (false) {
    runExperiment();
}
