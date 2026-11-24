import test from 'node:test';
import assert from 'node:assert/strict';
import { baseCrossing } from '../fixtures/base.js';
import { runEvents } from '../src/reducer.js';
import { createCoalition,recomputeCoalition,activeSupport } from '../src/coalition.js';
import { threeWarrantMembers } from '../fixtures/coalitions.js';
const ev=(type,extra={})=>({type,...extra});
const verify=()=>ev('VERIFY_PROVENANCE',{pass:true,method:'fixture'});
const residue=id=>({id,version:'1',recorded_at:'t1',status:'current'});

test('X3 rejection does not block X4 when bounded typed OP-ALT is supported',()=>{const s=runEvents(baseCrossing(),[ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:false}),ev('ADD_ALTERNATIVE_WARRANT',{warrant:{id:'ALT',text:'Independent duty to review applies under unresolved uncertainty.',claim_link:'Delay one cycle',scope:'this cycle',qualifier:'provisional',support:[{source:'B:charter',type:'rule'}]}}),ev('ACTION_COMPATIBLE',{pass:true})]);assert.equal(s.x_state,'X4');});
test('X4 does not silently become X6',()=>{const s=runEvents(baseCrossing(),[ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:true}),ev('ACTION_COMPATIBLE',{pass:true})]);assert.equal(s.passed.X6,false);});
test('Return may reopen warrant without rewriting authorization history',()=>{const s=runEvents(baseCrossing(),[verify(),ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:true}),ev('ACTION_COMPATIBLE',{pass:true}),ev('SET_STANDING',{pass:true,basis:'board'}),ev('AUTHORIZE',{valid_procedure:true,procedure:'vote'}),ev('PRESERVE_RESIDUE',{items:[residue('minority')]}),ev('RECORD_ACTION',{action_id:'go'}),ev('RECORD_CONSEQUENCE',{description:'unexpected anomaly'}),ev('RETURN_DETECTED'),ev('RETURN_ROUTED',{target:'warrant'}),ev('RETURN_RECEIVED'),ev('RETURN_UPTAKE'),ev('REOPEN',{targets:['warrant']})]);assert.equal(s.authorization.state,'authorized');assert.deepEqual(s.reopen_targets,['warrant']);});
test('coalition self-recomposition preserves historical member record',()=>{const c=createCoalition('C',threeWarrantMembers);const c2=recomputeCoalition(c,{actor_locus:'B',withdraw_locus:'B',reason:'standing changed'});assert.equal(activeSupport(c2).length,2);assert.equal(c2.members.length,3);assert.equal(c2.history.at(-1).actor,'B');});
test('delegated coalition recomposition may update another member only within active delegation',()=>{const c=createCoalition('C',threeWarrantMembers,{delegations:[{from:'C',to:'A',scope:'action-support',active:true}]});const c2=recomputeCoalition(c,{actor_locus:'A',new_action_support:{C:'MONITOR'}});assert.equal(c2.members.find(m=>m.locus==='C').action,'MONITOR');assert.equal(c2.failures.length,0);});
test('X7 stops when provenance is absent or unverified',()=>{const s=baseCrossing({provenance:[],toulmin:{grounds:[{id:null}],claim:'x',warrant:{text:'w'},backing:[],qualifier:'q',rebuttals:[]}});const out=runEvents(s,[ev('PRESERVE_RESIDUE',{items:[residue('r')]}),ev('FINALIZE_X7')]);assert.equal(out.passed.X7,false);});
