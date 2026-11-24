import crypto from 'node:crypto';
import { X, X_ORDER, FAILURES } from './constants.js';

const clone=x=>structuredClone(x);
const now=e=>e.at ?? `t${e.seq ?? 0}`;
const rank=x=>X_ORDER.indexOf(x);
function canon(x){ if(Array.isArray(x)) return x.map(canon); if(x&&typeof x==='object') return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])); return x; }
const stable=x=>JSON.stringify(canon(x));
const digest=x=>crypto.createHash('sha256').update(stable(x)).digest('hex');

export function createCrossing(input){
  if(!input?.crossing_id || !input?.task_space_id) throw new Error('crossing_id and task_space_id required');
  if(!input.sender?.locus || !input.receiver?.locus) throw new Error('sender/receiver locus required');
  return {
    crossing_id:input.crossing_id, task_space_id:input.task_space_id,
    sender:{locus:input.sender.locus,model_version:input.sender.model_version??'unknown',type:input.sender.type??'person'},
    receiver:{locus:input.receiver.locus,model_version:input.receiver.model_version??'unknown',type:input.receiver.type??'person'},
    modeled_frame_boundary:true,
    toulmin:{grounds:clone(input.toulmin?.grounds??[]),claim:input.toulmin?.claim??null,warrant:clone(input.toulmin?.warrant??null),backing:clone(input.toulmin?.backing??[]),qualifier:input.toulmin?.qualifier??'unstated',rebuttals:clone(input.toulmin?.rebuttals??[]),field_status:clone(input.toulmin?.field_status??{})},
    provenance:clone(input.provenance??[]),
    provenance_status:{verified:false,verified_at:null,method:null,reason:null},
    warrant_commitment:null,
    x_state:X.X0,
    passed:{X0:true,X1:false,X2:false,X3:false,X4:false,X5:false,X6:false,X7:false},
    x_history:[{state:X.X0,at:'t0',reason:'presented'}],
    stops:[],operators:[],translations:[],alternative_warrants:[],
    standing:{state:'unknown',claims:[],resolution:null,basis:null,affected_party_absence:false},
    authorization:{state:'pending',procedure:null,scope:null,dissent:[],limits:[]},
    preserved_residue:[], residue_registry:clone(input.preserved_residue??[]),
    action_record:null, consequence_records:[], return_status:'none', reopen_targets:[],
    reopen_triggers:[], reopen_resolution:null,
    closed:false, failures:[],
    claim_ceiling:input.claim_ceiling??'Presented only; no agreement, truth, standing, authorization, or action inferred.'
  };
}
function pushHistory(s,state,event,reason){s.x_history.push({state,at:now(event),reason:reason??event.reason??null});}
function pass(s,state,event,reason){s.passed[state]=true;if(rank(state)>rank(s.x_state))s.x_state=state;pushHistory(s,state,event,reason);}
function stop(s,state,event,reason){const code=`STOP-${state}`;s.stops.push({code,at:now(event),reason:reason??event.reason??null});pushHistory(s,code,event,reason);}
function addFailure(s,code,detail){if(!s.failures.some(f=>f.code===code&&f.detail===detail))s.failures.push({code,detail});}
function addOperator(s,operator,event,detail={}){s.operators.push({operator,at:now(event),...clone(detail)});}
function warrantPayload(s){return {sender:s.sender,task_space_id:s.task_space_id,toulmin:s.toulmin,provenance:s.provenance};}
function validAlt(w){return !!(w?.id && w?.text?.trim().length>=12 && w?.claim_link && w?.scope && w?.qualifier && Array.isArray(w?.support) && w.support.length && w.support.every(x=>x&&typeof x==='object'&&x.source&&x.type));}
function standingConflict(claims){const vals=new Set(claims.map(c=>c.pass));return vals.size>1;}
function reopenConflict(triggers){const groups=new Map();for(const t of triggers){if(!t.incompatibility_group)continue;if(!groups.has(t.incompatibility_group))groups.set(t.incompatibility_group,new Set());groups.get(t.incompatibility_group).add(t.target);}return [...groups.values()].some(s=>s.size>1);}

