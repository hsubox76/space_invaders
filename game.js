;(function() {
  var Game = function(canvasId, runGame) {
    document.getElementById("gameover").style.opacity = "0";
    var canvas = document.getElementById(canvasId);
    var screen = canvas.getContext('2d');
    var gameSize = { x: canvas.width, y: canvas.height };
    this.runGame = runGame || false;

    this.bodies = createInvaders(this).concat(new Player(this, gameSize));

    var self = this;
    document.getElementById("start").onclick = function() {
      self.runGame = true;
    };

    loadSound("laser.mp3", function (shootSound) {
      self.shootSound = shootSound;
      var tick = function () {
        if (self.runGame) {
          self.update();
          self.draw(screen, gameSize);
        }
        requestAnimationFrame(tick);
      };

      tick();
    });

  };

  Game.prototype = {

    update: function () {
      var bodies = this.bodies;
      var playerThere = false;
      var invaderThere = false;
      var notCollidingWithAnything = function (b1) {
        return bodies.filter(function(b2) { return colliding (b1,b2); }).length === 0;
      };

      this.bodies = this.bodies.filter(notCollidingWithAnything);

      for (var i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i] instanceof Player) {
          playerThere = true;
        }
        if (this.bodies[i] instanceof Invader) {
          invaderThere = true;
        }
        this.bodies[i].update();
      }
      if (!playerThere) {
        document.getElementById("gameover").style.opacity = "1";
        this.runGame = false;
        document.getElementById("start").innerHTML = "Play Again?";
        document.getElementById("gameover").innerHTML = "GAME OVER";
        document.getElementById("start").onclick = function() {
          new Game('screen', true);
        };
      }
      if (!invaderThere) {
        document.getElementById("gameover").style.opacity = "1";
        this.runGame = false;
        document.getElementById("start").innerHTML = "Play Again?";
        document.getElementById("gameover").innerHTML = "PLAYER WINS";
        document.getElementById("start").onclick = function() {
          new Game('screen', true);
        };
      }
    },

    draw: function(screen, gameSize) {
      screen.clearRect(0, 0, gameSize.x, gameSize.y);
      for (var i = 0; i < this.bodies.length; i++) {
        var holes = this.bodies[i].holes || 0;
        drawRect(screen, this.bodies[i], this.bodies[i].color, holes);
      }
    },

    addBody: function (body) {
      this.bodies.push(body);
    },

    invadersBelow: function(invader) {
      return this.bodies.filter(function(b) {
        return b instanceof Invader &&
          b.center.y > invader.center.y &&
          b.center.x - invader.center.x < invader.size.x;
      }).length > 0;
    }
  };

  var Bullet = function(center, velocity) {
    this.size = {x:3, y:3};
    this.center = center;
    this.velocity = velocity;
    this.color = "#0099cc";
  };

  Bullet.prototype = {
    update: function () {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
    }
  };

  var InvaderBullet = function(center, velocity) {
    this.size = {x:3, y:3};
    Bullet.call(this, center, velocity);
    this.color = "#cc3300";
  };

  InvaderBullet.prototype = Object.create(Bullet.prototype);
  InvaderBullet.prototype.constructor = InvaderBullet;

  var Player = function(game, gameSize) {
    this.game = game;
    this.size = { x: 15, y: 15};
    this.center = { x: gameSize.x / 2, y: gameSize.y - this.size.x };
    this.keyboarder = new Keyboarder();
    this.color = "#0066aa";
  };

  Player.prototype = {
    update: function() {
      if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
        this.center.x -= 2;
      } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
        this.center.x += 2;
      }

      if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
        var bullet = new Bullet({ x: this.center.x, y: this.center.y - this.size.x / 2},
          {x: 0, y: -6});
        this.game.addBody(bullet);
        this.game.shootSound.load();
        this.game.shootSound.play();
      }
    }
  };

  var Invader = function(game, center) {
    this.game = game;
    this.size = { x: 15, y: 15};
    this.center = center;
    this.patrolX = 0;
    this.speedX = 0.3;
    this.holes = Math.floor((Math.random() * 3));
    var rgbVal = Math.floor((Math.random() * 150));
    this.color = 'rgb(' + rgbVal + ',' + rgbVal + ','+ rgbVal + ')';
  };

  Invader.prototype = {
    update: function () {
      if (this.patrolX < 0 || this.patrolX > 40) {
        this.speedX = -this.speedX;
      }

      this.center.x += this.speedX;
      this.patrolX += this.speedX;

      if (Math.random() > 0.995 && !this.game.invadersBelow(this)) {
        var bullet = new InvaderBullet({ x: this.center.x, y: this.center.y + this.size.x / 2},
          {x: Math.random() - 0.5, y: 6});
        this.game.addBody(bullet);
      }
    }
  };

  var createInvaders = function(game) {
    var invaders = [];
    for (var i = 0; i < 24; i++) {
      var x = 30 + (i % 8) * 30;
      var y = 30 + (i % 3) * 30;
      invaders.push(new Invader(game, {x: x, y: y}));
    }
    return invaders;
  };

  var drawRect = function(screen, body, color, holes) {
    screen.fillStyle = color || '#000000';
    screen.fillRect(body.center.x - body.size.x / 2,
                    body.center.y - body.size.y / 2,
                    body.size.x, body.size.y);
    screen.fillStyle = '#fff';
    if (holes === 1) {
      screen.fillRect(body.center.x - body.size.x / 4,
                      body.center.y - body.size.y / 4,
                      body.size.x/2, body.size.y/4);
    } else if (holes === 2) {
      screen.fillRect(body.center.x - body.size.x / 3,
                      body.center.y - body.size.y / 3,
                      body.size.x/4, body.size.y/4);
      screen.fillRect(body.center.x + body.size.x / 9,
                      body.center.y - body.size.y / 3,
                      body.size.x/4, body.size.y/4);
    }
  };

  var Keyboarder = function() {
    var keyState = {};

    window.onkeydown = function (e) {
      keyState[e.keyCode] = true;
    };

    window.onkeyup = function (e) {
      keyState[e.keyCode] = false;
    };

    this.isDown = function(keyCode) {
      return keyState[keyCode] === true;
    };

    this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32};
  };

  var loadSound = function(url, callback) {
    var loaded = function() {
      callback(sound);
      sound.removeEventListener('canplaythrough', loaded);
    };
    var sound = new Audio(url);
    sound.addEventListener('canplaythrough', loaded);
    sound.load();
  };

  var colliding = function(b1, b2) {
    return !(b1 === b2 ||
            b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x /2 ||
            b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y /2 ||
            b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x /2 ||
            b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y /2);
  };

  window.onload = function() {
    new Game("screen");
  };
})();