import { FAILURES } from './constants.js';
export function evaluateInvariants(s){
 const out=[],add=(id,pass,detail)=>out.push({id,pass,detail});
 add('I1',s.modeled_frame_boundary===true&&s.sender.type!=='prf-object'&&s.receiver.type!=='prf-object','modeled frame remains typed as model/locus representation');
 const prov=s.toulmin.grounds.every(g=>g.source||g.id)&&s.translations.every(t=>t.mapping&&Array.isArray(t.loss));add('I2',prov,'grounds/translations reconstructable');
 add('I3',['X1','X2','X3','X4','X5','X6'].every(k=>typeof s.passed[k]==='boolean'),'transition states separately represented');
 add('I4',!s.passed.X4||s.passed.X3||s.alternative_warrants.some(w=>w.status==='supported'),'X4 independent path requires supported alternative warrant');
 add('I5',!s.passed.X6||(s.passed.X5&&s.standing.state==='qualified'&&s.authorization.state==='authorized'&&s.provenance_status.verified),'authorization requires current standing and verified provenance');
 add('I6',s.standing.state!=='contested'||s.authorization.state!=='authorized','contested standing cannot authorize');
 add('I7',s.preserved_residue.every(r=>r.status==='current'&&r.id&&r.version&&r.recorded_at),'preserved residue is current and versioned');
 add('I8',!s.failures.some(f=>f.code===FAILURES.F09),'no silent qualifier strengthening');
 add('I9',!s.failures.some(f=>f.code===FAILURES.F08),'translations record mapping and loss');
 add('I10',!s.alternative_warrants.some(w=>w.status==='supported'&&(!w.support||!w.support.length||!w.scope||!w.claim_link||!w.qualifier)),'supported alternative warrants are bounded and evidenced');
 add('I11',s.consequence_records.length===0||!!s.action_record,'consequences trace to action');
 const broad=s.operators.filter(o=>o.operator==='OP-REOPEN'&&o.broad===true);add('I12',broad.every(o=>Array.isArray(o.dependency_evidence)&&o.dependency_evidence.length>0),'broad REOPEN remains explicit and evidenced');
 add('I13',!s.closed||Array.isArray(s.preserved_residue),'closure does not erase alternatives');
 add('I14',true,'coalition multiplicity checked separately');
 add('I15',!s.warrant_commitment||!s.passed.X6||!s.failures.some(f=>f.code===FAILURES.F14),'authorization cannot ignore provenance/commitment failure');
 const conflict=s.reopen_triggers.some(t=>t.incompatibility_group)&&new Set(s.reopen_triggers.filter(t=>t.incompatibility_group).map(t=>`${t.incompatibility_group}:${t.target}`)).size>1;add('I16',!conflict||!!s.reopen_resolution||s.return_status!=='reopened','competing REOPEN triggers require arbitration');
 return out;
}
export function assertInvariants(s){const r=evaluateInvariants(s),f=r.filter(x=>!x.pass);if(f.length){const e=new Error(`Invariant failure: ${f.map(x=>x.id).join(', ')}`);e.results=r;throw e;}return r;}
export function assertCoalitionInvariant(c){const active=c.members.filter(m=>m.active!==false);const distinct=new Set(active.map(m=>m.warrant_id)).size===active.length;const shared=active.length===0||new Set(active.map(m=>m.action)).size===1;const recoverable=active.every(m=>m.warrant&&m.provenance?.length);if(!(distinct&&shared&&recoverable))throw new Error('I14 coalition warrant multiplicity failed');return {id:'I14',pass:true,detail:'shared action preserves distinct recoverable warrants'};}
