export function createCoalition(id, members=[]) {
  return { coalition_id:id, members: structuredClone(members), history:[{type:'formed',members:members.map(m=>m.locus)}] };
}
export function recomputeCoalition(coalition, update) {
  const c=structuredClone(coalition);
  if(update.withdraw_locus){
    c.members=c.members.map(m=>m.locus===update.withdraw_locus?{...m,active:false,withdraw_reason:update.reason}:m);
    c.history.push({type:'withdraw',locus:update.withdraw_locus,reason:update.reason});
  }
  if(update.new_action_support){
    for(const [locus,action] of Object.entries(update.new_action_support)){
      const m=c.members.find(x=>x.locus===locus); if(m){m.action=action; m.active=true;}
    }
    c.history.push({type:'recomposition',support:structuredClone(update.new_action_support)});
  }
  return c;
}
export function activeSupport(coalition){ return coalition.members.filter(m=>m.active!==false); }
