/*
 * CONFIG
 */

var mapWidth = 150;
var mapHeight = 150;
var mapScale = 1.0; //Start
var lastScale = 1.0;

var maxZoom = 2.0;
var minZoom = 0.8;

var app;
var keystate = {
    right:false,
    left:false,
    up:false,
    down:false
};
var mapGenWeights = {
    nothing: 86.7,
    city: 1.5,
    coal_mine: 1.7,
    iron_mine: 1.7,
    steel_mill: 1.5,
    power_station: 1.5,
    factory: 1.5,
    oil_well: 1.2,
    refinery: 1.2,
    forest: 1.5
};
var scrollSpeed = 25;
var tickLength = 40;

var cursor;

var squareContainer;
var textContainer;
var gridContainer;

//Generate/Init the map and all functionality
function init(){
    app = new PIXI.Application(screen.width, screen.height, { antialias: true, backgroundColor : 0xA9E09D});
    document.body.appendChild(app.view);
    var ticker = PIXI.ticker.shared;
    ticker.autoStart = false;
    ticker.stop();


    //Starts the ticker
    initContainers();
    map.initArray();
    map.generate();
    drawMap();
    drawGrid();
    drawCursor();
    tick();

    $(document).keydown(function(e) {
        if (e.keyCode === 39) { // Right
            keystate.right = true;
        }
        if (e.keyCode === 37) { // Left
            keystate.left = true;
        }
        if (e.keyCode === 40) { // Up
            keystate.up = true;
        }
        if (e.keyCode === 38) { // Down
            keystate.down = true;
        }
        if (e.keyCode === 109){
            zoomOut()
        }
        if(e.keyCode === 107){
            zoomIn()
        }
        if(e.keyCode === 106){
            resetZoom()
        }
    });
    $(document).keyup(function(e) {
        if(e.keyCode === 39){ // Right
            keystate.right = false;
        }
        if(e.keyCode === 37){ // Left
            keystate.left = false;
        }
        if(e.keyCode === 40){ // Up
            keystate.up = false;
        }
        if(e.keyCode === 38){ // Down
            keystate.down = false;
        }
    });
    $(window).bind('mousewheel DOMMouseScroll', function(event){
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            if(mapScale < maxZoom){
                mapScale += 0.1;
                moveMap("Scale")
            }
        }else {
            if(mapScale > minZoom){
                mapScale -= 0.1;
                moveMap("Scale")
            }
        }
    });
    $("canvas").mousemove(function(e) {

        gameCord = scrCordToGameCord(e.pageX, e.pageY);

        cursor.x = Math.round(e.pageX/(25*mapScale) - 0.5)*25*mapScale;
        cursor.y = Math.round(e.pageY/(25*mapScale) - 0.5)*25*mapScale;
    });
}
function initContainers(){
    squareContainer = new PIXI.Container();
    textContainer = new PIXI.Container();
    gridContainer = new PIXI.Container();

    app.stage.addChild(squareContainer)
    app.stage.addChild(textContainer)
    app.stage.addChild(gridContainer)
}
/*
* All the draw all functions
* */
function drawMap(){
    for (var i = mapHeight - 1; i >= 0; i--) {
        for (var j = mapWidth - 1; j >= 0; j--) {
            var tile = map.map[j][i]
            if (tile !== 0) {
                drawTile(tile, j, i)
            }
        }
    }
    map.xOffset = 0
    map.yOffset = 0
}
function drawGrid(){

    drawX = Math.round(screen.width/(25*mapScale))+20
    drawY = Math.round(screen.height/(25*mapScale))+20


    for (var i = drawX - 1; i >= 0; i--) {
        var graphics = new PIXI.Graphics();
        graphics.beginFill("0x000000", 1);
        graphics.drawRect(25*i*mapScale, 0, 1, screen.height*1.5);
        gridContainer.addChild(graphics);
        //graphics.parentGroup = objectGroup;
    }
    for (var j = drawY - 1; j >= 0; j--) {
        var graphics = new PIXI.Graphics();
        graphics.beginFill("0x000000", 1);
        graphics.drawRect(0, 25*j*mapScale, screen.width*1.5, 1);
        gridContainer.addChild(graphics);
        //graphics.parentGroup = objectGroup;
    }
}
function drawTrains(){

}
function drawRails(){

}

