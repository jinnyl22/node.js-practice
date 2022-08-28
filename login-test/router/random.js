let randomarr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const randomobj = {
  randomfunc: function random() {
    var randomNumber = "";
    for (let i = 0; i < 6; i++) {
      let randomgetnumber = Math.floor(Math.random() * 10);
      randomNumber += randomarr[randomgetnumber];
    }
    return randomNumber;
  },
};

module.exports = randomobj;
