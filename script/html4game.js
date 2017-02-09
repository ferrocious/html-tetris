

protoWell.clear = function() {
    this.htmlTarget.empty();
}

protoWell.append = function(elem) {
    this.htmlTarget.append(elem);
} 

protoWell.htmlInit = function(width, htmlTarget) {
    this.htmlTarget = htmlTarget;
    this.sqWidth = [];
    this.sqHeight = [];
    this.width = width || 10;
    this.depth = 2 * this.width;
    this.resetDeadBlocks();
    this.calculateSquareSize();    
}

protoWell.createHtmlSquare = function(x, y) {
/* Builds a basic square building block of the game; x and y are expressed in abstract coordinates.
If the given position is already occupied, the function does nothing and returns false. */
    var newDiv = $("<div></div>").basicSquare(this.sqWidth[1], this.sqHeight[1]);
    if(this.moveHtmlSquare(newDiv, x, y) ) {
        this.append(newDiv);
        return newDiv;
    } else
        return false;
}

protoWell.moveHtmlSquare = function (div, x, y) {
// Simple: if movable, that is, if the indicated place in the well is unocuppied - move it.
    if((x >= this.width) || (y >= this.depth) ) return false;
    return div
        .css("left", this.sqWidth[x])
        .css("top", this.sqHeight[y])
}

protoWell.resetDeadBlocks = function() {
// Initializes, or re-initializes for a new game, the well.        
    this.init(this.width, this.depth);
    this.clear();
}

protoWell.rebuildOldBlocks = function() {
// removes all the fallen bricks and recreates the stack, based on the abstract well
    this.clear();
    this.repaint();
}

protoWell.repaint = function() {
// "Repaint" mean: put again visual representation of dead bricks on screen.
    var newDiv;
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.depth; y++) {
            if (!this.freeAt (x,y)) {
                newDiv = this.createHtmlSquare (x, y);
                this.append(newDiv.repaintDead());
            }  // if...
        } // for y...
    } // for x...    
}
        
 protoWell.fillWithRubble = function() {
/* Haphazardly drops some bricks at the bottom of the well. It's used solely for decoration and as a visual
    hint at relative sizes of the well and the bricks. */
    for (var y = this.depth - 1; y > this.depth - 5; y--)
        for (var x = 0; x < this.depth; x++) {
            if (Math.random() < 0.5) {
                this.wellArray[y][x] = 0;
            }
        }
    this.repaint();
}

 protoWell.calculateSquareSize = function() {
/* Sets the size of a basic square. For a default, 10-wide, 20-high well, the basic square would be 10% wide and 5% high. Which does make a square.
   Also, caches the coordinates, expressed in %, of every field on the board. Hence, if we want to put a square with the coordinates        
   (x, y) on the board, we express it in CSS terms as: left: sqWidth[x]; top: sqHeight[y].
   */
    var x = 100 / this.width,
        y = 100 / this.depth;
    for (var i = 0; i < this.width; i++) {
        this.sqWidth[i] = (x * i).toFixed(3) + "%";
    }
    for (var i = 0; i < this.depth; i++) {
        this.sqHeight[i] = (y * i).toFixed(3) + "%";
    }
}

// HTML brick methods go here

protoBrick.rebase = function(newWorld) {
    this.myWorld = newWorld;
    this.pos = [this.myWorld.startPosition[0], this.myWorld.startPosition[1]];
    return this;
}
    
 protoBrick.resetBlocks = function() {
    this.htmlSquares =  [];
}
     
protoBrick.initHtml = function() {
// Initializes the visual representation of the 4-square block, placing it according to its 'pos' property.
    this.resetBlocks();
    var newDiv;
    for (var i = 0; i < this.xy.length; i++ ) {
        newDiv = $("<div></div>").basicSquare (0, 0);
        this.myWorld.moveHtmlSquare(
            newDiv,
            this.pos[0] + this.xy[i][0],
            this.pos[1] + this.xy[i][1]);                    
        this.myWorld.append(newDiv);
        this.htmlSquares.push(newDiv);
    }
    return this;
}
    
protoBrick.updateHtml = function() {
// Moves a block if its visual representation exists, creates if doesn't.
    if (this.htmlSquares) 
        for (var i = 0; i < this.htmlSquares.length; i++ ) {
            this.myWorld.moveHtmlSquare(
                this.htmlSquares[i],
                this.pos[0] + this.xy[i][0],
                this.pos[1] + this.xy[i][1]
            );
        } else
            this.initHtml();
}
    
protoBrick.addClass = function (newClass) {
    for (var i = 0; i < this.htmlSquares.length; i++) {
        this.htmlSquares[i].addClass(newClass);
    }
    return this;
}

protoBrick.removeClass = function (oldClass) {
    for (var i = 0; i < this.htmlSquares.length; i++) {
        this.htmlSquares[i].removeClass(oldClass);
    }
    return this;
}
        
protoBrick.done = function() {
/* When we're done with a block (it's fallen to the bottom), we: update the well's abstract model, paint the brick dead, and also tells the well to find and remove any full rows. Returns their number, if there were any.
*/
    var block,
        rows;
    while (this.htmlSquares.length > 0) {
        block = this.htmlSquares.pop();
        this.myWorld.append(block.repaintDead());
    }
    this.myWorld.update(this);
    rows = this.myWorld.findFullRows();
    if ( rows > 0 ) {
        this.myWorld.rebuildOldBlocks();
    }
    return rows;
}

// And here goes our tiny little jQuery plugin.
$.fn.basicSquare = function(x, y) {
    return this
        .addClass("brick")
        .addClass("live-brick")
        .css("left", x)
        .css("top", y);
}

$.fn.repaintDead = function() {
    return this
        .removeClass("live-brick")
        .addClass("dead-brick")
        .shake()
        .css(
        "background-position", 
        "-" + this.css("left") + " -" + this.css("top")        
        );
}

$.fn.shake = function() {
    return this.css(
        "transform", 
        "rotate(" + ( Math.round((Math.random() * 15 - 7.5) ) ) + "deg)");
}

$.fn.shakeEach = function() {
    return this.each(function(index, elem) {
        return $(elem).shake();
    })
}
