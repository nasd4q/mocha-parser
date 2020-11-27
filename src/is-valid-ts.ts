import * as tsnode from 'ts-node';

export function isValidTS(s: string):boolean {
    let r = tsnode.register({transpileOnly : true});
    try {
        let c = r.compile(s, 
        "whatever",
        0);
    } catch (e) {
        return false;
    }
    return true;
}