import { match } from 'assert';
import * as esprima from 'esprima';
import { areSameToken, eraseToken, parityFilter } from './esprima-util';

export function stripIntoEsprimableJS(script: string, js: string): string {

    /*TODO : change method : 
        1. retrieve debuggable tokens.
        2. for each dtoken find its block (expand until it is valid ts)
        3. isolate block and transpile
        4. compare compilation result with original and arrange


    */
    let tokens = esprima.tokenize(script, { loc: true, range: true, tolerant: true });
    let jsTokens = esprima.tokenize(js, { loc: true, range: true, tolerant: true });
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
        let matchingTokenAndIndex = tokens
            .map((t, i) => {
                return { token: t, index: i };
            }).filter(o => {
                let t: any = o.token;
                return t.range[0] <= err.index && t.range[1] > err.index;
            })[0];
        matchingTokenAndIndex.token

        let previousIdentifiers = tokens.filter((t, i) => i < matchingTokenAndIndex.index)
            .filter(t => t.type === 'Identifier');
        let nextIdentifiers = tokens.filter((t, i) => i > matchingTokenAndIndex.index)
            .filter(t => t.type === 'Identifier');
        //console.log('here');


        let sourceIdentifiers = tokens
            .map((token, index) => { return { token, index }; })
            .filter(t => t.token.type === 'Identifier');
        let targetIdentifiers = jsTokens
            .map((token, index) => { return { token, index }; })
            .filter(t => t.token.type === 'Identifier');

        let matches: {targetI: number, sourceI:number[]}[] = targetIdentifiers.map(o => {
            let matches: number[] = [];
            sourceIdentifiers.forEach(o2 => {
                if (areSameToken(o.token, o2.token)) {
                    matches.push(o2.index);
                }
            });
            return {targetI: o.index, sourceI: matches};
        });

        function updateMatches(matches: {targetI: number, sourceI:number[]}[]) {
            matches = matches.map(m=>{
                return {
                    targetI : m.targetI,
                    sourceI : m.sourceI,
                    targetToken : jsTokens[m.targetI],
                    sourceTokens : m.sourceI.map(i=>
                        tokens[i])
                }
            })
            return matches;
        }

        matches = updateMatches(matches);


        let min = 0;
        for (var i = 0; i < matches.length; i++) {
            let currentPossibilities = matches[i].sourceI;
            matches[i].sourceI = currentPossibilities.filter(n => n >= min);
            if (matches[i].sourceI.length > 0) {
                min = matches[i].sourceI.sort((a, b) => a - b)[0] + 1;
            }
        }

        matches = updateMatches(matches);


        let max = 9999999999;
        for (var i = matches.length - 1; i > -1; i--) {
            let currentPossibilities = matches[i].sourceI;
            matches[i].sourceI = currentPossibilities.filter(n => n <= max);
            if (matches[i].sourceI.length > 0) {
                max = matches[i].sourceI.sort((a, b) => b - a)[0] - 1;
            }
        }

        matches = updateMatches(matches);

        let keptIdentifiers = sourceIdentifiers.filter(obj=>{
            return matches.some(match=>{
                return match.sourceI.length === 1 && match.sourceI[0] === obj.index;
            })
        })

        let identifiersBefore = keptIdentifiers
            .filter((o, i) => o.index < matchingTokenAndIndex.index);
        let minIndexOfSourceTokens = identifiersBefore?.[identifiersBefore.length - 1]?.index ?? 0;
        let identifiersAfter = keptIdentifiers
        .filter((o, i) => o.index > matchingTokenAndIndex.index);
        let maxIndexOfSourceTokens = identifiersAfter?.[0]?.index ?? keptIdentifiers[keptIdentifiers.length -1].index;

        let sourceTokens = tokens.filter((t,i)=> i>= minIndexOfSourceTokens && i <= maxIndexOfSourceTokens);

        let targetIdentifierBeforeI = matches
            .filter(o=>
                o.sourceI.includes(minIndexOfSourceTokens))[0].targetI;
        let targetIdentifierAfterI = matches
        .filter(o=>o.sourceI.includes(maxIndexOfSourceTokens))[0].targetI;

        let targetTokens = jsTokens.filter((t,i)=> i>= targetIdentifierBeforeI && i <= targetIdentifierAfterI);

        let toEraseTokens = sourceTokens.filter(st=>{
            return ! targetTokens.some(tt=>areSameToken(tt, st));
        });

        toEraseTokens = parityFilter( toEraseTokens);

        toEraseTokens.forEach(t=>script = eraseToken(script, t));

        //console.log("here");




    }
    return script;
}