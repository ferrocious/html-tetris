function abstractBlock (myWorld, blockType) {

// Abstract properties and methods for a 4-block, indifferent to the graphic representation. Creating, moving, rotating, detecting collisions.    
// Call it with an abstractWell as a parameter. The optional "blockType" can be: 's', 'z', 't', 'i', 'l', 'o' (roughly similar to uppercase S, Z, T, I, L and O, respectively) or 'r' (a mirrored L). If no parameter is passed, the block will be random.
    
    this.xy = [];
    this.pos = [5, 0];
    this.myWorld = myWorld || {};    
    
    this.randomType = function () {
//returns a random type of block, obvi

        var typeLetters = ["s", "z", "t", "i", "l", "r", "o"],
            rand = Math.floor(Math.random() * typeLetters.length);
        return typeLetters[rand];
    };

    this.collision = function (newXY, newPos) {
    // checks whether moved/rotated brick would hit something, return true if so
        return this.myWorld.collision(newXY, newPos);
    };
    
    this.rotate = function () {
    
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
    };
    
    // moveLeft, moveRight and stepDown work similarly
    
    this.moveLeft = function () {
        if (this.collision(this.xy, [this.pos[0] - 1, this.pos[1]])) return false;
        this.pos[0]--;
        return this;
    };

    this.moveRight = function () {
        if (this.collision(this.xy, [this.pos[0] + 1, this.pos[1]])) return false;
        this.pos[0]++;
        return this;
    };
    
    this.stepDown = function () {
        if (this.collision(this.xy, [this.pos[0], this.pos[1] + 1])) return false;
        this.pos[1] += 1;
        return this;
    };
    
    this.printMe = function() {
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
    }
    
//and doing the construction: 
    
// Actual creating the block goes here...
    blockType = blockType || this.randomType();
    switch (blockType) {
        case "s" : this.xy = [ [ -1, 1 ], [ 0, 1 ],  [ 0,  0 ], [ 1, 0 ] ]; break;            
        case "t" : this.xy = [ [ -1, 0 ], [ 0, 0 ],  [ 1,  0 ], [ 0, 1 ] ]; break;            
        case "z" : this.xy = [ [ -1, 0 ], [ 0, 1 ],  [ 0,  0 ], [ 1, 1 ] ]; break;
        case "o" : this.xy = [ [ -1, 0 ], [ 0, 0 ],  [-1,  1 ], [ 0, 1 ] ]; break;
        case "i" : this.xy = [ [ -2, 0 ], [-1, 0 ],  [ 0,  0 ], [ 1, 0 ] ]; break;
        case "l" : this.xy = [ [ -1, 1 ], [ 0, 1 ],  [ 1,  1 ], [ 1, 0 ] ]; break;
        case "r" : this.xy = [ [ -1, 1 ], [ 0, 1 ],  [-1,  0 ], [ 1, 1 ] ];  
    };
}
 
function abstractWell (width, depth) {

// abstract properties and methods for a well, regardless of the graphic representation
    
    this.width = width || 10;
    this.depth = depth || 20;
    this.wellArray = [];

    this.emptyRows = function() {
// inits the array representing the inside of the well; "true" - empty space, "false" - occupied space
        
        while (this.wellArray.length < this.depth) {
            var row = new Array(this.width);
            row.fill(1);
            this.wellArray.unshift(row);
        }
    };
    
    this.isRowFull = function (row) {
// if all the fields in the row are occupied
        var notFull = row.reduce( function (a, b) { return a || b; }, 
                                 false);
        return !notFull;
    };
    
    this.rowAt = function (y) {
// returns a copy of a single row of the well array
        return this.wellArray[y].slice() || [];
    };
    
    this.findFullRows = function() {
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
    };
        
    this.update = function(brick) {
// puts the brick inside the well's array
        var x, y;
        for (var i = 0; i < 4; i++) {
            x = brick.xy[i][0] + brick.pos[0];
            y = brick.xy[i][1] + brick.pos[1];
            if( (this.wellArray[y] ) && ( this.wellArray[y][x] ) ) {
                this.wellArray[y][x] = 0;
            }
        }
    };

    this.freeAt = function(x,y) {
// is the indicated square in the well free?
        if( ( this.wellArray[y] ) && (this.wellArray[y][x]) ) {
            return true;
            
        } else {
            return false;
        }
    };

    this.collision = function(newXY, newPos) {
    // checks whether moved/rotated brick would hit something, return true if so
        for (var i=0; i < newXY.length; i++) {
            if ( !( this.freeAt( newPos[0] + newXY[i][0], newPos[1] + newXY [i][1] ) ) ) return true;
        }
        return false;          
    }
    
    this.emptyRows();
}