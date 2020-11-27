import { expect } from 'chai';
import { sample1, sample2, sample3, sample4, sample5, sample6, sample7 } from '../_examples-files/aux';
import { MochaParser } from '../';
 
 
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
})