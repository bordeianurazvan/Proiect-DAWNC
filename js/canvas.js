var urls = [];
var lines = [];
//const
var radius = 20;
var arrowColor = "blue";
var arrowWidth = 2;

var circleFill = "yellow";
var circleLine =  "green";
var circleLineWidth = 2;

var textFont = "12px Arial";
var textColor = "black";
//container limits
var container_width = document.getElementById("myCanvas").getAttribute("width")-100;
var container_height = document.getElementById("myCanvas").getAttribute("height")-100;



function newRandomPosition(list){
    var rn = {};
    do{
        rn.coord_x = Math.floor(Math.random() * container_width)+50;
        rn.coord_y = Math.floor(Math.random() * container_height)+50;
    }while(!checkPositions(list,rn));
    return rn;
}

function checkPositions(list,newPos){
    for(var i = 0; i < list.length; i++ ){
        if(Math.sqrt((newPos.coord_x - list[i].pos.coord_x) * (newPos.coord_x - list[i].pos.coord_x) +
                (newPos.coord_y - list[i].pos.coord_y) * (newPos.coord_y - list[i].pos.coord_y)) <= (2 * radius + 10)){
            return false;
        }
    }
    return true;
}


//draws line between 2 nodes
function drawArrow(context,from,to){
    context.beginPath();
    context.moveTo(from.coord_x,from.coord_y);
    context.lineTo(to.coord_x,to.coord_y);
    context.lineWidth = arrowWidth;
    context.strokeStyle = arrowColor;
    context.stroke();
}
//draws node
function drawCircle(context,position){
    context.beginPath();
    context.arc(position.coord_x, position.coord_y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = circleFill;
    context.fill();
    context.lineWidth = circleLineWidth;
    context.strokeStyle = circleLine;
    context.stroke();
}

//draws url domain
function drawTruncatedURL(context,position,url){
    context.font = textFont;
    context.fillStyle = textColor;
    context.textAlign = "center";
    context.fillText(extractRootDomain(url),
        position.coord_x,position.coord_y);
}

//extract hostname
function extractHostname(url) {
    var hostname;
    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];
    return hostname;
}

//extract domain
function extractRootDomain(url) {
    var domain = extractHostname(url);
    var splitArr = domain.split('.');
    var arrLen = splitArr.length;

    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        if (splitArr[arrLen - 1].length === 2 && splitArr[arrLen - 1].length === 2) {
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}



function drawGraph(nodes,arches){
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    for(var i = 0 ;i<arches.length;i++){
        drawArrow(context,arches[i].from,arches[i].to);
    }
    for(i = 0 ;i<nodes.length;i++){
        drawCircle(context,nodes[i].pos);
        drawTruncatedURL(context,nodes[i].pos,nodes[i].elem.url);
    }
    console.log(lines);
}




//experimental:start
function checkIntersection(list1,list2){
    for(var i = 0;i<list1.length;i++){
        for(var j = 0;j<list2.length;j++){
            if(list1[i]===list2[j]){
                return true;
            }
        }
    }
    return false;
}


function getPaths(he1,he2) {
    var url1 = {"url": he1.elem.url};
    var url2 = {"url": he2.elem.url};
    chrome.history.getVisits(url1, function (stPage) {
        var firstArray = [];
        for (var i = 0; i < stPage.length; i++) {
            if(!(stPage[i].visitId === "0")) {
                firstArray.push(stPage[i].visitId);
            }
        }

        chrome.history.getVisits(url2, function (ndPage) {
            var secondArray = [];
            for (var j = 0; j < ndPage.length; j++) {
                if(!(ndPage[j].referringVisitId === "0")) {
                    secondArray.push(ndPage[j].referringVisitId);
                }
            }

            if(checkIntersection(firstArray,secondArray)){
                lines.push({"from":he1.pos,"to":he2.pos});
                he1.refs.push(he2.pos);
            }

        });

    });
}

function limitSearchesForArrow(list,element,start){
    for (var i = list.length-1;i > start; i--){
        getPaths(list[i],element);
    }
}


function triggerHistoryRepresentation(){
    chrome.history.search({text: '', maxResults: 50}, function(data) {
        urls = [];
        lines = [];
        data.forEach(function(page) {
            //getting coordinates for the new node
            var circlePosition = newRandomPosition(urls);
            var historyElement ={};
            historyElement.elem = page;
            historyElement.pos = circlePosition;
            historyElement.refs = [];
            urls.push(historyElement);
        });
        for( var i = 0;i < urls.length; i++) {
            limitSearchesForArrow(urls, urls[i], i);
        }
    });
}
//experimental:end


triggerHistoryRepresentation();
setTimeout(function(){ drawGraph(urls,lines) }, 2000);


