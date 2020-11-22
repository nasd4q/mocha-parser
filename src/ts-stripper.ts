import * as esprima from 'esprima';

export function stripIntoEsprimableJS(script: string): string {
    let tokens = esprima.tokenize(script, { loc: true, range: true, tolerant: true });

    let getError = (): boolean => {
        try {
            esprima.parseScript(script, { loc: true, range: true, tolerant: true });
        } catch (err) {
            return err;
        }
        return null;
    }
    let err;
    while (err = getError()) {
        if (err.description=== 'Unexpected token :' || err.description=== 'Unexpected token .') {
            script = script.substring(0,err.index) + " " + script.substring(err.index + 1, script.length)
        }
        if (err.description=== 'Unexpected identifier') {
            let tokenToRemove = tokens.filter((t:any)=>t.range[0]===err.index)[0];
            let spaces = ((tokenToRemove as any).value as string).replace(/./g, ' ');

            script = script.substring(0,err.index) + spaces + script.substring(err.index + spaces.length, script.length)
        }
        if (err.description=== 'Unexpected token ]') {
            if (script.charAt(err.index - 1) === '[') {
                script = script.substring(0,err.index - 1) + "  " + script.substring(err.index + 1, script.length)
            }
        }
    }
    return script;
}