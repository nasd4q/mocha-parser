import { extractAllNodes, retrieveDebuggableTokens } from '../src/esprima-util';
import { sample1, sample2 } from "../_examples-files/aux";
import * as esprima from "esprima";

let script: string;

sample1()
    .then(scr => {
        script = scr;
    })
    .then(() => {
        let root = esprima.parseScript(script,{loc:true, range: true});
        let tokens = esprima.tokenize(script, {loc: true, range: true});
        let { describeTokens, itTokens } = retrieveDebuggableTokens(script);
        let nodes = extractAllNodes(root);
        //
    })

