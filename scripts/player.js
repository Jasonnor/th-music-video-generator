// Cache references to DOM elements.
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'settingBtn', 'playlistBtn', 'volumeBtn', 'progress', 'waveform', 'canvas', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function (elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function (playlist) {
  this.playlist = playlist;

  // URL Parser
  var url = new URL(window.location.href);
  var parser = new URLSearchParams(url.search);
  var parserIndex = parseInt(parser.get('index'));
  if (!isNaN(parserIndex) && parserIndex < playlist.length && parserIndex > 0) {
    this.index = parserIndex;
  } else {
    do {
      this.index = Math.floor(Math.random() * playlist.length);
    } while (playlist[this.index].file == null);
  }

  // Display the song title of the first track.
  track.innerHTML = playlist[this.index].title;

  var indexTemp = this.index - 1;
  while (this.playlist[indexTemp].file != null) {
    --indexTemp;
  }
  document.getElementById('series').innerHTML = this.playlist[indexTemp].title;
  changeImage(playlist[this.index].info);

  var ul = null;
  var ulth = 1;
  var pl = document.getElementById('playlist')
  // Setup the playlist display.
  playlist.forEach(function (song) {
    var li = document.createElement('li');
    li.className = 'pure-menu-item';
    if (song.file == null) {
      // Title
      if (ul != null) {
        pl.appendChild(ul);
      }
      li.innerHTML = song.title;
      li.className += ' pure-menu-disabled playlist-title';
      ul = document.createElement('ul');
      ul.className = 'pure-menu-list';
      if (ulth > 5) {
        ul.style.backgroundImage = 'url(\'./images/title/' + ('00' + ulth).slice(-2) + '.jpg\')';
      }
      ulth++;
    } else {
      // Song
      var a = document.createElement('div');
      a.innerHTML = song.title;
      a.className = 'pure-menu-link playlist-item';
      a.onclick = function () {
        player.skipTo(playlist.indexOf(song));
      };
      li.appendChild(a);
    }
    ul.appendChild(li);
  });
  pl.appendChild(ul);
  gapi.client.setApiKey(googleAPI);
  gapi.client.load('youtube', 'v3');
  // For mobile user, display non-animated waveform as default
  if (mobilecheck()) {
    animatedWaveform.checked = '';
  }
};

Player.prototype = {

  lang: 'jp',
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function (index, isNewSong) {
    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    // Unload last song
    if (self.playlist[self.index].howl && self.index != index) {
      self.playlist[self.index].howl.unload();
      delete self.playlist[self.index].howl;
    }
    // Keep track of the index we are currently playing.
    self.index = index;
    // console.log('Playing index ' + index);

    // Skip song not exist
    // TODO: Fix prev not exist won't prev 2 song bug
    var data = self.playlist[index];
    if (data.file == null) {
      self.skip('next');
      return;
    }

    // URL Parser
    var url = new URL(window.location.href);
    var parser = new URLSearchParams(url.search);
    parser.set('index', index);
    history.pushState(null, '', '?' + parser.toString());

    // Load song    
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['.' + data.file],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function () {
          // For chorus mode
          if (chorusMode.checked && self.playlist[self.index].chorusStartTime) {
            // console.log(self.index + " chorus start")
            data.howl.seek(self.playlist[self.index].chorusStartTime - 1);
            data.howl.fade(0.0, 1.0, 1000);
          }

          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          pauseBtn.style.display = 'block';
        },
        onload: function () {
          loading.style.display = 'none';
        },
        onend: function () {
          self.skip('next');
        },
        onpause: function () {},
        onstop: function () {}
      });
      // Waveform display
      var width = waveform.clientWidth;
      var height = (window.innerHeight > 0) ? window.innerHeight * 0.2 : screen.height * 0.2;
      waveform.style.bottom = (height * 0.1 + 90) + 'px';
      if (animatedWaveform.checked) {
        var accuracy = (width < 400) ? 16 : (width < 550) ? 32 : (width < 950) ? 64 : 128;
        canvas.style.display = 'block';
        waveform.style.opacity = 0.5;
        if (wavesurfer) {
          wavesurfer.destroy();
        }
        vudio = new Vudio(sound._sounds[0]._node, canvas, {
          effect: 'waveform',
          accuracy: accuracy,
          width: width,
          height: height,
          waveform: {
            maxHeight: height / 10 * 9,
            minHeight: 1,
            spacing: 4,
            color: ['#ffffff', '#e0e0e0', ' #c9c9c9'],
            shadowBlur: 1,
            shadowColor: '#939393',
            fadeSide: false,
            prettify: false,
            horizontalAlign: 'center', // left/center/right
            verticalAlign: 'bottom' // top/middle/bottom
          }
        });
        vudio.dance();
      } else {
        canvas.style.display = 'none';
        waveform.style.opacity = 1;
        if (wavesurfer) {
          wavesurfer.destroy();
        }
        wavesurfer = WaveSurfer.create({
          container: '#waveform',
          backend: 'MediaElement',
          barWidth: 3,
          cursorColor: '#b556ff',
          cursorWidth: 1,
          progressColor: '#bf6dff',
          waveColor: '#e0e0e0',
          responsive: true
        });
        wavesurfer.load(sound._sounds[0]._node)
        wavesurfer.on('ready', function () {
          wavesurfer.play();
        });
      }
      waveform.style.cursor = 'pointer';
      var indexTemp = index - 1;
      while (self.playlist[indexTemp].file != null) {
        --indexTemp;
      }
      document.getElementById('series').innerHTML = self.playlist[indexTemp].title;
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display with new song title
    //track.innerHTML = (index + 1) + '. ' + data.title;
    this.updateTitle(index)

    // Play video
    if (videoPlayer.stopped || isNewSong) {
      mvInfo = data.info;
      mvStage = 0;
    } else if (videoPlayer.paused) {
      videoPlayer.play();
    }

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }
  },

  /**
   * Pause the currently playing track.
   */
  pause: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    if (videoPlayer.playing) {
      videoPlayer.pause();
    }

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function (direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev' && self.playlist[self.index].howl && self.playlist[self.index].howl.seek() <= 3) {
      self.playlist[self.index].howl.seek(0);
    } else {
      if (randomPlay.checked) {
        index = Math.floor(Math.random() * self.playlist.length);
      } else {
        if (direction === 'prev') {
          index = self.index - 1;
          if (index < 0) {
            index = self.playlist.length - 1;
          }
        } else {
          index = self.index + 1;
          if (index >= self.playlist.length) {
            index = 0;
          }
        }
      }
      self.skipTo(index);
    }
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function (index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';
    progressNow = 0;

    // Play the new track.
    self.play(index, true);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function (val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function (per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    sound.seek(sound.duration() * per);
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progressNow = (seek / sound.duration());
    progress.style.width = ((progressNow * 100) || 0) + '%';

    // For chorus mode
    if (!chorusFlag && chorusMode.checked &&
      self.playlist[self.index].chorusEndTime &&
      seek >= self.playlist[self.index].chorusEndTime) {
      // console.log(self.index + " chorus end")
      chorusFlag = true;
      sound.fade(1.0, 0.0, 2000);
      setTimeout(function () {
        self.skip('next');
        chorusFlag = false;
      }, 2000);
    } else {
      // If the sound is still playing, continue stepping.
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function () {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function () {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'pure-menu pure-menu-scrollable fadein' : 'pure-menu pure-menu-scrollable fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function () {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function () {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the setting display on/off.
   */
  toggleSetting: function () {
    var self = this;
    var display = (setting.style.display === 'block') ? 'none' : 'block';

    setTimeout(function () {
      setting.style.display = display;
    }, (display === 'block') ? 0 : 500);
    setting.className = (display === 'block') ? 'pure-menu fadein' : 'pure-menu fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function (secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  },

  updateTitle: function(){
    var data = this.playlist[this.index];
    if (!window.lang || window.lang == 'jp') {
      track.innerHTML = data.title;
    }else{
      getTranslatedSong(data.file, window.lang).then((song)=>{
        track.innerHTML =song;

      })
    }
  }
};

var songList = [];
var player;
var vudio;
var wavesurfer;
var chorusFlag = false;

// Update the height of the wave animation.
var resize = function () {
  var width = waveform.clientWidth;
  var height = (window.innerHeight > 0) ? window.innerHeight * 0.2 : screen.height * 0.2;
  waveform.style.bottom = (height * 0.1 + 90) + 'px';
  canvas.width = width;
  canvas.height = height;
  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
    vudio.width = width;
    vudio.height = height;
    var space = Math.floor(Math.abs(width - 500) / 300) + 2;
    var accuracy = (width < 550) ? 32 : (width < 1000) ? 64 : 128;
    // mobile: 320~420
    vudio.setOption({
      accuracy: accuracy,
      waveform: {
        maxHeight: height / 10 * 9,
        //spacing: space
      }
    });
  }
};
window.addEventListener('resize', resize);

var move = function (event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};
volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

firebase.database().ref('games').once('value').then(function (games) {
  games.val().forEach(game => {
    var songObj = {}
    songObj['title'] = game.name;
    songObj['file'] = null;
    songList.push(songObj);
    game.songs.forEach(song => {
      var songObj = {}
      songObj['title'] = song.name.split(".")[1];
      if (songObj['title'] == ' U') {
        songObj['title'] = ' U.N.オーエンは彼女なのか？'
      }
      songObj['file'] = song.path;
      songObj['howl'] = null;
      songObj['info'] = song;
      if (song.chorus_start_time) {
        songObj['chorusStartTime'] = song.chorus_start_time;
      }
      if (song.chorus_end_time) {
        songObj['chorusEndTime'] = song.chorus_end_time;
      }
      songList.push(songObj);
    });
  });
  // Setup our new audio player class and pass it the playlist.
  player = new Player(songList);
  resize();
});

// Bind our player controls.
playBtn.addEventListener('click', function () {
  player.play();
});
pauseBtn.addEventListener('click', function () {
  player.pause();
});
prevBtn.addEventListener('click', function () {
  player.skip('prev');
});
nextBtn.addEventListener('click', function () {
  player.skip('next');
});
waveform.addEventListener('click', function (event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function () {
  player.togglePlaylist();
});
playlist.addEventListener('click', function () {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function () {
  player.toggleVolume();
});
volume.addEventListener('click', function () {
  player.toggleVolume();
});
closePlaylist.addEventListener('click', function () {
  player.togglePlaylist();
});
settingBtn.addEventListener('click', function () {
  player.toggleSetting();
});
animatedWaveform.addEventListener('change', function () {
  // TODO: Instant change waveform 
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function (event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function () {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function () {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function () {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function () {
  window.sliderDown = false;
});

// Image preloader
for (var i = 6; i < 27; i++) {
  imagePreload('./images/title/' + ('00' + i).slice(-2) + '.jpg');
}

// i18n loading
function langChanged() {
let langSelect = document.getElementById('langSelect');
  window.lang = langSelect.value;
  player.updateTitle();
}