var fs = require('fs');
var stock = require('./stock');
var trader = function(cash) {
	this.cash = cash;
	this.portfolio = {};
	this.history = [];
	this.allowNegativeCash = false;
}

trader.prototype.allowNegativeCash = function(boolean) {
	if (boolean == true) {
		trader.allowNegativeCash = true;
	}
	else {
		trader.allowNegativeCash = false;
	}
}

trader.prototype.addCash = function(cashAdded) {
	this.cash += cashAdded;
	this.history.push('Added cash amount: ' + cashAdded);
}

trader.prototype.removeCash = function(cashRemoved) {
	this.cash -= cashRemoved;
	this.history.push('Removed cash amount: ' + cashRemoved);
}

trader.prototype.buy = function(stock, quantity) {
	stock.updateRealTimePrice();
	var thisTrader = this;
	setTimeout(function() {
		var cost = stock.getRealTimePrice() * quantity;
		if (thisTrader.allowNegativeCash === false) {
			if (cost > thisTrader.cash) {
				throw new Error('Cost cannot exceed current balance.');
			}
		}
		if (thisTrader.portfolio[stock.getSymbol()] == undefined) {
			thisTrader.portfolio[stock.getSymbol()] = quantity;
		}
		else {
			thisTrader.portfolio[stock.getSymbol()] += quantity;
		}
		thisTrader.cash -= cost;
		thisTrader.history.push("Bought " + quantity + " shares of " 
							+ stock.getSymbol() + " at " + stock.getRealTimePrice() + " each. Balance: " + thisTrader.cash);
	}, 3000);
}

trader.prototype.sell = function(stock, quantity) {
	stock.updateRealTimePrice();
	var thisTrader = this;
	setTimeout(function() {
		var cost = stock.getRealTimePrice() * quantity;
		if (thisTrader.portfolio[stock.getSymbol()] == undefined) {
			thisTrader.portfolio[stock.getSymbol()] = -1 * quantity;
		}
		else {
			thisTrader.portfolio[stock.getSymbol()] -= quantity;
		}
		thisTrader.cash += cost;
		thisTrader.history.push("Sold " + quantity + " shares of " 
							+ stock.getSymbol() + " at " 
							+ stock.getRealTimePrice() + " each. Balance: " + thisTrader.cash);
	}, 2000);
}

trader.prototype.save = function(fileName) {
	thisTrader = this;
	var stream = fs.createWriteStream(fileName);
	stream.once('open', function() {
		stream.write(thisTrader.cash + '\n');
		for (var stock in thisTrader.portfolio) {
			stream.write(stock + ' ' + thisTrader.portfolio[stock] + '\n');
		}
		stream.write("History\n");
		for (var i = 0; i < thisTrader.history.length; i++) {
			stream.write(thisTrader.history[i] + '\n');
		}
	});
}


