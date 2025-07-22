class Room{
    players=[];
    lines=[];
    drawerIndex=0;
    host=null;
    round=0;
    numRounds= 0;
    timer= 0; 
    maxPlayers= 0;
    currentWord=null;
    points= {}; 
    pointsThisRd={};
    guessed= 0; 
    startTime=null;

    constructor(roomID, timer,maxPlayers,numRounds){
        this.roomID=roomID;
        this.timer=timer*1000;
        this.maxPlayers=maxPlayers;
        this.numRounds=numRounds;
    }

    addPlayer(socketid){
        if(!this.players.includes(socketid)){
            this.players.push(socketid);
            this.points[socketid]=0;
            this.pointsThisRd[socketid]=0;
            if(!this.host) this.host=socketid;
            this.points[socketid]=0;
            this.pointsThisRd[socketid]=0;
            return true;
        }
        //for debugging
        console.log(this.players.length);
        return false;
    }
   

    getHostID(){
        return this.host;
    }
    getRoomID(){
        return this.roomID;
    }

    getLines(){
        return this.lines;
    }

    setLines(lastLine){
        this.lines.push(lastLine);
    }

    clearLines(){
        this.lines=[];
    }
    
    deletePlayer(socketid){
        this.players=players.filter(id => id!==socketid)
        delete points[socketid];
        delete pointsThisRd[socketid];
        return this.players.length==0;
    }

    checkSufficientMembers(){
        return this.players.length==this.maxPlayers;
    }

    getDrawerIndex(){
        return this.drawerIndex;
    }
     getDrawerID(){
        return this.players[this.drawerIndex];
    }

    roundStart(word){
        this.currentWord=word;
        this.startTime=Date.now();
        return [this.players[this.drawerIndex], this.timer];
    }

    getGuessed(){
        return this.guessed;
    }

    handleRoundEnd(points){
        const drawerID= this.players[this.drawerIndex];
        this.points[drawerID]+=points;
        this.pointsThisRd[drawerID]+=points;
        return [this.points, this.pointsThisRd];
    }

    prepareNextRound(){
        this.round++;
        this.drawerIndex= (this.drawerIndex+1) % this.players.length;
        this.lines=[];
        this.guessed=0;
        for (let key in this.pointsThisRd) this.pointsThisRd[key] = 0;
        if(this.round>= this.numRounds){
            this.round=0;
            this.drawerIndex=0;
            this.currentWord=null;
            for (let key in this.points) this.points[key] = 0;
            return true;
        }
        return false;
    }

    getTimer(){
        return this.timer;
    }
    checkGuess(msg, socketid){
         // Check for correct guess (case-insensitive)
        if (this.currentWord && msg.trim().toLowerCase() === this.currentWord.trim().toLowerCase()) {
            const timeLeft = Math.max(0, Math.floor((this.timer - (Date.now() - this.startTime)) / 1000));
            const basePoints = 100;
            const bonus = timeLeft * 5;
            this.pointsThisRd[socketid]= basePoints+bonus;
            this.points[socketid] += this.pointsThisRd[socketid];
            this.guessed+=1;
            return [true, this.pointsThisRd];
        }
        return [false,this.pointsThisRd];
    }
}

module.exports= Room;
