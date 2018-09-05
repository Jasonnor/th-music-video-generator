const delay = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};

function setOpacity(object, opacityPct) {
    object.style.opacity = opacityPct / 100;
}

function changeOpacity(id, msDuration, msStart, fromO, toO) {
    var object = document.getElementById(id);
    var opacity = object.style.opacity * 100;
    var msNow = (new Date()).getTime();
    opacity = fromO + (toO - fromO) * (msNow - msStart) / msDuration;
    if (opacity < 0)
        setOpacity(object, 0)
    else if (opacity > 100)
        setOpacity(object, 100)
    else {
        setOpacity(object, opacity);
        object.timer = window.setTimeout('changeOpacity(\'' + id + '\',' + msDuration + ',' + msStart + ',' + fromO + ',' + toO + ')', 1);
    }
}

function imagePreload(src) {
    if (document.images) {
        img = new Image();
        img.src = src;
        return img;
    }
}

function fadeInImage(foregroundId, imageURL, backgroundId) {
    if (imageURL) {
        imagePreload(imageURL);
    }
    var foreground = document.getElementById(foregroundId);
    var background = document.getElementById(backgroundId);
    if (background) {
        background.style.backgroundImage = foreground.style.backgroundImage;
        background.style.backgroundRepeat = 'no-repeat';
    }
    setOpacity(foreground, 0);
    foreground.style.backgroundImage = 'url(\'' + imageURL + '\')';
    if (foreground.timer) window.clearTimeout(foreground.timer);
    var startMS = (new Date()).getTime();
    foreground.timer = window.setTimeout('changeOpacity(\'' + foregroundId + '\',1000,' + startMS + ',0,100)', 10);
}
