/** Use published serving counts; the user requested a labeled one-person estimate when absent. */
export function servingLabel(count?:number):string{
 if(!Number.isInteger(count)||!count||count<1)return 'Estimated serving for 1 person';
 return count===1?'Serving for 1 person':`Serves ${count} people to share`;
}