export function reduceCrossing(state,event){
 const s=clone(state);
 switch(event.type){
  case 'CONTEXTUALIZE': addOperator(s,'OP-CTX',event,{context:event.context}); break;
  case 'EXPOSE': addOperator(s,'OP-EXP',event,{detail:event.detail}); break;
  case 'TRANSLATE': addOperator(s,'OP-TR',event,{from:event.from,to:event.to,loss:event.loss??[],mapping:event.mapping??null}); s.translations.push({from:event.from,to:event.to,loss:clone(event.loss??[]),mapping:event.mapping??null,at:now(event)}); if(!event.mapping||event.loss===undefined)addFailure(s,FAILURES.F08,'translation lacks mapping or loss record'); break;
  case 'QUALIFY': addOperator(s,'OP-QUAL',event,{from:s.toulmin.qualifier,to:event.qualifier,justification:event.justification??null}); if(event.strengthens&&!event.justification)addFailure(s,FAILURES.F09,'qualifier strengthened without explicit justification'); s.toulmin.qualifier=event.qualifier; break;
  case 'SPLIT': addOperator(s,'OP-SPLIT',event,{components:event.components??[]}); break;
  case 'ATTEST_WARRANT': s.warrant_commitment={sha256:digest(warrantPayload(s)),at:now(event)}; break;
  case 'CHECK_WARRANT_COMMITMENT': if(!s.warrant_commitment||s.warrant_commitment.sha256!==digest(warrantPayload(s)))addFailure(s,FAILURES.F14,'warrant/provenance changed after attestation'); break;
  case 'VERIFY_PROVENANCE': s.provenance_status={verified:event.pass===true,verified_at:now(event),method:event.method??null,reason:event.reason??null}; if(!event.pass)addFailure(s,FAILURES.F14,event.reason??'provenance could not be verified'); break;
  case 'INTELLIGIBLE': event.pass?pass(s,X.X1,event,event.reason??'receiver can reconstruct claim and intended support'):stop(s,X.X1,event,event.reason??'not intelligible'); break;
  case 'EVIDENCE_RECEIVABLE': if(!s.passed.X1)throw new Error('X2 requires X1'); event.pass?pass(s,X.X2,event,event.reason??'grounds admissible/relevant for consideration'):stop(s,X.X2,event,event.reason??'evidence not receivable'); break;
  case 'WARRANT_LICENSE': if(!s.passed.X2)throw new Error('X3 requires X2'); event.pass?pass(s,X.X3,event,event.reason??'receiver licenses G→C at qualifier/scope'):stop(s,X.X3,event,event.reason??'receiver does not license warrant'); break;
  case 'ADD_ALTERNATIVE_WARRANT': {
    addOperator(s,'OP-ALT',event,{warrant_id:event.warrant?.id??null}); const w=clone(event.warrant??{});
    if(!validAlt(w)){w.status='rejected';addFailure(s,FAILURES.F12,'alternative warrant underspecified or lacks typed receiver-side support');s.alternative_warrants.push(w);break;}
    w.status='supported';s.alternative_warrants.push(w);break;
  }
  case 'ACTION_COMPATIBLE': if(!s.passed.X2)throw new Error('X4 requires at least X2'); {const supportedAlt=s.alternative_warrants.some(w=>w.status==='supported'); if(event.pass&&!s.passed.X3&&!supportedAlt)throw new Error('X4 without X3 requires supported OP-ALT'); event.pass?pass(s,X.X4,event,event.reason??'bounded action compatible'):stop(s,X.X4,event,event.reason??'no action-compatible bridge');} break;
  case 'SET_STANDING_CLAIM': {
    const claim={source:event.source??null,locus:event.locus??s.receiver.locus,pass:!!event.pass,basis:event.basis??null,affected_party_absence:!!event.affected_party_absence,at:now(event)};s.standing.claims.push(claim);addOperator(s,'OP-STAND',event,{kind:'claim',...claim});
    if(standingConflict(s.standing.claims)){s.standing.state='contested';s.standing.basis=null;addFailure(s,FAILURES.F13,'conflicting standing claims require governed resolution');stop(s,X.X5,event,'standing contested');}
    else {s.standing.state=claim.pass?'qualified':'failed';s.standing.basis=claim.basis;s.standing.affected_party_absence=claim.affected_party_absence;if(claim.pass)pass(s,X.X5,event,event.reason??'standing qualified by uncontested claim');else stop(s,X.X5,event,event.reason??'standing failed');}
    break;
  }
  case 'SET_STANDING': return reduceCrossing(s,{...event,type:'SET_STANDING_CLAIM',source:event.source??'direct'});
  case 'RESOLVE_STANDING': {
    if(!event.valid_procedure||!event.resolver_basis){addFailure(s,FAILURES.F13,'standing resolution lacks valid procedure/resolver basis');stop(s,X.X5,event,'invalid standing resolution');break;}
    s.standing.resolution={procedure:event.procedure??null,resolver_basis:event.resolver_basis,pass:!!event.pass,basis:event.basis??event.resolver_basis,at:now(event)};s.standing.state=event.pass?'qualified':'failed';s.standing.basis=event.basis??event.resolver_basis;s.standing.affected_party_absence=!!event.affected_party_absence;addOperator(s,'OP-STAND',event,{kind:'resolution',procedure:event.procedure,resolver_basis:event.resolver_basis});
    event.pass?pass(s,X.X5,event,event.reason??'standing conflict resolved as qualified'):stop(s,X.X5,event,event.reason??'standing conflict resolved as failed');break;
  }
  case 'AUTHORIZE': {
    addOperator(s,'OP-AUTH',event,{procedure:event.procedure,scope:event.scope});
    if(!s.provenance_status.verified){addFailure(s,FAILURES.F14,'authorization attempted before provenance verification');stop(s,X.X6,event,'authorization blocked by unverified provenance');break;}
    if(s.warrant_commitment && s.warrant_commitment.sha256!==digest(warrantPayload(s))){addFailure(s,FAILURES.F14,'authorization blocked because committed warrant/provenance changed');stop(s,X.X6,event,'authorization blocked by commitment mismatch');break;}
    if(!s.passed.X5||s.standing.state!=='qualified'){addFailure(s,FAILURES.F05,'authorization attempted without current qualified standing');stop(s,X.X6,event,'authorization blocked by standing');break;}
    if(!event.valid_procedure){s.authorization={state:'failed',procedure:event.procedure??null,scope:event.scope??null,dissent:clone(event.dissent??[]),limits:clone(event.limits??[])};stop(s,X.X6,event,event.reason??'authorization procedure absent/invalid');break;}
    s.authorization={state:'authorized',procedure:event.procedure??null,scope:event.scope??null,dissent:clone(event.dissent??[]),limits:clone(event.limits??[])};pass(s,X.X6,event,event.reason??'authorized by valid procedure');break;
  }
  case 'PRESERVE_RESIDUE': {
    addOperator(s,'OP-RES',event,{count:(event.items??[]).length});
    for(const raw of event.items??[]){const item=clone(raw);s.residue_registry.push(item);const typed=item.id&&item.version&&item.recorded_at&&item.status;if(!typed){addFailure(s,FAILURES.F16,`residue ${item.id??'unknown'} lacks version/freshness metadata`);continue;}if(item.status!=='current'){addFailure(s,FAILURES.F16,`residue ${item.id} is ${item.status}`);continue;}s.preserved_residue.push(item);}break;
  }
  case 'RECORD_ACTION': if(!s.passed.X6)throw new Error('action requires X6 authorization'); s.action_record={id:event.action_id??'action',scope:event.scope??s.authorization.scope,actors:clone(event.actors??[]),at:now(event)}; break;
  case 'RECORD_CONSEQUENCE': if(!s.action_record)throw new Error('consequence requires action record'); s.consequence_records.push({id:event.id??`c${s.consequence_records.length+1}`,description:event.description,source:event.source??null,matches_rebuttal:!!event.matches_rebuttal,at:now(event)}); break;
  case 'RETURN_DETECTED': addOperator(s,'OP-RET',event,{target:event.target??null}); s.return_status='detected'; break;
  case 'RETURN_ROUTED': if(!['detected','routed'].includes(s.return_status))throw new Error('route requires detected Return'); s.return_status='routed'; if(event.target)s.reopen_targets.push(event.target); break;
  case 'RETURN_RECEIVED': if(s.return_status!=='routed')throw new Error('receive requires routed Return'); s.return_status='received'; break;
  case 'RETURN_UPTAKE': if(s.return_status!=='received')throw new Error('uptake requires received Return'); s.return_status='uptake'; break;
  case 'ADD_REOPEN_TRIGGER': s.reopen_triggers.push({id:event.id,target:event.target,priority:event.priority??'normal',requested_scope:event.requested_scope??'selective',incompatibility_group:event.incompatibility_group??null,standing_basis:event.standing_basis??null,at:now(event)}); if(reopenConflict(s.reopen_triggers))addFailure(s,FAILURES.F17,'incompatible REOPEN targets require arbitration'); break;
  case 'RESOLVE_REOPEN': if(!event.valid_procedure){addFailure(s,FAILURES.F17,'REOPEN arbitration lacks valid procedure');break;} s.reopen_resolution={selected_targets:clone(event.selected_targets??[]),procedure:event.procedure??null,resolver_basis:event.resolver_basis??null,at:now(event)}; break;
  case 'REOPEN': {
    if(!['uptake','detected','routed','received'].includes(s.return_status))throw new Error('REOPEN requires Return signal');
    const conflict=reopenConflict(s.reopen_triggers); if(conflict&&!s.reopen_resolution){addFailure(s,FAILURES.F17,'REOPEN blocked pending trigger arbitration');break;}
    const requested=clone(event.targets??[]); if(s.reopen_resolution?.selected_targets?.length){const allowed=new Set(s.reopen_resolution.selected_targets);if(requested.some(t=>!allowed.has(t))){addFailure(s,FAILURES.F17,'REOPEN target outside arbitrated scope');break;}}
    if(event.broad&&!(event.dependency_evidence?.length)){addFailure(s,FAILURES.F18,'broad REOPEN lacks dependency evidence');break;}
    addOperator(s,'OP-REOPEN',event,{targets:requested,broad:!!event.broad,dependency_evidence:clone(event.dependency_evidence??[]),arbitration:clone(s.reopen_resolution)});s.return_status='reopened';s.reopen_targets=[...new Set([...(s.reopen_targets??[]),...requested])];break;
  }
  case 'TERMINATE_REVIEW': s.closed=true;s.return_status='terminated';break;
  case 'FINALIZE_X7': {const currentResidue=s.preserved_residue.filter(r=>r.status==='current');const residueOkay=currentResidue.length>0||event.no_residue_required===true;const provOkay=s.provenance.length>0&&s.provenance_status.verified&&s.toulmin.grounds.every(g=>g.source||g.id);if(!residueOkay||!provOkay){stop(s,X.X7,event,'current residue / verified provenance not preservable');break;}pass(s,X.X7,event,event.reason??'current warrant topology, alternatives, verified provenance, and consequences retained');break;}
  default: throw new Error(`unknown event ${event.type}`);
 }
 return s;
}
export function runEvents(initial,events){return events.reduce(reduceCrossing,initial);}