//Convert coordinates
function scrCordToGameCord(screenX,screenY){

    sqrX = Math.round(screenX/(25*mapScale) - map.xOffset/25 - 0.5);
    sqrY = Math.round(screenY/(25*mapScale) - map.yOffset/25 - 0.5);

    if(sqrX === -0) sqrX = 0
    if(sqrY === -0) sqrY = 0

    return [sqrX, sqrY]
}
function gameCordToScrCord(gameX,gameY){

    if(gameX >= 0){
        screenX = gameX*25*mapScale - map.xOffset
    }else{

    }
    if(gameY >= 0){
        screenY = gameY*25*mapScale - map.yOffset
    }else{

    }


    return [screenX, screenY]
}


//Draw one tile
function drawTile(tile, x, y){
          if(tile === 1){color = "0xFFE699"; tileShort = "CTY"
    }else if(tile === 2){color = "0x757171"; tileShort = "CM"
    }else if(tile === 3){color = "0xD0CECE"; tileShort = "IM"
    }else if(tile === 4){color = "0xA6A6A6"; tileShort = "STM"
    }else if(tile === 5){color = "0x8EA9DB"; tileShort = "PST"
    }else if(tile === 6){color = "0xF4B084"; tileShort = "FAC"
    }else if(tile === 7){color = "0x4472C4"; tileShort = "OIL"
    }else if(tile === 8){color = "0xC65911"; tileShort = "REF"
    }else if(tile === 9){color = "0x548235"; tileShort = "FOR"
    }else{               color = "0xFFFFFF"; tileShort = "ERR2"}

    drawCords = gameCordToScrCord(x,y);
    var square = new PIXI.Graphics();
    square.beginFill(color, 1);
    square.drawRect(drawCords[0], drawCords[1], 25*mapScale, 25*mapScale);

    var basicText = new PIXI.Text(tileShort, {fontFamily : 'Arial', fontSize: 12*mapScale, fill : 0x000000, align : 'center', fontWeight : 'bold'});
    basicText.x = drawCords[0];
    basicText.y = drawCords[1];

    map.mapTiles[x][y] = square;
    map.mapText[x][y] = basicText;
    squareContainer.addChild(square);
    textContainer.addChild(basicText);
}
function drawTrain(){

}
function drawRail(){

}
function drawCursor(){
    cursor = new PIXI.Graphics();
    cursor.beginFill("0xFF0000", 1);
    cursor.drawRect(0, 0, 25*mapScale, 25*mapScale);
    cursor.alpha = 0.5;
    app.stage.addChild(cursor)
}


//Run a tick update
function tick(){
    if(keystate.right){ map.xOffset = map.xOffset - scrollSpeed*mapScale;}
    if(keystate.left){ map.xOffset = map.xOffset + scrollSpeed*mapScale;}
    if(keystate.up){ map.yOffset = map.yOffset - scrollSpeed*mapScale;}
    if(keystate.down){ map.yOffset = map.yOffset + scrollSpeed*mapScale;}

    moveMap(null);
    setTimeout(tick, tickLength);
}

