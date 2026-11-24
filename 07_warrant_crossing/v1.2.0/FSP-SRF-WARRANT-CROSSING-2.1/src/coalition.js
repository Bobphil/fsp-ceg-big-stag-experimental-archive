const clone=x=>structuredClone(x);
export function createCoalition(id,members=[],governance={}){
 return {coalition_id:id,members:clone(members),governance:{delegations:clone(governance.delegations??[]),procedure:governance.procedure??'member-self-update'},history:[{type:'formed',members:members.map(m=>m.locus)}],failures:[]};
}
function mayChange(c,actor,target){if(actor===target)return true;return c.governance.delegations.some(d=>d.from===target&&d.to===actor&&d.scope==='action-support'&&d.active!==false);}
export function recomputeCoalition(c0,update){
 const c=clone(c0),actor=update.actor_locus;
 if(!actor){c.failures.push({code:'WC-F15',detail:'coalition update missing actor identity'});return c;}
 if(update.withdraw_locus){if(!mayChange(c,actor,update.withdraw_locus)){c.failures.push({code:'WC-F15',detail:`${actor} attempted unauthorized withdrawal of ${update.withdraw_locus}`});return c;}c.members=c.members.map(m=>m.locus===update.withdraw_locus?{...m,active:false,withdraw_reason:update.reason}:m);c.history.push({type:'withdraw',actor,locus:update.withdraw_locus,reason:update.reason});}
 if(update.new_action_support){for(const [target,action] of Object.entries(update.new_action_support)){if(!mayChange(c,actor,target)){c.failures.push({code:'WC-F15',detail:`${actor} attempted unauthorized support change for ${target}`});continue;}const m=c.members.find(x=>x.locus===target);if(m){m.action=action;m.active=true;}}c.history.push({type:'recomposition',actor,support:clone(update.new_action_support)});}
 return c;
}
export function activeSupport(c){return c.members.filter(m=>m.active!==false);}
