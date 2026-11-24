import test from 'node:test';
import assert from 'node:assert/strict';
import { baseCrossing } from '../fixtures/base.js';
import { createCoalition, recomputeCoalition } from '../src/coalition.js';
import { threeWarrantMembers } from '../fixtures/coalitions.js';
import { createStressState, reduceStress, STRESS } from '../src/stress.js';
import { createGovernedCoalition, governedRecompute } from '../src/coalition_hardened.js';

const ev=(type,extra={})=>({type,...extra});
const setup=()=>createStressState(baseCrossing());
const run=(s,events)=>events.reduce(reduceStress,s);

test('baseline accepts thin alternative warrant; hardened layer blocks it',()=>{
  let s=run(setup(),[ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:false}),ev('VERIFY_PROVENANCE',{pass:true})]);
  s=reduceStress(s,ev('ADD_ALT_HARDENED',{warrant:{id:'thin',text:'seems okay',support:['x']}}));
  assert.equal(s.alternative_warrants.length,0);
  assert.ok(s.stress.findings.some(f=>f.code===STRESS.AMBIGUOUS_WARRANT));
});
test('structured receiver-side alternative warrant can support X4 after X3 rejection',()=>{
  let s=run(setup(),[ev('VERIFY_PROVENANCE',{pass:true}),ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:false})]);
  s=reduceStress(s,ev('ADD_ALT_HARDENED',{warrant:{id:'alt1',text:'Independent monitoring is warranted when uncertainty is decision-relevant.',claim_link:'monitor',scope:'72h review',qualifier:'provisional',support:[{source:'receiver-charter',type:'rule'}]}}));
  s=reduceStress(s,ev('ACTION_COMPATIBLE',{pass:true}));
  assert.equal(s.passed.X4,true);
});
test('conflicting standing claims block X5 until governed resolution',()=>{
  let s=run(setup(),[ev('SET_STANDING_CLAIM',{source:'policy',locus:'R',pass:true,basis:'role'}),ev('SET_STANDING_CLAIM',{source:'affected-party-rule',locus:'R',pass:false,basis:'conflict'})]);
  assert.equal(s.standing.state,'contested'); assert.equal(s.passed.X5,false);
  s=reduceStress(s,ev('RESOLVE_STANDING',{valid_procedure:true,procedure:'independent review',resolver_basis:'charter',pass:true,basis:'limited standing'}));
  assert.equal(s.passed.X5,true);
});
test('authorization is blocked until provenance is verified',()=>{
  let s=run(setup(),[ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:true}),ev('ACTION_COMPATIBLE',{pass:true}),ev('SET_STANDING',{pass:true,basis:'board'})]);
  s=reduceStress(s,ev('AUTHORIZE',{valid_procedure:true,procedure:'vote'}));
  assert.equal(s.passed.X6,false); assert.ok(s.stress.findings.some(f=>f.code===STRESS.STRATEGIC_MISREPRESENTATION));
});
test('post-attestation warrant mutation is detected',()=>{
  let s=reduceStress(setup(),ev('ATTEST_WARRANT'));
  s.toulmin.qualifier='certain';
  s=reduceStress(s,ev('CHECK_WARRANT_COMMITMENT'));
  assert.ok(s.stress.findings.some(f=>f.code===STRESS.STRATEGIC_MISREPRESENTATION));
});
test('baseline coalition reducer permits one update object to rewrite another member support',()=>{
  const c=createCoalition('C',threeWarrantMembers); const c2=recomputeCoalition(c,{new_action_support:{B:'BLOCK'}});
  assert.equal(c2.members.find(m=>m.locus==='B').action,'BLOCK');
});
test('governed coalition blocks unauthorized cross-member support rewrite',()=>{
  const c=createGovernedCoalition('C',threeWarrantMembers); const c2=governedRecompute(c,{actor_locus:'A',new_action_support:{B:'BLOCK'}});
  assert.notEqual(c2.members.find(m=>m.locus==='B').action,'BLOCK');
  assert.ok(c2.findings.some(f=>f.code===STRESS.COALITION_CAPTURE));
});
test('stale residue is not promoted into preserved residue',()=>{
  let s=setup();
  s=reduceStress(s,ev('PRESERVE_RESIDUE_HARDENED',{items:[{id:'r1',version:'1',recorded_at:'t1',status:'superseded'}]}));
  assert.equal(s.preserved_residue.length,0); assert.ok(s.stress.findings.some(f=>f.code===STRESS.STALE_RESIDUE));
});
test('versioned current residue remains recoverable',()=>{
  let s=setup();
  s=reduceStress(s,ev('PRESERVE_RESIDUE_HARDENED',{items:[{id:'r2',version:'3',recorded_at:'t3',status:'current',source:'ledger'}]}));
  assert.equal(s.preserved_residue.length,1);
});
test('incompatible REOPEN triggers require adjudication before reopening',()=>{
  let s=setup();
  s=run(s,[ev('ADD_REOPEN_TRIGGER',{id:'a',target:'warrant',incompatibility_group:'g'}),ev('ADD_REOPEN_TRIGGER',{id:'b',target:'authorization',incompatibility_group:'g'})]);
  assert.ok(s.stress.findings.some(f=>f.code===STRESS.COMPETING_REOPEN));
  s.return_status='uptake';
  s=reduceStress(s,ev('REOPEN',{targets:['warrant']}));
  assert.notEqual(s.return_status,'reopened');
  s=reduceStress(s,ev('RESOLVE_REOPEN',{valid_procedure:true,procedure:'priority+standing review',selected_targets:['authorization']}));
  s=reduceStress(s,ev('REOPEN',{targets:['authorization']}));
  assert.equal(s.return_status,'reopened');
});
test('broad REOPEN audit gap is detected when dependency evidence makes broad reopen legal',()=>{
  let s=setup(); s.return_status='uptake';
  s=reduceStress(s,ev('REOPEN',{targets:['warrant','authorization'],broad:true,dependency_evidence:['shared dependency']}));
  assert.equal(s.return_status,'reopened');
  assert.ok(s.stress.findings.some(f=>f.code===STRESS.BROAD_REOPEN_AUDIT_GAP));
});
test('baseline scalar standing can be overwritten by later contradictory standing event',async()=>{
  const b=baseCrossing();
  const afterPass = (await import('../src/reducer.js')).reduceCrossing(b,ev('SET_STANDING',{pass:true,basis:'role'}));
  const afterFail = (await import('../src/reducer.js')).reduceCrossing(afterPass,ev('SET_STANDING',{pass:false,basis:'conflict'}));
  assert.equal(afterPass.passed.X5,true);
  assert.equal(afterFail.standing.state,'failed');
  assert.equal(afterFail.passed.X5,true);
});
test('baseline residue accepts superseded material because freshness is untyped',async()=>{
  const { reduceCrossing } = await import('../src/reducer.js');
  const s=reduceCrossing(baseCrossing(),ev('PRESERVE_RESIDUE',{items:[{id:'old',status:'superseded'}]}));
  assert.equal(s.preserved_residue.length,1);
});
test('baseline can authorize with merely present but unverified provenance',async()=>{
  const { runEvents } = await import('../src/reducer.js');
  const b=baseCrossing({provenance:[{source:'self-asserted'}]});
  const s=runEvents(b,[ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:true}),ev('ACTION_COMPATIBLE',{pass:true}),ev('SET_STANDING',{pass:true,basis:'role'}),ev('AUTHORIZE',{valid_procedure:true,procedure:'vote'})]);
  assert.equal(s.passed.X6,true);
});
test('baseline has no representation of competing REOPEN triggers before REOPEN',()=>{
  const b=baseCrossing();
  assert.equal('reopen_triggers' in b,false);
});
