import { STRESS } from './stress.js';

const clone=x=>structuredClone(x);

export function createGovernedCoalition(id,members=[],governance={}){
  return {
    coalition_id:id,
    members:clone(members),
    governance:{delegations:clone(governance.delegations??[]),procedure:governance.procedure??'member-self-update'},
    history:[{type:'formed',members:members.map(m=>m.locus)}],
    findings:[]
  };
}
function mayChange(c,actor,target){
  if(actor===target) return true;
  return c.governance.delegations.some(d=>d.from===target && d.to===actor && d.scope==='action-support' && d.active!==false);
}
export function governedRecompute(c0,update){
  const c=clone(c0); const actor=update.actor_locus;
  if(!actor){ c.findings.push({code:STRESS.COALITION_CAPTURE,detail:'coalition update missing actor identity',severity:'critical'}); return c; }
  if(update.withdraw_locus){
    if(!mayChange(c,actor,update.withdraw_locus)){ c.findings.push({code:STRESS.COALITION_CAPTURE,detail:`${actor} attempted unauthorized withdrawal of ${update.withdraw_locus}`,severity:'critical'}); return c; }
    c.members=c.members.map(m=>m.locus===update.withdraw_locus?{...m,active:false,withdraw_reason:update.reason}:m);
    c.history.push({type:'withdraw',actor,locus:update.withdraw_locus,reason:update.reason});
  }
  if(update.new_action_support){
    for(const [target,action] of Object.entries(update.new_action_support)){
      if(!mayChange(c,actor,target)){ c.findings.push({code:STRESS.COALITION_CAPTURE,detail:`${actor} attempted unauthorized support change for ${target}`,severity:'critical'}); continue; }
      const m=c.members.find(x=>x.locus===target); if(m){m.action=action;m.active=true;}
    }
    c.history.push({type:'recomposition',actor,support:clone(update.new_action_support)});
  }
  return c;
}