function moveMap(direction){
    if(direction === "Scale"){
        map.xOffset = 0;
        map.yOffset = 0;

        squareContainer.setTransform(map.xOffset, map.yOffset, mapScale, mapScale, 0, 0, 0, 0, 0)
        gridContainer.setTransform(map.xOffset, map.yOffset, mapScale, mapScale, 0, 0, 0, 0, 0)

        textContainer.style = {fontFamily : 'Arial', fontSize: 12*mapScale, fill : 0x000000, align : 'center', fontWeight : 'bold'};

        for (child of textContainer.children){
            child.style = {fontFamily : 'Arial', fontSize: 12*mapScale, fill : 0x000000, align : 'center', fontWeight : 'bold'}

            child.x = (child.x/lastScale)*mapScale;
            child.y = (child.y/lastScale)*mapScale;
        }
        lastScale = mapScale;
    }

    squareContainer.x = map.xOffset;
    squareContainer.y = map.yOffset;

    textContainer.x = map.xOffset;
    textContainer.y = map.yOffset;

    /*
    * ONLY UPDATE TILES ON SCREEN
    * */
    for (var i = mapHeight - 1; i >= 0; i--) {
        for (var j = mapWidth - 1; j >= 0; j--) {
            tile = map.mapTiles[j][i];
            text = map.mapText[j][i];
            if(map[j] !== undefined && map[j][i] !== 0){
                if(25*j*mapScale + 50 > 0 && 25*i*mapScale + 50 > 0 && 25*j*mapScale < screen.width && 25*i*mapScale < screen.height){
                    tile.visible = true;
                    text.visible = true;
                }else {
                    tile.visible = false;
                    text.visible = false;
                }
            }
        }
        
    }
}
function checkTile(x, y, tile, radius, notAllowed){
    for (var j = radius; j > -radius; j--) {
        for (var i = radius; i > -radius; i--) {

            if((j != 0 || j + x > 0 || j + x < map.map.length) && (i != 0 || i + y > 0 || i + y < map.map.length)){
                if((map.map[x+j]  !== void 0) && (map.map[x+j][y+i] !== void 0)){
                    for (var ind = notAllowed.length - 1; ind >= 0; ind--) {
                        if(notAllowed[ind] == map.map[x+j][y+i]){
                            return false
                        }
                    }
                }
            }

        }
    }
    return true;
}
function getTileID(x,y){
    var tile;
    if(map.map[x] != undefined){
        if(map.map[x][y] != undefined){
            tile = map.map[x][y];
        }else{
            tile = 0
        }
    }else{
        tile = 0;
    }

    return tile; 
}
function zoomOut(){
    if(mapScale > minZoom){
        mapScale -= 0.1;
        moveMap("Scale")
    }
}
function zoomIn(){
    if(mapScale < maxZoom){
        mapScale += 0.1;
        moveMap("Scale")
    }
}
function resetZoom(){
    mapScale = 1.0;
    moveMap("Scale")
}

var map = {
    map: new Array(mapWidth),
    mapTiles: new Array(mapWidth),
    mapText: new Array(mapWidth),
    xOffset:0,
    yOffset:0,
    initArray: function(){
        for (var index = mapWidth - 1; index >= 0; index--) {
            map.map[index] = []
        }
        for (var index = mapWidth - 1; index >= 0; index--) {
            map.mapTiles[index] = []
        }
        for (var index = mapWidth - 1; index >= 0; index--) {
            map.mapText[index] = []
        }
    },
    generate: function() {
        for (var i = mapHeight - 1; i >= 0; i--) {
            for (var j = mapWidth - 1; j >= 0; j--) {

                var randomInt = Math.random() * 1000;

                last = 0
                if(randomInt < mapGenWeights.nothing * 10){tile = 0; radius = 1; notAllowed = [];}
                last += mapGenWeights.nothing * 10
                if(last < randomInt && randomInt < last + mapGenWeights.city * 10){tile = 1; radius = 4; notAllowed = [1,5,6];}
                last += mapGenWeights.city * 10
                if(last < randomInt && randomInt < last + mapGenWeights.coal_mine * 10){tile = 2; radius = 2; notAllowed = [2,3,4];}
                last += mapGenWeights.coal_mine * 10
                if(last < randomInt && randomInt < last + mapGenWeights.iron_mine * 10){tile = 3; radius = 2; notAllowed = [2,3,4];}
                last += mapGenWeights.iron_mine * 10
                if(last < randomInt && randomInt < last + mapGenWeights.steel_mill * 10){tile = 4; radius = 3; notAllowed = [2,3,4];}
                last += mapGenWeights.steel_mill * 10
                if(last < randomInt && randomInt < last + mapGenWeights.power_station * 10){tile = 5; radius = 3; notAllowed = [5,8];}
                last += mapGenWeights.power_station * 10
                if(last < randomInt && randomInt < last + mapGenWeights.factory * 10){tile = 6; radius = 3; notAllowed = [4,6,8];}
                last += mapGenWeights.factory * 10
                if(last < randomInt && randomInt < last + mapGenWeights.oil_well * 10){tile = 7; radius = 2; notAllowed = [7];}
                last += mapGenWeights.oil_well * 10
                if(last < randomInt && randomInt < last + mapGenWeights.refinery * 10){tile = 8; radius = 5; notAllowed = [8];}
                last += mapGenWeights.refinery * 10
                if(last < randomInt && randomInt < last + mapGenWeights.forest * 10){tile = 9; radius = 5; notAllowed = [];}
                last += mapGenWeights.forest * 10


                if(tile != 0){
                    if(checkTile(j, i, tile, radius, notAllowed)){
                        map.map[j][i] = tile;
                    }else{
                        map.map[j][i] = 0;
                    }
                }else{
                    map.map[j][i] = 0;
                }
            }
        }
    }
};
