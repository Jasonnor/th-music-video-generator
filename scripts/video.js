const musicVideoTrigger = async () => {
    switch (mvStage) {
        case -1:
            break;
        case 0:
            changeImage(mvInfo);
            videoPlayer.destroy();
            videoPlayer = new Plyr('#videoPlayer', {
                controls: [],
                autoplay: false,
                muted: true,
                clickToPlay: false
            });
            videoPlayer.once('ready', event => {
                changeVideo(mvInfo);
            });
            videoPlayer.once('ended', event => {
                mvStage = 0;
            });
            break;
        case 3000:
            if (mvInfo.keyword) {
                // Set time to half for boss
                videoPlayer.currentTime = (mvInfo.keyword.includes('BOSS')) ? Math.floor(videoPlayer.duration / 2.0) + 10 : 20;
            } else if (mvInfo.video_id) {
                // Set time as dataset value
                videoPlayer.currentTime = (mvInfo.time) ? mvInfo.time : 20;
            }
            break;
        case 6000:
            // Second Image
            changeImage(mvInfo);
            videoPlayer.play();
            break;
        case 7000:
            videoPlayer.pause();
            break;
        case 12000:
            document.getElementById('videoPlayer').style.display = 'block';
            document.getElementById('wrapper').style.backgroundImage = '';
            fadeInImage('videoPlayer', '', 'body');
            videoPlayer.play();
            break;
    }
    if (mvStage > -1) {
        mvStage += mvInterval;
    }
}

var mvInfo;
var mvStage = -1;
var mvInterval = 500;
var mvTrigger = setInterval(musicVideoTrigger, mvInterval);

const changeImage = async (info) => {
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
            var imageURL = '.' + imageList[Math.floor(Math.random() * imageList.length)];
            var vp = document.getElementById('videoPlayer');
            vp.style.display = 'none';
            videoPlayer.poster = imageURL;
            document.getElementById('pid').innerHTML = 'pid=' + imageURL.split('/')[3].split('_')[0];
            fadeInImage('wrapper', imageURL, 'body');
        } else {
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
                    fadeInImage('wrapper', imageURL, 'body');
                });
        }
    });
}

const changeVideo = async (info) => {
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
        });
    } else if (info.video_id) {
        // Using Video ID
        console.log('Database Video ID: ' + info.video_id)
        videoPlayer.source = {
            type: 'video',
            sources: [{
                src: info.video_id,
                provider: 'youtube',
            }]
        };
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
