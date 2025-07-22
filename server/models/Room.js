class Room{
    players={};
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
    //player joining if not already in
    addPlayer(socketid, name){
        if(!this.players[socketid]){
            this.players[socketid]=name;
            this.points[socketid]=0;
            this.pointsThisRd[socketid]=0;
            if(!this.host) this.host=socketid;
            return true;
        }
        //for debugging
        console.log(Object.keys(this.players).length);
        return false;
    }
   
    //returns hsot id
    getHostID(){
        return this.host;
    }
    //returns room id
    getRoomID(){
        return this.roomID;
    }
    //returns current state of canvas
    getLines(){
        return this.lines;
    }
    //update lines
    setLines(lastLine){
        this.lines.push(lastLine);
    }
    //clear
    clearLines(){
        this.lines=[];
    }
    //remove player and delete room if empty
    deletePlayer(socketid){
        delete this.players[socketid];
        delete this.points[socketid];
        delete this.pointsThisRd[socketid];
        return Object.keys(this.players).length === 0;
    }
    //check if members enough to start game
    checkSufficientMembers(){
        return  Object.keys(this.players).length === this.maxPlayers;
    }
    //return drawerr index
    getDrawerIndex(){
        return this.drawerIndex;
    } 
    //return drawer socket id
     getDrawerID(){
        const playerIDs = Object.keys(this.players);
        return playerIDs[this.drawerIndex];
    }
    //sets word, starts timer
    roundStart(word){
        this.currentWord=word;
        this.startTime=Date.now();
        const drawerID = this.getDrawerID();
        return [drawerID, this.timer];
    }
    //number of people who guessed successfully
    getGuessed(){
        return this.guessed;
    }
    //update drawer points after round end
    handleRoundEnd(points){
        const drawerID= this.getDrawerID();
        this.points[drawerID]+=points;
        this.pointsThisRd[drawerID]+=points;
        return [this.points, this.pointsThisRd];
    }
    //update params for next round
    prepareNextRound(){
        this.round++;
        this.drawerIndex= (this.drawerIndex+1) % Object.keys(this.players).length;
        this.lines=[];
        this.guessed=0;
        for (let key in this.pointsThisRd) this.pointsThisRd[key] = 0;
        if(this.round>= this.numRounds){
            this.round=0;
            this.drawerIndex=0;
            this.currentWord=null;
            for (let key in this.points) this.points[key] = 0; 
        }
    
    }
    //return defined timer
    checkRounds(){
        return this.round+1 >= this.numRounds;
    }

    getTimer(){
        return this.timer;
    }
    //checks if user guess correct and allots points accirdingly
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
    getPlayers(){
        return this.players;
    }
}

module.exports= Room;
