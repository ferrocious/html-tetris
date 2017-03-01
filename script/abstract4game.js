var protoBrick = {
    xy: [],
    pos: [5,0],
    myWorld: {},
    
    randomType: function () {
    //returns a random type of block, obvi

            var typeLetters = ["s", "z", "t", "i", "l", "r", "o"],
                rand = Math.floor(Math.random() * typeLetters.length);
            return typeLetters[rand];
    },

    collision: function (newXY, newPos) {
        // checks whether moved/rotated brick would hit something, return true if so
        newXY = newXY || this.xy;
        newPos = newPos || this.pos;
        return this.myWorld.collision(newXY, newPos);
    },
    
    rotate: function () {    
    // rotates the block 90 degrees clockwise; if can't, returns false        
    // first, 90 degrees rotation, simple enough algebra...
        var yx = [];
        for (var i=0; i < this.xy.length; i++) {
            yx.push( [this.xy[i][1], -this.xy[i][0] ]);
        }
    //checks for collision: if there's no room, then it's end of the story, if there is room, then updates the block
        if( this.collision(yx, this.pos) ) return false;        
        this.xy = yx;
        return this;
    },
    
    moveLeft: function () {
        if (this.collision(this.xy, [this.pos[0] - 1, this.pos[1]])) return false;
        this.pos[0]--;
        return this;
    },

    moveRight: function () {
        if (this.collision(this.xy, [this.pos[0] + 1, this.pos[1]])) return false;
        this.pos[0]++;
        return this;
    },
    
    stepDown: function () {
        if (this.collision(this.xy, [this.pos[0], this.pos[1] + 1])) return false;
        this.pos[1] += 1;
        return this;
    },
    
    drop: function() {
        while (this.stepDown());
        return this;
    },
    
    getPos: function() {
        return this.pos.slice();
    },
    
    setPos: function(newPos) {
        this.pos = newPos.slice();
    },
    
    rebase: function(newWorld) {
    this.myWorld = newWorld;
    this.setPos(this.myWorld.startPosition.slice());
    return this;
},
    
    printMe: function() {
// exists for development & debugging purposes only; simple graphic representation out to the console
        var yx = [], x, y, i;
        for (y = 0; y < this.myWorld.depth; y++) {
            yx.push(this.myWorld.rowAt(y));
        }
        for (i = 0; i < this.xy.length; i++) {
            x = this.xy[i][0] + this.pos[0];
            y = this.xy[i][1] + this.pos[1];
            if(yx[y] && yx[y][x]) yx[y][x] = "#";
        }
        for (y = 0; y < yx.length; y++) {
            console.log(y + ": " + yx[y].join(" "));
        }
    },
    
    init: function(well, blockType) {
        this.myWorld = well;
        this.pos = this.myWorld.startPosition;
        blockType = blockType || this.randomType();
        switch (blockType) {
            case "s" : this.xy = [ [ -1, 1 ], [ 0, 1 ],  [ 0,  0 ], [ 1, 0 ] ]; break;            
            case "t" : this.xy = [ [ -1, 1 ], [ 0, 1 ],  [ 1,  1 ], [ 0, 0 ] ]; break;            
            case "z" : this.xy = [ [ -1, 0 ], [ 0, 1 ],  [ 0,  0 ], [ 1, 1 ] ]; break;
            case "o" : this.xy = [ [ -1, 0 ], [ 0, 0 ],  [-1,  1 ], [ 0, 1 ] ]; break;
            case "i" : this.xy = [ [ -2, 0 ], [-1, 0 ],  [ 0,  0 ], [ 1, 0 ] ]; break;
            case "l" : this.xy = [ [ -1, 1 ], [ 0, 1 ],  [ 1,  1 ], [ 1, 0 ] ]; break;
            case "r" : this.xy = [ [ -1, 1 ], [ 0, 1 ],  [-1,  0 ], [ 1, 1 ] ];  
        }
    }
    
}

var protoWell = {

// abstract properties and methods for a well, regardless of the graphic representation
    
    width: 10,
    depth: 20,
    wellArray: [],

    emptyRows: function() {
// inits the array representing the inside of the well; "truish" - empty space, "false" - occupied space
        while (this.wellArray.length < this.depth) {
            var row = new Array(this.width);
            row.fill(1);
            this.wellArray.unshift(row);
        }
    },
  
    isRowFull: function (row) {
// if all the fields in the row are occupied
        var notFull = row.reduce( function (a, b) { return a || b; }, 
                                 false);
        return !notFull;
    },
    
    rowAt: function (y) {
// returns a copy of a single row of the well array
        return this.wellArray[y].slice() || [];
    },
    
    clone: function() {
        var newWell = Object.create(this);
        for (var y = 0; y < this.depth; y++) {
            newWell.wellArray[y] = this.rowAt(y);
        }
        return newWell;
    },
    
    findFullRows: function() {
// finds if there are any full rows. If there are, deletes them and updates the array. Returns the number of deleted rows.
        var counter = 0;
        for (var y = 0; y < this.depth; y ++) {
            if(this.isRowFull(this.wellArray[y])) {
                counter++;
                this.wellArray.splice(y,1);
                this.emptyRows();
            }
        }
        return counter;
    },
        
    update: function(brick) {
// puts the brick inside the well's array
        var i, x, y;
        for (i = 0; i < brick.xy.length; i++) {
            x = brick.xy[i][0] + brick.pos[0];
            y = brick.xy[i][1] + brick.pos[1];
            if( (this.wellArray[y] ) && ( this.wellArray[y][x] ) ) {
                this.wellArray[y][x] = 0;
            }
        }
    },
    
    remove: function(brick) {
// the opposite of 'update'
        var i, x, y;
        for (i = 0; i < brick.xy.length; i++) {
            x = brick.xy[i][0] + brick.pos[0];
            y = brick.xy[i][1] + brick.pos[1];
            if( this.wellArray[y] ) 
                this.wellArray[y][x] = 1;
        }
    },

    freeAt: function(x,y) {
// is the indicated square in the well free?
        if( ( this.wellArray[y] ) && (this.wellArray[y][x]) ) {
            return true;
            
        } else {
            return false;
        }
    },

    
    collision: function(newXY, newPos) {
    // checks whether moved/rotated brick would hit something, return true if so
        for (var i=0; i < newXY.length; i++) {
            if ( !( this.freeAt( newPos[0] + newXY[i][0], newPos[1] + newXY [i][1] ) ) ) return true;
        }
        return false;          
    },
    
    init: function(width, depth) {
        this.wellArray = [];
        this.width = width || 10;
        this.depth = depth || 20;
        this.emptyRows();
        this.startPosition = [Math.ceil(this.width / 2 ) - 1,
                              2];        
    }
}