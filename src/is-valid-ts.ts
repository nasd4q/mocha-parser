import * as tsnode from 'ts-node';

export function isValidTS(s: string):boolean {
    let r = tsnode.create({transpileOnly : true});
    try {
        let c = r.compile(s, "whatever",0);
    } catch (e) {
        return false;
    }
    return true;
}

export function jsFromTs(tsScript: string):string {
    tsScript = tsScript.replace(/^import .* from \S.*;.*$/gm, m => ' '.repeat(m.length));
    tsScript = tsScript.replace(/export/g, m => ' '.repeat(m.length));
    tsScript = tsScript.replace(/default/g, m => ' '.repeat(m.length));

    let r = tsnode.create({transpileOnly : true, compilerOptions: { target: "es2020", module: "commonjs", sourceMap: false, inlineSourceMap: false }});
    let js: string;
    try {
        js = r.compile(tsScript, "whatever", 0);
    } catch (e) {
        return null;
    }
    return js;
}