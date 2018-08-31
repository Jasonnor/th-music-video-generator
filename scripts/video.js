const delay = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};

const changeImage = async (charaName, sleep) => {
    console.log('Change image to character ' + charaName);
    var imageList = []
    firebase.database().ref('images').once('value').then(function (charas) {
        charas.val().forEach(chara => {
            if (chara.name == charaName) {
                chara.images.forEach(image => {
                    imageList.push(image.path);
                });
            }
        });
        if (imageList.length > 0) {
            var imageURL = imageList[Math.floor(Math.random() * imageList.length)];
            //var body = document.getElementsByTagName('body')[0];
            //body.style.backgroundImage = 'url(\'.' + imageURL + '\')';
            var vp = document.getElementById('videoPlayer');
            vp.style.display = 'none';
            videoPlayer.poster = imageURL;
            fadeInImage('wrapper', 'url(\'.' + imageURL + '\')', 'body');
        }
    });
    if (sleep == true) {
        changeVideo(charaName);
    }
}

const changeVideo = async (charaName) => {
    videoPlayer.source = {
        type: 'video',
        sources: [{
            src: 'gMysfDV9UXA',
            provider: 'youtube',
        }]
    };
    await delay(1000);
    videoPlayer.currentTime = 40;
    videoPlayer.play();
    await delay(1000);
    videoPlayer.pause();
    await delay(3500);
    changeImage(charaName, false);
    await delay(6500);
    var vp = document.getElementById('videoPlayer');
    vp.style.display = 'block';
    var wrapper = document.getElementById('wrapper');
    wrapper.style.backgroundImage = '';
    videoPlayer.play();
}

const videoPlayer = new Plyr('#videoPlayer', {
    controls: [],
    autoplay: true,
    autopause: false,
    muted: true,
    clickToPlay: false,
    resetOnEnd: true
});

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

function fadeInImage(foregroundId, newImage, backgroundId) {
    var foreground = document.getElementById(foregroundId);
    var background = document.getElementById(backgroundId);
    if (background) {
        background.style.backgroundImage = foreground.style.backgroundImage;
        background.style.backgroundRepeat = 'no-repeat';
    }
    setOpacity(foreground, 0);
    foreground.style.backgroundImage = newImage;
    if (foreground.timer) window.clearTimeout(foreground.timer);
    var startMS = (new Date()).getTime();
    foreground.timer = window.setTimeout('changeOpacity(\'' + foregroundId + '\',1000,' + startMS + ',0,100)', 10);
}
