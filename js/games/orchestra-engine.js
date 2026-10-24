const PATTERNS=[ [0,1,2,3,2,1,0,2,1,3,2,0], [0,2,1,3,0,1,2,3,3,2,1,0,2,0,3,1], [0,1,0,2,3,2,1,3,0,2,1,0,3,1,2,3,2,1,0,3], [0,2,3,1,0,3,1,2,2,0,1,3,2,1,3,0,3,2,0,1,2,3,1,0], [0,3,1,2,0,2,3,1,2,0,3,2,1,3,0,1,3,2,1,0,2,3,0,2,1,3,2,0] ];
export const SONGS=['Alba di Biscotto','Palme in festa','Passi sulla sabbia','Il coro del mare','La grande orchestra'];
export class OrchestraEngine{
  constructor(stage=1){this.stage=stage;this.time=0;this.notes=PATTERNS[stage-1].map((lane,i)=>({lane,at:3+i*[.95,.8,.7,.6,.5][stage-1],result:null}));this.score=0;this.combo=0;this.hits=0;this.done=false}
  judge(lane){
    if(this.done)return 'Riprova';
    const note=this.notes.filter(n=>n.result===null&&n.lane===lane).sort((a,b)=>Math.abs(a.at-this.time)-Math.abs(b.at-this.time))[0];
    const diff=note?Math.abs(note.at-this.time):Infinity;
    if(diff<=.24){note.result=diff<=.11?'Perfetto':'Bene';this.combo++;this.hits++;this.score+=(diff<=.11?100:60)+this.combo*5;return note.result}
    this.combo=0;return 'Riprova';
  }
  advance(dt){if(this.done)return;this.time+=dt;for(const n of this.notes)if(n.result===null&&this.time>n.at+.24){n.result='Riprova';this.combo=0}this.done=this.notes.every(n=>n.result!==null)&&this.time>this.notes.at(-1).at+.3}
  get passed(){return this.done&&this.hits>=Math.ceil(this.notes.length*.8)}
}
