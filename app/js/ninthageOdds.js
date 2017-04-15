
var app = angular.module('ninthageOdds',['chart.js']);

app.controller('ninthageCtrl', function() {
    this.showFull=false;
    this.showInput=false;
    this.clickedButton=false;
    
    this.volley=false;
    this.randomAttacks=false;
    this.randomWounds=false;

    this.toHitScoreRequired=4;
    this.toHitReroll=false;
    this.strength=3;
    this.toWoundReroll=false;
    this.modelsAttacking=1;
    this.attacksPerModelNumberOfDice=0;
    this.attacksPerModelDice='0';
    this.attacksPerModelConstant=10;
    this.volleyMult=1;
    this.armorPiercing=0;
    this.woundsPerAttackNumberOfDice=0;
    this.woundsPerAttackDice='0';
    this.woundsPerAttackConstant=1;
    this.lethalStrike=false;
    this.poison=false;
    this.holy=false;
    this.modelsDefending=1;
    this.woundsPerModel=1;
    this.toughness=3;
    this.armor='7';
    this.armorReroll=false;
    this.ward='7';
    this.wardReroll=false;
    this.regen='7';
    this.regenReroll=false;
    this.bornPredator=false;


    this.attackChance=0;
    this.temp=0;


    this.hitResult = function (){
        result= {hit:0,poisoned:0};
        if (this.toHitScoreRequired<=6){
            if (!this.poison){
                result.hit+=(1/6)*(7-this.toHitScoreRequired);
            }
            else {
                result.hit+=(1/6)*(7-this.toHitScoreRequired-1);
                result.poisoned+=1/6;
            };
            if (this.toHitReroll) {
                if (!this.poison) {
                    result.hit += (1 - result.hit) * result.hit;
                }
                else {
                    result.hit += (1 - result.hit) * (result.hit - 1 / 6);
                    result.poisoned += (1 - result.hit) * (1 / 6);
                };
            }
            else {};
            }
        else{
            var temp=this.toHitScoreRequired-3;
            result.hit=(1/6*((7-temp)*1/6));
            if (this.toHitReroll) {result.hit+=5/6*result.hit};
        }


        return result;
    };

    this.woundResult = function (hitResult) {
        var result = {wound:hitResult.poisoned,lethalStruck:0};
        var temp=this.strength-this.toughness;
        if (temp>=2) {
            var scoreToWound=2;
        }
        else if(temp<=-2) {
            var scoreToWound=6;
        }
        else {
            var scoreToWound=4-temp;
        }


        if (!this.lethalStrike){
            result.wound += hitResult.hit*(7-scoreToWound)*1/6;
            if (this.toWoundReroll){
                result.wound += (hitResult.hit - hitResult.hit*(7-scoreToWound)*1/6)*(7-scoreToWound)*1/6;
            }
        }
        else {
            result.wound += hitResult.hit*(7-scoreToWound-1)*1/6;
            result.lethalStruck += hitResult.hit*1/6;
            if (this.toWoundReroll){
                result.wound += (hitResult.hit - hitResult.hit*(7-scoreToWound)*1/6)*(7-scoreToWound-1)*1/6;
                result.lethalStruck += (hitResult.hit - hitResult.hit*(7-scoreToWound)*1/6)*1/6;
            }
        }
        return result;
    };

    this.armorResult = function(woundResult){
        var savemod = Math.max(0,this.strength - 3);
        savemod+=this.armorPiercing;
        var scoreToSave = Math.max(Math.min(Number(this.armor)+savemod,7),2);
        var result = {notSaved:0, lethalStruck:woundResult.lethalStruck};
        if (!this.armorReroll) {
            result.notSaved +=woundResult.wound*(scoreToSave-1)*1/6;
        }
        else {
            var saved = woundResult.wound*(7-scoreToSave)*1/6 + woundResult.wound*(scoreToSave-1)*1/6*(7-scoreToSave)*1/6;
            result.notSaved+=woundResult.wound - saved;
        };
        return(result);
    };
    
    this.save2Result = function (armorResult) {
        var wardChance = (7-this.ward)*1/6;
        if (this.holy && !this.wardReroll) {
            wardChance *= wardChance;
        }
        else if (!this.holy && this.wardReroll) {
            wardChance +=(1-wardChance)*wardChance;
        };
        var regenChance = (7-this.regen)*1/6;
        if (this.regenReroll) {
            regenChance +=(1-regenChance)*regenChance;
        };
        var result={notSaved:0};
        result.notSaved+=armorResult.lethalStruck*(1-wardChance);
        result.notSaved+=armorResult.notSaved*(1-Math.max(wardChance,regenChance));
        return(result);
    };


    this.getAttackChance = function(){
        /*console.log('Hit result:');
        console.log(this.hitResult());
        console.log ('Wound result:');
        console.log(this.woundResult(this.hitResult()));
        console.log ('Armor result:');
        console.log(this.armorResult(this.woundResult(this.hitResult())));
        console.log ('Save result:');
        console.log(this.save2Result(this.armorResult(this.woundResult(this.hitResult()))));*/
        return(this.save2Result(this.armorResult(this.woundResult(this.hitResult()))).notSaved);
    };

    this.assignAttackChance = function(){
        this.attackChance=this.save2Result(this.armorResult(this.woundResult(this.hitResult()))).notSaved;
    };

    this.getAverage = function() {
        return this.attackChance*this.modelsAttacking*this.attacksPerModelConstant;
    }

    this.getVariance = function(spread) {
        var variance=0;
        for (i in spread) {
            variance+=spread[i]*Math.pow((this.average-i),2);
        }
        return variance;
    }

    this.getGraph1=function(spread){
        this.graph1={};
        this.graph1.data = [];
        this.graph1.labels = [];
        this.graph1.colors=[];
        var value=0;
        for (i in spread){
            value=spread[i];
            if (value<0.0001){
                continue;
            } else if ((i<this.average-this.deviation*2) || (i>this.average+this.deviation*2)){
                this.graph1.labels.push(i);
                this.graph1.data.push(+(value*100).toFixed(2));
                this.graph1.colors.push('#f7464a');
            } else if ((i<this.average-this.deviation) || (i>this.average+this.deviation)){
                this.graph1.labels.push(i);
                this.graph1.data.push(+(value*100).toFixed(2));
                this.graph1.colors.push('#FDB45C');
            } else if ((i>this.average-this.deviation) || (i<this.average+this.deviation)){
                this.graph1.labels.push(i);
                this.graph1.data.push(+(value*100).toFixed(2));
                this.graph1.colors.push('#54c145');
            }

        }
        this.graph1.options={
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true,
                        callback: function(value) { return  (value + '%'); }
                    },
                    scaleLabel: {
                        labelString: 'probability'
                    }
                }],
                xAxes: [{
                    barPercentage:1.0,
                    categoryPercentage:1.0,
                    labelString: 'successes'
                }],
            }

        };
    return 1;

    };

    this.getGraph2=function(spread) {
        this.graph2={};
        this.graph2.data = [];
        this.graph2.labels = [];
        this.graph2.colors=[];
        var value=1;
        var probabilityLeft=1;
        var max=Object.keys(spread).length;
        for (i=0;i<=max;i++){
            if (i==0){
                this.graph2.labels.push(0);
                this.graph2.colors.push('#54c145')
                this.graph2.data.push(+((value)*100).toFixed(2))

            } else{value=value-spread[i-1]};
            if (value<0.998 && value>0.0015){
                this.graph2.labels.push(i);
                this.graph2.data.push(+((value)*100).toFixed(2));
                if (value>=0.75){this.graph2.colors.push('#54c145')}
                else if (value>=0.35){this.graph2.colors.push('#FDB45C')}
                else (this.graph2.colors.push('#f7464a'));
            }
        }




        this.graph2.options={
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true,
                        callback: function(value) { return  (value + '%'); }
                    },
                    scaleLabel: {
                        labelString: 'probability'
                    }
                }],
                xAxes: [{
                    barPercentage:1.0,
                    categoryPercentage:1.0,
                    labelString: 'successes'
                }],
            }

        };
        return 1;

    };





    this.calculate= function (){
        this.assignAttackChance();
        var spread = (bernulliFull(this.attacksPerModelConstant*this.modelsAttacking,this.attackChance));
        //console.log(spread);
        this.average=this.getAverage();
        this.variance=this.getVariance(spread);
        this.deviation=Math.sqrt(this.variance);
        this.clickedButton=true;
        //console.log(this.getChancesByNumbers());
        //console.log(this.generateAllVariants());
       // console.log(this.factorial(7));
       // console.log(this.combinations(3,2));
       // console.log(this.bernulliOne(3,0,this.attackChance));
        this.getGraph1(spread);
        this.getGraph2(spread);




        
        
        



        
    };
    
    
});







combinations = function(n,k){
    return factorial(n)/(factorial(n-k)*factorial(k));
};

bernulliOne = function(n,k,p){
    return combinations(n,k)*Math.pow(p,k)*Math.pow((1-p),n-k);

};

bernulliFull = function(n,p){
    var result={};
    for (i=0;i<=n;i++){
        result[i]=bernulliOne(n,i,p);
    }
    return result;
};

factorial = function() {
    var cache = {},
        fn = function(n) {
            if (n === 0) {
                return 1;
            } else if (cache[n]) {
                return cache[n];
            }
            return cache[n] = n * fn(n -1);
        };
    return fn;
}();
