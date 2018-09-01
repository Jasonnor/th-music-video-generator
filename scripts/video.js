const delay = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};

const changeImage = async (info, sleep) => {
    console.log('Change image to character ' + info.character);
    var imageList = []
    firebase.database().ref('images').once('value').then(function (charas) {
        // Read image path from firebase
        charas.val().forEach(chara => {
            if (chara.name == info.character) {
                chara.images.forEach(image => {
                    imageList.push(image.path);
                });
            }
        });
        if (imageList.length > 0) {
            // Get random image
            var imageURL = imageList[Math.floor(Math.random() * imageList.length)];
            var vp = document.getElementById('videoPlayer');
            vp.style.display = 'none';
            videoPlayer.poster = imageURL;
            fadeInImage('wrapper', 'url(\'.' + imageURL + '\')', 'body');
        } else {
            var cx = '009797881502979873179:yxcz0y7drxo';
            var key = 'AIzaSyCt3hhmX2vdoUQBI0olkZLhYruPcsyL-3U';
            var a = info.character;
            var url = 'https://www.googleapis.com/customsearch/v1?key=' + key + '&cx=' + cx + '&q=' + a +
                '&searchType=image&imgSize=large';
            fetch(url).then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    console.log(data);
                    var imageURL = data.items[Math.floor(Math.random() * data.items.length)].link;
                    var vp = document.getElementById('videoPlayer');
                    vp.style.display = 'none';
                    videoPlayer.poster = imageURL;
                    fadeInImage('wrapper', 'url(\'' + imageURL + '\')', 'body');
                });
        }
    });
    if (sleep == true) {
        changeVideo(info);
    }
}

const changeVideo = async (info) => {
    googleApiClientReady();
    // Wait for google API
    await delay(1000);
    if (info.keyword) {
        // Using Crawler Keyword
        console.log('Crawler Keyword: ' + info.keyword)
        var request = gapi.client.youtube.search.list({
            part: 'snippet',
            type: 'video',
            videoDuration: 'any',
            q: info.keyword.replace('BOSS', '')
        });
        request.execute(async (response) => {
            //var randomIndex = Math.floor(Math.random() * 5);
            var randomIndex = 0;
            var videoId = response.result.items[randomIndex].id.videoId;
            console.log('Video title: ' + response.result.items[randomIndex].snippet.title + ', id: ' + videoId);
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
            // Delay time for images 4s:6s
            await delay(1000);
            // Set time to half for boss, and buffer video
            videoPlayer.currentTime = (info.keyword.includes('BOSS')) ? Math.floor(videoPlayer.duration / 2.0) : 20;
            await delay(3000);
            // Second Image
            changeImage(info, false);
            await delay(4000);
            videoPlayer.play();
            await delay(1000);
            videoPlayer.pause();
            await delay(1000);
            document.getElementById('videoPlayer').style.display = 'block';
            document.getElementById('wrapper').style.backgroundImage = '';
            fadeInImage('videoPlayer', '', 'body');
            videoPlayer.play();
        });
    } else if (info.video_id) {
        // Using Video ID
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
        // Delay time for images 4s:6s
        await delay(1000);
        // Set time to half for boss, and buffer video
        videoPlayer.currentTime = (info.time) ? info.time : (info.keyword.includes('BOSS')) ? Math.floor(videoPlayer.duration / 2.0) : 20;
        await delay(3000);
        // Second Image
        changeImage(info, false);
        await delay(4000);
        videoPlayer.play();
        await delay(1000);
        videoPlayer.pause();
        await delay(1000);
        document.getElementById('videoPlayer').style.display = 'block';
        document.getElementById('wrapper').style.backgroundImage = '';
        fadeInImage('videoPlayer', '', 'body');
        videoPlayer.play();
    }
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

function googleApiClientReady() {
    gapi.client.setApiKey(googleAPI);
    gapi.client.load('youtube', 'v3');
}

var googleAPI = 'AIzaSyDqqWDSvvNkCYbI7aBvgACgAXu1hgSjB3E';

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
