import test from 'node:test';
import assert from 'node:assert/strict';
import { baseCrossing } from '../fixtures/base.js';
import { runEvents } from '../src/reducer.js';
import { evaluateInvariants,assertCoalitionInvariant } from '../src/invariants.js';
import { createCoalition } from '../src/coalition.js';
import { threeWarrantMembers } from '../fixtures/coalitions.js';
const ev=(type,extra={})=>({type,...extra});
function compliant(){return runEvents(baseCrossing(),[
 ev('VERIFY_PROVENANCE',{pass:true,method:'fixture'}),
 ev('INTELLIGIBLE',{pass:true}),ev('EVIDENCE_RECEIVABLE',{pass:true}),ev('WARRANT_LICENSE',{pass:false}),
 ev('ADD_ALTERNATIVE_WARRANT',{warrant:{id:'WB',text:'Procedural review is required under unresolved uncertainty.',claim_link:'Delay one cycle',scope:'one cycle',qualifier:'provisional',support:[{source:'B:policy',type:'rule'}]}}),ev('ACTION_COMPATIBLE',{pass:true}),
 ev('SET_STANDING',{pass:true,basis:'review board'}),ev('AUTHORIZE',{valid_procedure:true,procedure:'vote',scope:'one-cycle-delay'}),
 ev('PRESERVE_RESIDUE',{items:[{id:'R1',version:'1',recorded_at:'t1',status:'current',warrant:'sender technical warrant'}]}),ev('RECORD_ACTION',{action_id:'delay'}),
 ev('RECORD_CONSEQUENCE',{description:'new evidence arrives'}),ev('FINALIZE_X7')
]);}

test('I1-I16 compliant fixture passes all record invariants',()=>{const results=evaluateInvariants(compliant());assert.deepEqual(results.filter(r=>!r.pass),[]);assert.equal(results.length,16);});
test('I2 translation without mapping/loss fails auditability',()=>{const s=runEvents(baseCrossing(),[ev('TRANSLATE',{from:'a',to:'b'})]);assert.equal(evaluateInvariants(s).find(r=>r.id==='I9').pass,false);});
test('I5 authorization cannot bypass standing/provenance',()=>{const s=runEvents(baseCrossing(),[ev('AUTHORIZE',{valid_procedure:true,procedure:'vote'})]);assert.equal(s.passed.X6,false);});
test('I8 silent qualifier strengthening fails',()=>{const s=runEvents(baseCrossing(),[ev('QUALIFY',{qualifier:'certain',strengthens:true})]);assert.equal(evaluateInvariants(s).find(r=>r.id==='I8').pass,false);});
test('I10 thin alternative warrant is rejected, not promoted',()=>{const s=runEvents(baseCrossing(),[ev('ADD_ALTERNATIVE_WARRANT',{warrant:{text:'invented'}})]);assert.equal(s.alternative_warrants[0].status,'rejected');});
test('I12 broad REOPEN without demonstrated dependency is recorded and blocked',()=>{const s=runEvents(baseCrossing(),[ev('RETURN_DETECTED'),ev('RETURN_ROUTED'),ev('RETURN_RECEIVED'),ev('RETURN_UPTAKE'),ev('REOPEN',{targets:['all'],broad:true})]);assert.notEqual(s.return_status,'reopened');assert.ok(s.failures.some(f=>f.code==='WC-F18'));});
test('I14 coalition preserves distinct recoverable warrants for shared action',()=>{const result=assertCoalitionInvariant(createCoalition('C',threeWarrantMembers));assert.equal(result.pass,true);});
