import { ActorState } from '../types';
import { createInitialActor } from '../actorState';
import { processExperience } from '../plasticity';

// A simple test runner to verify core invariants without Jest/Mocha
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error(`❌ FAIL: ${message}`);
    }
}

function runTests() {
    console.log("Running Plasticity Tests...");
    
    // 1. Identical initial state
    const actor1 = createInitialActor("T1");
    const actor2 = createInitialActor("T2");
    assert(actor1.global_plasticity === actor2.global_plasticity, "Identical initial plasticity");
    assert(actor1.developmental_stage === 'INITIAL', "Starts at INITIAL stage");

    // 2. Reinforcement
    let reinforced = processExperience(actor1, {
        id: 'e1', timestamp: 1, domain: 'TECHNICAL', observation: '', action: '', 
        expectedOutcome: 'A', actualOutcome: 'A', novelty: 0.5, salience: 0.5, 
        contradiction: false, confidenceDelta: 0.2, evidenceStatus: 'VERIFIED', provenance: 'test'
    });
    assert(reinforced.dispositions.length === 1, "Creates disposition");
    assert(reinforced.dispositions[0].belief === 'A', "Disposition belief is A");
    
    // 3. Consolidation (needs 3 verified instances)
    reinforced = processExperience(reinforced, {
        id: 'e2', timestamp: 2, domain: 'TECHNICAL', observation: '', action: '', 
        expectedOutcome: 'A', actualOutcome: 'A', novelty: 0.1, salience: 0.5, 
        contradiction: false, confidenceDelta: 0.5, evidenceStatus: 'VERIFIED', provenance: 'test'
    });
    reinforced = processExperience(reinforced, {
        id: 'e3', timestamp: 3, domain: 'TECHNICAL', observation: '', action: '', 
        expectedOutcome: 'A', actualOutcome: 'A', novelty: 0.1, salience: 0.5, 
        contradiction: false, confidenceDelta: 0.5, evidenceStatus: 'VERIFIED', provenance: 'test'
    });
    assert(reinforced.consolidated_schemas.length === 1, "Consolidates after repeated verification");
    assert(reinforced.developmental_stage === 'CONSOLIDATING', "Transitions to CONSOLIDATING");
    
    // 4. Contradiction-driven reopening
    const beforeContradiction = reinforced.global_plasticity;
    const contradicted = processExperience(reinforced, {
        id: 'e4', timestamp: 4, domain: 'TECHNICAL', observation: '', action: '', 
        expectedOutcome: 'A', actualOutcome: 'B', novelty: 0.9, salience: 0.9, 
        contradiction: true, confidenceDelta: 0.4, evidenceStatus: 'VERIFIED', provenance: 'test'
    });
    assert(contradicted.contradictions === 1, "Increments contradiction count");
    assert(contradicted.global_plasticity > beforeContradiction, "Global plasticity reopens on contradiction");
    
    // 5. No silent provenance loss
    assert(contradicted.provenance.length > 4, "Provenance log grows with experiences");
    assert(contradicted.provenance[0].startsWith('INIT:'), "Provenance preserves init");

    console.log(`\nTests complete. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

runTests();
