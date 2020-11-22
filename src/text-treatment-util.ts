export function getRegExpForMatchingAllWords(phrases: string[]): RegExp {
    let wordsToMatch: string[] = [];
    phrases.map(p=>extractWords(p)).forEach(words=>wordsToMatch.push(...words));
    let regexpString = '^' + wordsToMatch.map(w=>"(?=.*"+w+")").join('') + '.*$';
    let regexp = new RegExp(regexpString, 'g');
    return regexp;
}

export function extractWords(phrase: string): string[] {
    //replace \n \t by space, then any non word char by space, then any spaces by single space, 
    //and split
    let res = phrase.replace(/\\./g, ' ').replace(/\W/gm, ' ').replace(/\s+/g, ' ').split(' ');
    return res.filter(w=>w.length>3);
}