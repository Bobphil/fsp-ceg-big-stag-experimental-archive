import { createCrossing } from '../src/reducer.js';
export function baseCrossing(overrides={}){
 return createCrossing({
  crossing_id:'K-001', task_space_id:'STS-01',
  sender:{locus:'A',model_version:'A@t1'}, receiver:{locus:'B',model_version:'B@t1'},
  toulmin:{
    grounds:[{id:'G1',source:'record:118'}], claim:'Delay one cycle',
    warrant:{text:'unresolved failure mode justifies temporary delay',status:'stated'},
    backing:['engineering-practice:precaution'], qualifier:'provisional / this cycle',
    rebuttals:['credible evidence failure mode impossible']
  },
  provenance:['record:118','statement:A:17'],
  claim_ceiling:'Presented reason only; no agreement or authorization inferred.',
  ...overrides
 });
}
