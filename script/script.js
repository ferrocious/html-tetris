var $scoreHtml,
    $gameOver,
    $styleSlot,
    $well,
    $paused,
    $widthBox,
    $widthSlider,
    $setupDialog,
    paused = false,
    maxWidth,
    minWidth,
    currentWidth = 10,
    well,
    preview,
    currentBlock, 
    nextBlock,
    lineCount = 0, 
    step = 200, 
    gameLoopId = 0, 
    animationId = 0;

function getNewBlock(well, preview) {
    currentBlock = nextBlock.rebase(well).initHtml();
    preview.clear();
    nextBlock = new htmlBlock(preview);
    nextBlock.initHtml();
}

function readButton() {
    this.blur();
    readKeyboard($(this).data());
}

function readKeyboard(e) {
    if (paused) {
        togglePause();
        return;
    }
    switch (e.key.toLowerCase()) {
        case "a": currentBlock.moveLeft();
            break;
        case "d": currentBlock.moveRight();
            break;
        case "s": currentBlock.rotate();
            break;
        case " ": currentBlock.stepDown();
            break;
        case "p": togglePause();
    }
}

function animationLoop() {
    if(currentBlock)
        currentBlock.updateHtml();
    $scoreHtml.html(lineCount.toString());
    animationId = window.requestAnimationFrame(animationLoop);
}

function gameLoop() {
    if(currentBlock.stepDown()) {
// if it can fall, let it
        gameLoopId = setTimeout (gameLoop, step);
    } else {
// and if it cannot: update the well with new bricks,
        currentBlock.updateHtml();     
/* that additional updateHtml, out of the animation loop, is necessary, as, every now and then, 
weird timing would make a brick "killed" before the last update of the graphical representation 
was made. Result: a brick looking as if hovering one row too high. */
        
        lineCount += currentBlock.done();  // The done() method, among doing other things, returns the number of lines that got completed and removed from the well.
// get another block: can it move at all?
        getNewBlock(well, preview);
        if (currentBlock.collision(currentBlock.xy, currentBlock.pos)) {
            gameOver();
            return;
        }
    gameLoopId = setTimeout(gameLoop, step);    
    }
}

function gameOver() {
    $gameOver.show();
    window.clearTimeout(gameLoopId);
    window.cancelAnimationFrame(animationId);
    currentBlock = null;
}

function resumeGame() {
    gameLoopId = setTimeout(gameLoop, step);
    animationId = window.requestAnimationFrame(animationLoop);
    attachButtons();
    attachKeys();
    $paused.hide();
}

function pauseGame() {
    window.clearTimeout(gameLoopId);
    window.cancelAnimationFrame(animationId);
    gameLoopId = animationId = 0;
    detachButtons();
    paused = true;
}

function unpauseGame() {
    $paused.hide();
    paused = false;
    resumeGame();
}

function togglePause() {
    if (paused) {
        unpauseGame();
    } else {
        $paused.show();
        pauseGame();
    }
}

function bringResizeDialog() {
    pauseGame();
    detachButtons();
    detachKeys();
    $paused.hide();
    $widthBox.val(currentWidth);
    $widthSlider.val(currentWidth);
    $setupDialog.show();    
}

function shutResizeDialog() {
    $setupDialog.hide();
    unpauseGame();
}

function submitChange(e) {
    currentWidth = parseInt($widthBox.val());
    resizeGame(currentWidth);
    $setupDialog.hide();
    return false;
}

function handleWidthChange() {
    maxWidth = parseInt($widthBox.attr("max"));
    minWidth = parseInt($widthBox.attr("min"));
    $setupDialog.submit(submitChange);
    $widthSlider.change(function(e) {
        $widthBox.val(e.target.value);
    });
    $widthBox.change(function(e) {
        var val = parseInt($widthBox.val());
        if(val > maxWidth) {
            $widthBox.val(maxWidth.toString());
        }
        if(val < minWidth) {
            $widthBox.val(minWidth.toString());
        }
        $widthSlider.val($widthBox.val());
    });
}

function resizeGame(x) {
    var width = (100 / x).toFixed(3) + "%",
        height = (50 / x).toFixed(3) + "%";
    var newcss = "#well > .brick { width: " +
        width +
        "; height: " +
        height + 
        "; }";
    //well.clear();
    well = new htmlWell($well, x);
    $styleSlot.empty().html(newcss);
    well.fillWithRubble();
    paused = false;
}

function attachButtons() {
    detachButtons();
    $("#left").click(readButton);
    $("#right").click(readButton);
    $("#rotate").click(readButton);    
}

function detachButtons() {
    $("#left").off('click');
    $("#right").off('click');
    $("#rotate").off('click');    
}

function attachKeys() {
    detachKeys();
    console.log("attach keys");
    $("body").on("keypress", readKeyboard);
}

function detachKeys() {
    $("body").off("keypress");
}

function initGame() {
    $gameOver.hide();
    $setupDialog.hide();
    if(paused)
        togglePause();
    nextBlock = new htmlBlock(preview);
    lineCount = 0;
    window.clearTimeout(gameLoopId);
    well.resetDeadBlocks();
    getNewBlock(well, preview);
    attachButtons();
    attachKeys();
    gameLoopId = setTimeout(gameLoop, step);
    animationId = animationLoop();
}

function initPreview(htmlTarget) {
    preview = Object.create(well);
    preview.htmlTarget = htmlTarget;
    preview.sqHeight = ["0", "50%"];
    preview.sqWidth = ["0", "25%", "50%", "75%"];
    preview.startPosition = [2, 0];
}

window.onload =  function initAll() {

// First, cache the DOM elements.    
    $well = $("#well");
    $scoreHtml = $("#score");
    $gameOver = $("#game-over");
    $styleSlot = $("#dynamic");
    $paused = $("#paused");
    $widthBox = $("#width-box");
    $widthSlider = $("#width-slider");
    $setupDialog = $("#setup-dialog");
    
// Second, init the logic of the well and the preview window.    
    
    well = new htmlWell($("#well"));
    initPreview($("#next"));
    well.fillWithRubble();
    
// Third, attach listeners.    
    $well.click(togglePause);
    $paused.click(togglePause);
    $gameOver.click(initGame);
    $("#new-game").click(
        function() {
            this.blur();
            initGame();
        }
    );
    handleWidthChange();
    $("#setup-width").click(bringResizeDialog);
    $("#close-width-dialog").click(shutResizeDialog);
}