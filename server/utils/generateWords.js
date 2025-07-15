const wordList= require('../words');

const generateWords = () =>{
    return wordList.sort(() => 0.5 - Math.random()).slice(0, 3);
}

module.exports= generateWords;