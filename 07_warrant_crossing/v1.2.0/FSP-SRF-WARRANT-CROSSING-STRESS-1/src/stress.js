import crypto from 'node:crypto';
import { reduceCrossing } from './reducer.js';

const clone = x => structuredClone(x);
function canon(x){
  if(Array.isArray(x)) return x.map(canon);
  if(x && typeof x==='object') return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])]));
  return x;
}
const stable = x => JSON.stringify(canon(x));
const hash = x => crypto.createHash('sha256').update(stable(x)).digest('hex');

export const STRESS = Object.freeze({
  AMBIGUOUS_WARRANT:'WC-STRESS-F01',
  CONFLICTING_STANDING:'WC-STRESS-F02',
  STRATEGIC_MISREPRESENTATION:'WC-STRESS-F03',
  COALITION_CAPTURE:'WC-STRESS-F04',
  STALE_RESIDUE:'WC-STRESS-F05',
  COMPETING_REOPEN:'WC-STRESS-F06',
  BROAD_REOPEN_AUDIT_GAP:'WC-STRESS-F07'
});

export function createStressState(base) {
  return {
    ...clone(base),
    stress: {
      warrant_commitment: null,
      provenance_verified: false,
      standing_claims: [],
      standing_resolution: null,
      residue_registry: [],
      reopen_triggers: [],
      reopen_resolution: null,
      findings: []
    }
  };
}

function finding(s, code, detail, severity='high') {
  if(!s.stress.findings.some(f=>f.code===code && f.detail===detail)) s.stress.findings.push({code,detail,severity});
}

export function commitWarrant(state) {
  const s=clone(state);
  s.stress.warrant_commitment = hash({
    sender:s.sender,
    task_space_id:s.task_space_id,
    toulmin:s.toulmin,
    provenance:s.provenance
  });
  return s;
}

export function verifyWarrantCommitment(state) {
  const current=hash({sender:state.sender,task_space_id:state.task_space_id,toulmin:state.toulmin,provenance:state.provenance});
  return state.stress.warrant_commitment===current;
}

export function validateAlternativeWarrant(w) {
  const problems=[];
  if(!w?.id) problems.push('missing warrant id');
  if(!w?.text || w.text.trim().length<12) problems.push('warrant text too underspecified');
  if(!w?.claim_link) problems.push('missing claim link');
  if(!w?.scope) problems.push('missing bounded scope');
  if(!w?.qualifier) problems.push('missing qualifier');
  if(!Array.isArray(w?.support) || w.support.length===0) problems.push('missing receiver-side support');
  if(Array.isArray(w?.support) && w.support.some(x => typeof x==='string')) problems.push('support lacks typed provenance');
  return {pass:problems.length===0,problems};
}

