const musicVideoTrigger = async () => {
    switch (mvStage) {
        case -1:
            break;
        case 0:
            changeImage(mvInfo);
            mvNumOfImages = numOfImagesValue - 1;
            videoPlayer.destroy();
            videoPlayer = new Plyr('#videoPlayer', {
                controls: [],
                autoplay: false,
                muted: true,
                clickToPlay: false
            });
            videoPlayer.once('ready', (event) => {
                changeVideo(mvInfo);
            });
            videoPlayer.once('ended', (event) => {
                mvStage = 0;
            });
            break;
        case 2000:
            if (mvInfo.keyword) {
                // Set time to half for boss
                videoPlayer.currentTime = mvInfo.keyword.includes('BOSS') ? Math.floor(videoPlayer.duration / 2.0) + 10 : 20;
            } else if (mvInfo.video_id) {
                // Set time as dataset value
                videoPlayer.currentTime = mvInfo.time ? mvInfo.time : 20;
            }
            break;
        case imagesDurationValue * 1000 * (numOfImagesValue - mvNumOfImages):
            // For video buffering
            if (
                imagesDurationValue * (numOfImagesValue - mvNumOfImages) == 6 &&
                imagesDurationValue * numOfImagesValue > 6
            ) {
                videoPlayer.play();
            }
            if (mvNumOfImages > 0) {
                changeImage(mvInfo);
                mvNumOfImages--;
            } else if (mvNumOfImages == 0) {
                document.getElementById('wrapper').style.backgroundImage = '';
                document.getElementById('pid').innerHTML = 'vid=' + mvVid;
                pidUrl = 'https://youtu.be/' + mvVid;
                mvNumOfImages = numOfImagesValue - 1;
                fadeInImage('videoPlayer', '', 'body', () => {
                    document.getElementById('videoPlayer').style.display = 'block';
                    document.getElementById('foreground').style.backgroundImage = 'url("")';
                    document.getElementById('background').style.opacity = 'url("")';
                });
                videoPlayer.play();
            }
            break;
        case 6000:
            // Trick: for video buffering
            if (imagesDurationValue * numOfImagesValue > 6) {
                videoPlayer.play();
            }
            break;
        case 7000:
            // Trick: for video buffering
            if (imagesDurationValue * numOfImagesValue > 7) {
                videoPlayer.pause();
            }
            break;
    }
    if (mvStage > -1) {
        mvStage += mvInterval;
    }
};

var mvInfo;
var mvStage = -1;
var mvInterval = 500;
var mvTrigger = setInterval(musicVideoTrigger, mvInterval);
var mvVid = '';
var mvNumOfImages = (numOfImages) ? parseInt(numOfImages.value) - 1 : 1;
let currentCharacter = '';
let currentImageList = [];
let currentImageIndex = 0;

const changeImage = async (info) => {
    // console.log('Change image to character ' + info.character);
    firebase.database().ref('images').once('value').then(function (characters) {
        // Read image path from firebase
        characters.val().some(character => {
            if (character.name === info.character) {
                if (character.name === currentCharacter) {
                    return true;
                }
                currentCharacter = character.name;
                currentImageList = [];
                currentImageIndex = 0;
                character.images.forEach(image => {
                    currentImageList.push(image.path);
                });
                currentImageList.sort(() => Math.random() - 0.5)
                return true;
            }
            return false;
        });
        if (currentImageList.length > 0) {
            // Get random image
            const imageURL = '.' + currentImageList[currentImageIndex % currentImageList.length];
            currentImageIndex += 1;
            let vp = document.getElementById('videoPlayer');
            vp.style.display = 'none';
            videoPlayer.poster = imageURL;
            const pidTemp = imageURL.split('/')[3].split('_')[0];
            document.getElementById('pid').innerHTML = 'pid=' + pidTemp;
            pidUrl = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + pidTemp;
            fadeInImage('background', imageURL, 'body');
        } else {
            const cx = '009797881502979873179:yxcz0y7drxo';
            const a = info.character;
            const url = 'https://www.googleapis.com/customsearch/v1/siterestrict?key=' + googleAPI + '&cx=' + cx + '&q=' + a +
                '&searchType=image&imgSize=large&safe=medium';
            fetch(url).then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    // console.log(data);
                    var imageURL = data.items[Math.floor(Math.random() * data.items.length)].link;
                    var vp = document.getElementById('videoPlayer');
                    vp.style.display = 'none';
                    videoPlayer.poster = imageURL;
                    document.getElementById('pid').innerHTML = '';
                    pidUrl = '';
                    fadeInImage('background', imageURL, 'body');
                });
        }
    });
}

const changeVideo = async (info) => {
    if (info.keyword) {
        // Using Crawler Keyword
        // console.log('Crawler Keyword: ' + info.keyword)
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
            // console.log('Video title: ' + response.result.items[randomIndex].snippet.title + ', id: ' + videoId);
            console.log(videoId);
            mvVid = videoId;
            videoPlayer.source = {
                type: 'video',
                sources: [
                    {
                        src: videoId, //videoId,
                        provider: 'youtube'
                    }
                ]
            };
        });
    } else if (info.video_id) {
        console.log(info.video_id);

        // Using Video ID
        // console.log('Database Video ID: ' + info.video_id)
        mvVid = info.video_id;
        videoPlayer.source = {
            type: 'video',
            sources: [
                {
                    src: info.video_id, //info.video_id,
                    provider: 'youtube'
                }
            ]
        };
    }
};

var pidUrl;
var numOfImagesValue = numOfImages ? parseInt(numOfImages.value) : 2;
var imagesDurationValue = imagesDuration ? parseInt(imagesDuration.value) : 6;

pid.addEventListener('click', function () {
    window.open(pidUrl, '_blank');
});
numOfImages.addEventListener('change', function () {
    numOfImagesValue = parseInt(numOfImages.value);
    if (mvInfo) {
        mvStage = 0;
    }
});
imagesDuration.addEventListener('change', function () {
    imagesDurationValue = parseInt(imagesDuration.value);
    if (mvInfo) {
        mvStage = 0;
    }
});

var googleAPI = 'AIzaSyALDYJZ_19ORofWN3mcvTsMS23f8UVYCug';

var videoPlayer = new Plyr('#videoPlayer', {
    controls: [],
    autoplay: false,
    muted: true,
    clickToPlay: false
});
videoPlayer.once('ready', (event) => {
    videoPlayer.stop();
});
