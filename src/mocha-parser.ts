import * as esprima from 'esprima';
import { describe } from 'mocha';
import { extractAllNodes, extractName, debuggableNodeFromToken, getParents, RangedToken, retrieveDebuggableTokens } from './esprima-util';
import { isValidTS, jsFromTs } from './is-valid-ts';
import { getRegExpForMatchingAllWords } from './text-treatment-util';
import { stripIntoEsprimableJS } from './ts-stripper';

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
    regexp: RegExp
}

export class MochaParser {
    public static extractNodes(script: string): Debuggable[] {
        if (!isValidTS(script)) {
            return [];
        }

        let tokens = (esprima.tokenize(script, { loc: true, range: true, 
            tolerant: true }) as RangedToken[]);

        let { describeTokens, itTokens} = retrieveDebuggableTokens(script, tokens);

        //Now we need their respective regions... as nodes !
        let describeNodes = describeTokens.map(t=>debuggableNodeFromToken(t, script, tokens));
        let itNodes = itTokens.map(t=>debuggableNodeFromToken(t, script, tokens));

        describeNodes = describeNodes.filter(n=>n!==null);
        itNodes = itNodes.filter(n=>n!==null);


        let mochaNodes = [...itNodes, ...describeNodes];

        let res: Debuggable[] = [];

        itNodes.forEach(n => {
            let d = {
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
                regexp: getRegExpForMatchingAllWords(
                    getParents(n, mochaNodes).map(m => extractName(m, tokens))),
                scriptSubstr: script.substring(n.range[0], n.range[1])
            }
            res.push(d);
        });

        describeNodes.forEach(n => {
            let d = {
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
                regexp: getRegExpForMatchingAllWords(
                    getParents(n, mochaNodes).map(m => extractName(m, tokens))),
                    scriptSubstr: script.substring(n.range[0], n.range[1])

            }
            res.push(d);
        });
        //TODO comment this - DEBUG ONLY
        //res.forEach(r=>console.log(r.regexp));
        return res;
    }
}