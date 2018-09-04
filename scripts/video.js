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
            imagePreload('.' + imageURL);
            vp.style.display = 'none';
            videoPlayer.poster = imageURL;
            fadeInImage('wrapper', 'url(\'.' + imageURL + '\')', 'body');
        } else if (false) {
            var cx = '009797881502979873179:yxcz0y7drxo';
            var a = info.character;
            var url = 'https://www.googleapis.com/customsearch/v1/siterestrict?key=' + googleAPI + '&cx=' + cx + '&q=' + a +
                '&searchType=image&imgSize=large&safe=medium';
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
        videoPlayer.destroy();
        videoPlayer = new Plyr('#videoPlayer', {
            controls: [],
            autoplay: false,
            muted: true,
            clickToPlay: false
        });
        changeVideo(info);
    }
}

const changeVideo = async (info) => {
    googleApiClientReady();
    // Wait for google API
    await delay(2000);
    videoPlayer.once('ended', event => {
        changeImage(info, true);
    });
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
            // Delay time for images 5s:7s (1s for waiting request)
            await delay(2000);
            // Set time to half for boss, and buffer video
            videoPlayer.currentTime = (info.keyword.includes('BOSS')) ? Math.floor(videoPlayer.duration / 2.0) + 10 : 20;
            await delay(3000);
            // Second Image
            changeImage(info, false);
            await delay(3000);
            videoPlayer.play();
            await delay(1000);
            videoPlayer.pause();
            await delay(3000);
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
        // Delay time for images 6s:7s
        await delay(3000);
        // Set time to half for boss, and buffer video
        videoPlayer.currentTime = (info.time) ? info.time : 20;
        await delay(3000);
        // Second Image
        changeImage(info, false);
        await delay(3000);
        videoPlayer.play();
        await delay(1000);
        videoPlayer.pause();
        await delay(3000);
        document.getElementById('videoPlayer').style.display = 'block';
        document.getElementById('wrapper').style.backgroundImage = '';
        fadeInImage('videoPlayer', '', 'body');
        videoPlayer.play();
    } else {
        await delay(9000);
        changeImage(info, false);
    }
}

var googleAPI = 'AIzaSyALDYJZ_19ORofWN3mcvTsMS23f8UVYCug';

var videoPlayer = new Plyr('#videoPlayer', {
    controls: [],
    autoplay: false,
    muted: true,
    clickToPlay: false
});
videoPlayer.once('ready', event => {
    videoPlayer.stop();
});
