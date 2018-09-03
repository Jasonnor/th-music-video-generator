// Cache references to DOM elements.
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'waveform', 'canvas', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
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
  do {
    this.index = Math.floor(Math.random() * playlist.length);
  } while (playlist[this.index].file == null);

  // Display the title of the first track.
  track.innerHTML = playlist[this.index].title;
  changeImage(playlist[this.index].info, false);

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
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function (index, isNewSong) {
    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    // Keep track of the index we are currently playing.
    self.index = index;
    console.log('Playing index ' + index);

    // Skip song not exist
    var data = self.playlist[index];
    if (data.file == null) {
      self.skip('next');
      return;
    }

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['.' + data.file],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function () {
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
      var width = window.innerWidth;
      var height = window.innerHeight * 0.3;
      vudio = new Vudio(sound._sounds[0]._node, canvas, {
        effect: 'waveform',
        accuracy: 512, // 16-16348
        width: width,
        height: height,
        waveform: {
          maxHeight: height / 2 - 4,
          minHeight: 1,
          spacing: 3,
          color: ['#ffffff', '#e0e0e0', ' #c9c9c9'],
          shadowBlur: 1,
          shadowColor: '#939393',
          fadeSide: true,
          prettify: false,
          horizontalAlign: 'center', // left/center/right
          verticalAlign: 'bottom' // top/middle/bottom
        }
      });
      vudio.dance();
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    //track.innerHTML = (index + 1) + '. ' + data.title;
    track.innerHTML = data.title;

    // Play video
    if (videoPlayer.stopped || isNewSong) {
      changeImage(data.info, true);
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

    self.skipTo(index);
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
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
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

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
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
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function (secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

var songList = [];
var player;
var vudio;

// Update the height of the wave animation.
var resize = function () {
  var width = window.innerWidth;
  var height = window.innerHeight * 0.3;
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