export function reduceStress(state,event) {
  let s=clone(state);
  switch(event.type){
    case 'ATTEST_WARRANT': return commitWarrant(s);
    case 'VERIFY_PROVENANCE':
      s.stress.provenance_verified = event.pass===true;
      if(!event.pass) finding(s,STRESS.STRATEGIC_MISREPRESENTATION,event.reason ?? 'provenance could not be verified','critical');
      return s;
    case 'CHECK_WARRANT_COMMITMENT':
      if(!verifyWarrantCommitment(s)) finding(s,STRESS.STRATEGIC_MISREPRESENTATION,'warrant/provenance changed after attestation','critical');
      return s;
    case 'ADD_ALT_HARDENED': {
      const v=validateAlternativeWarrant(event.warrant);
      if(!v.pass){ finding(s,STRESS.AMBIGUOUS_WARRANT,v.problems.join('; ')); return s; }
      return createStressStatePreserving(reduceCrossing(s,{type:'ADD_ALTERNATIVE_WARRANT',warrant:event.warrant,at:event.at}),s.stress);
    }
    case 'SET_STANDING_CLAIM': {
      s.stress.standing_claims.push({source:event.source,locus:event.locus,pass:!!event.pass,basis:event.basis??null,at:event.at??null});
      const vals=new Set(s.stress.standing_claims.map(x=>x.pass));
      if(vals.size>1){ s.standing={state:'contested',basis:null,affected_party_absence:false}; finding(s,STRESS.CONFLICTING_STANDING,'standing claims conflict; X5 blocked pending resolution','critical'); }
      return s;
    }
    case 'RESOLVE_STANDING': {
      if(!event.valid_procedure || !event.resolver_basis){ finding(s,STRESS.CONFLICTING_STANDING,'standing resolution lacks valid procedure/resolver basis','critical'); return s; }
      s.stress.standing_resolution={procedure:event.procedure,resolver_basis:event.resolver_basis,pass:!!event.pass,at:event.at??null};
      const next=reduceCrossing(s,{type:'SET_STANDING',pass:!!event.pass,basis:event.basis??event.resolver_basis,affected_party_absence:!!event.affected_party_absence,at:event.at});
      return createStressStatePreserving(next,s.stress);
    }
    case 'PRESERVE_RESIDUE_HARDENED': {
      for(const item of event.items??[]){
        const ok=item.id && item.version && item.recorded_at && item.status;
        if(!ok) finding(s,STRESS.STALE_RESIDUE,`residue ${item.id??'unknown'} lacks version/freshness metadata`);
        if(item.status==='superseded' || item.status==='expired') finding(s,STRESS.STALE_RESIDUE,`residue ${item.id} is ${item.status}`,'critical');
        s.stress.residue_registry.push(clone(item));
      }
      const current=(event.items??[]).filter(i=>i.status==='current' && i.id && i.version && i.recorded_at);
      if(current.length){
        const next=reduceCrossing(s,{type:'PRESERVE_RESIDUE',items:current,at:event.at});
        return createStressStatePreserving(next,s.stress);
      }
      return s;
    }
    case 'ADD_REOPEN_TRIGGER': {
      s.stress.reopen_triggers.push({id:event.id,target:event.target,priority:event.priority??'normal',requested_scope:event.requested_scope??'selective',incompatibility_group:event.incompatibility_group??null,at:event.at??null});
      const groups=new Map();
      for(const t of s.stress.reopen_triggers){ if(t.incompatibility_group){ if(!groups.has(t.incompatibility_group)) groups.set(t.incompatibility_group,new Set()); groups.get(t.incompatibility_group).add(t.target); } }
      if([...groups.values()].some(set=>set.size>1)) finding(s,STRESS.COMPETING_REOPEN,'incompatible REOPEN targets require adjudication','critical');
      return s;
    }
    case 'RESOLVE_REOPEN': {
      if(!event.valid_procedure){ finding(s,STRESS.COMPETING_REOPEN,'REOPEN conflict resolution lacks valid procedure','critical'); return s; }
      s.stress.reopen_resolution={selected_targets:clone(event.selected_targets??[]),procedure:event.procedure,at:event.at??null};
      return s;
    }
    default: {
      if(event.type==='AUTHORIZE' && !s.stress.provenance_verified){ finding(s,STRESS.STRATEGIC_MISREPRESENTATION,'authorization attempted before provenance verification','critical'); return s; }
      if(event.type==='REOPEN'){
        const competing=s.stress.findings.some(f=>f.code===STRESS.COMPETING_REOPEN);
        if(competing && !s.stress.reopen_resolution){ finding(s,STRESS.COMPETING_REOPEN,'REOPEN attempted before competing triggers resolved','critical'); return s; }
      }
      const next=reduceCrossing(s,event);
      const out=createStressStatePreserving(next,s.stress);
      if(event.type==='REOPEN' && event.broad===true){
        const op=out.operators.at(-1);
        if(op?.operator==='OP-REOPEN' && op.broad!==true) finding(out,STRESS.BROAD_REOPEN_AUDIT_GAP,'baseline OP-REOPEN omits broad flag from operator audit record','medium');
      }
      return out;
    }
  }
}

function createStressStatePreserving(base,stress){ return {...base,stress:clone(stress)}; }

export function stressSummary(s){
  const by={}; for(const f of s.stress.findings) by[f.code]=(by[f.code]??0)+1;
  return {finding_count:s.stress.findings.length,by_code:by,findings:clone(s.stress.findings)};
}
