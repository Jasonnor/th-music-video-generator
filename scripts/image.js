var body = document.getElementsByTagName('body')[0];
body.style.backgroundImage = 'url(\'/images/紅美鈴/49613176_p0.jpg\')';

function saveToFirebase() {
    var dataObject = {
        game: '東方紅魔郷',
        song_no: '07',
        name: '明治十七年の上海アリス',
        character: '紅美鈴'
    };

    firebase.database().ref('song').push().set(dataObject)
        .then(function (snapshot) {
            console.log('success');
        }, function (error) {
            console.log('error, ' + error);
        });
}

saveToFirebase();
