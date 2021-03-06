import { expect } from 'chai';
import { sample1, sample10, sample11, sample2, sample3, sample4, sample5, sample6, sample7, sample8, sample9 } from '../_examples-files/aux';
//TODO test from _out/
import { MochaParser } from '..';
 
describe('Extract nodes', function () {
    this.timeout(0);

    it('Extracts three nodes out of sample1.test.js', async () => {
        let res = MochaParser.extractNodes(await sample1());
        expect(res.length).equals(3);
    })

    it('Extracts three nodes out of sample2.test.js', async () => {
        let res = MochaParser.extractNodes(await sample2());
        expect(res.length).equals(3);
    })
   
    it('Extracts five nodes out of sample3.test.js', async () => {
        let res = MochaParser.extractNodes(await sample3());
        expect(res.length).equals(5);
    })

    it('Extracts four nodes out of sample4.test.js', async () => {
        let res = MochaParser.extractNodes(await sample4());
        expect(res.length).equals(4);
    })

    it('Extracts three nodes out of sample5.txt', async () => {
        let res = MochaParser.extractNodes(await sample5());
        expect(res.length).equals(3);
    })

    it('Extracts two nodes out of sample6.txt', async () => {
        let res = MochaParser.extractNodes(await sample6());
        expect(res.length).equals(2);
    })

    it('Extracts zero nodes out of sample7.txt (not valid ts)', async () => {
        let res = MochaParser.extractNodes(await sample7());
        expect(res.length).equals(0);
    })

    it('Extracts two nodes out of sample8.txt ', async () => {
        let res = MochaParser.extractNodes(await sample8());
        expect(res.length).equals(2);
    })

    it('Extracts two nodes out of sample9.txt ', async () => {
        let res = MochaParser.extractNodes(await sample9());
        expect(res.length).equals(2);
    })

    it('Extracts two nodes out of sample10.txt ', async () => {
        let res = MochaParser.extractNodes(await sample10());
        expect(res.length).equals(2);
    })

    it('Extracts three nodes out of sample11.txt ', async () => {
        let res = MochaParser.extractNodes(await sample11());
        expect(res.length).equals(3);
    })
})