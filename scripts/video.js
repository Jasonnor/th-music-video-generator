const delay = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};

const changeImage = async (info, sleep) => {
    console.log('Change image to character ' + info.character);
    var imageList = []
    firebase.database().ref('images').once('value').then(function (charas) {
        charas.val().forEach(chara => {
            if (chara.name == info.character) {
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
        changeVideo(info);
    }
}

const changeVideo = async (info) => {
    googleApiClientReady();
    await delay(1000);
    if (info.keyword) {
        var request = gapi.client.youtube.search.list({
            part: 'snippet',
            type: 'video',
            videoDuration: 'medium',
            q: info.keyword.replace('BOSS', '')
        });
        request.execute(async (response) => {
            //var randomIndex = Math.floor(Math.random() * 5);
            var randomIndex = 0;
            //response.result.items[randomIndex].snippet.title;
            var videoId = response.result.items[randomIndex].id.videoId;
            console.log(response.result.items[randomIndex]);
            await delay(1000);
            videoPlayer.source = {
                type: 'video',
                sources: [{
                    src: videoId,
                    provider: 'youtube',
                }]
            };
            videoPlayer.on('ended', event => {
                changeImage(info, true);
            });
            await delay(1000);
            videoPlayer.currentTime = 40;
            //await delay(2500);
            //changeImage(info, false);
            //await delay(4500);
            videoPlayer.play();
            await delay(1000);
            videoPlayer.pause();
            await delay(1000);
            var vp = document.getElementById('videoPlayer');
            vp.style.display = 'block';
            var wrapper = document.getElementById('wrapper');
            wrapper.style.backgroundImage = '';
            fadeInImage('videoPlayer', '', 'body');
            videoPlayer.play();
        });
    } else if (info.video_id) {
        await delay(1000);
        videoPlayer.source = {
            type: 'video',
            sources: [{
                src: info.video_id,
                provider: 'youtube',
            }]
        };
        videoPlayer.on('ended', event => {
            changeImage(info, true);
        });
        await delay(1000);
        videoPlayer.currentTime = 40;
        //await delay(2500);
        //changeImage(info, false);
        //await delay(4500);
        videoPlayer.play();
        await delay(1000);
        videoPlayer.pause();
        await delay(1000);
        var vp = document.getElementById('videoPlayer');
        vp.style.display = 'block';
        var wrapper = document.getElementById('wrapper');
        wrapper.style.backgroundImage = '';
        fadeInImage('videoPlayer', '', 'body');
        videoPlayer.play();
    }
}

const videoPlayer = new Plyr('#videoPlayer', {
    controls: [],
    autoplay: true,
    autopause: false,
    muted: true,
    clickToPlay: false,
    resetOnEnd: true
});
videoPlayer.once('ready', event => {
    videoPlayer.stop();
});

var googleAPI = 'AIzaSyDqqWDSvvNkCYbI7aBvgACgAXu1hgSjB3E';

function googleApiClientReady() {
    gapi.client.setApiKey(googleAPI);
    gapi.client.load('youtube', 'v3');
}

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
