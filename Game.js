module.exports = class Game {
  constructor(players) {
    this.log = [];
    this.players = players;
    this.currentPlayer = 0;
    this.score = [];
    this.dice = '00';
    this.previousDice = '00';
    this.liedDice = '00';
    this.playerLied = false;
    this.rules = [
      '12',
      '13',
      '66',
      '55',
      '44',
      '33',
      '22',
      '11',
      '65',
      '64',
      '63',
      '62',
      '61',
      '54',
      '53',
      '52',
      '51',
      '43',
      '42',
      '41',
      '32'
    ];
    this.isHigherThan = '';
  }

  rollDice() {
    this.playerLied = false;
    this.liedDice = '00';
    this.dice = this.sortDices(this.Random(), this.Random());

    return this.dice;
  }

  sortDices(d1, d2) {
    console.log({
      d1,
      d2
    });

    if (d1 === d2) return '' + d1 + d2;
    if ((d1 === 2 || d1 === 3) && d2 === 1) return '' + d2 + d1;
    if (d1 === 1 && (d2 === 2 || d2 === 3)) return '' + d1 + d2;
    if (d2 > d1) return '' + d2 + d1;
    return '' + d1 + d2;
  }

  Random() {
    return Math.floor(Math.random() * 6) + 1;
  }

  isHigher(dice) {

    console.log({
      first: this.rules.indexOf(dice),
      previousDice: this.rules.indexOf(this.previousDice),
      pre: this.previousDice
    });
    if (this.previousDice !== '00') {

      this.isHigherThan = this.rules.indexOf(dice) < this.rules.indexOf(this.previousDice) || this.rules.indexOf(dice) === this.rules.indexOf(this.previousDice);
      console.log(this.isHigherThan, 'result')
      this.previousDice = dice;
    } else {
      this.isHigherThan = true;
      this.previousDice = dice;
    }
  }

  lift() {
    if (this.playerLied) {
      let lastPlayer = this.currentPlayer === 0 ? this.players.length - 1 : this.currentPlayer - 1;
      this.players[lastPlayer].decrementScore();
      return true;
    } else {
      this.players[this.currentPlayer].decrementScore();

      return false
    }
  }

  endRound() {
    const lastRoundLoser = this.lift();
    this.checkScore();
    if (lastRoundLoser) {
      this.nextPlayer();
    }

    return this.getGameState();
  }
  lostRound() {

    this.players[this.currentPlayer].decrementScore();
    this.checkScore();
    return this.getGameState();
  }
  checkScore() {
    const lostPlayers = this.players.map(player => {
      if (player.getScore() === 0) {
        this.removePlayer(player);
        return player;
      }
    });
    return lostPlayers;
  }

  removePlayer(player) {
    console.log('player', player);
     const toRmv = this.players.findIndex(_player => {return _player.socketId === player.socketId});

     this.players[toRmv].lost = true;

     this.currentPlayer = this.currentPlayer === 0 ? this.players.length - 1 : this.currentPlayer - 1;
  }

  nextPlayer() {
    this.currentPlayer++;
    if (this.currentPlayer > this.players.length - 1) {
      this.currentPlayer = 0;
    }
    if (this.players[this.currentPlayer].lost) this.nextPlayer();
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  setLied(liedDice) {
    const sorted = this.sortDices(liedDice[0], liedDice[1]);
    this.isHigher(sorted)
    console.log({
      sorted,
      isHigher: this.isHigherThan
    });

    if (!this.isHigherThan) {
      return false;
    }
    this.playerLied = true;
    this.liedDice = sorted;
    this.nextPlayer();
    return true;
  }
  getGameState() {
    return {
      players: this.players
    };
  }
};
