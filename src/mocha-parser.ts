import * as esprima from 'esprima';
import { extractAllNodes, getParents, retrieveDebuggableTokens } from './esprima-util';

interface location {
    line: number,
    column: number,
}

enum type {
    describeLike = "describe-like", itLike = "it-like"
}

interface Debuggable {
    range: { start: location, end: location },
    /** Example : 'describe', 'it' */
    type: type,
    name: string
}

export class MochaParser {
    public static extractNodes(script: string): Debuggable[] {
        let res: Debuggable[] = [];

        let root = esprima.parseScript(script, { loc: true, range: true, tolerant: true });
        let tokens = esprima.tokenize(script, { loc: true, range: true, tolerant: true });
        let { describeTokens, itTokens } = retrieveDebuggableTokens(script);
        let nodes = extractAllNodes(root);

        let describeNodes = describeTokens.map(t => {
            let candidates = nodes.filter(n => n.range[0] === (t as any).range[0] && n.type === 'CallExpression');
            //TODO remove this check 
            if (candidates.length > 1) {
                throw new Error('this should not happen');
            }
            if (candidates.length === 1) {
                return candidates[0];
            }
            return null;
        }).filter(n => n !== null);

        let itNodes = itTokens.map(t => {
            let candidates = nodes.filter(n => n.range[0] === (t as any).range[0] && n.type === 'CallExpression');
            //TODO remove this check 
            if (candidates.length > 1) {
                throw new Error('this should not happen');
            }
            if (candidates.length === 1) {
                return candidates[0];
            }
            return null;
        }).filter(n => n !== null);

        let mochaNodes = [...itNodes, ...describeNodes];

        itNodes.forEach(n => {
            let d: Debuggable = {
                range: {
                    start: {
                        line: n.loc.start.line,
                        column: n.loc.start.column,
                    },
                    end: {
                        line: n.loc.end.line,
                        column: n.loc.end.column,
                    }
                },
                type: type.itLike,
                //TODO replace `m.arguments[0].value` with more resilient method for extracting name
                //  because currently broker for cases it("testcase #" + i + "etc.", ...)
                name: getParents(n, mochaNodes).reverse().map(m => m.arguments[0].value).join(" ")
            }
            res.push(d);
        });

        describeNodes.forEach(n => {
            let d: Debuggable = {
                range: {
                    start: {
                        line: n.loc.start.line,
                        column: n.loc.start.column,
                    },
                    end: {
                        line: n.loc.end.line,
                        column: n.loc.end.column,
                    }
                },
                type: type.describeLike,
                //TODO replace `m.arguments[0].value` with more resilient method for extracting name
                //  because currently broker for cases it("testcase #" + i + "etc.", ...)
                name: getParents(n, mochaNodes).reverse().map(m => m.arguments[0].value).join(" ")
            }
            res.push(d);
        });
        return res;
    }
}