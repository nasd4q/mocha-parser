import { expect } from "chai";
import { sample5 } from "../_examples-files/aux";
import * as esprima from 'esprima';
import { stripIntoEsprimableJS } from "../src/ts-stripper";
import { jsFromTs } from "../src/is-valid-ts"


describe('stripIntoEsprimableJS', function() {
    it('produces esprimable output on sample5.txt', async ()=>{
        let script = await sample5();

        expect(()=>esprima.parseScript(script, { loc: true, range: true, tolerant: true }))
            .to.throw();

        script =  stripIntoEsprimableJS(script, jsFromTs(script));

        expect(()=>esprima.parseScript(script, { loc: true, range: true, tolerant: true }))
            .to.not.throw();

    })
})