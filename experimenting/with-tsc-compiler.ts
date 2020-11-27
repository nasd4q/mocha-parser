import { sample6, sample7 } from '../_examples-files/aux';
import * as tsnode from 'ts-node';


(async function() {
    let r = tsnode.register({transpileOnly : true});
    try {
        let c = r.compile(await sample6(), 
        "whatever",
        0);
    } catch (e) {
        console.log(e);
    }
    
    console.log('here');

    let r2 = tsnode.register({});
    try {
        let c2 = r.compile(await sample7(), 
        'whatever',
        0);
    } catch (e) {
        console.log(e);
    }
    console.log('here');
})();
