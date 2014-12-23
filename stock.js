var request = require('request');
var cheerio = require('cheerio');
//arbitrary offsets
var LARGE_OFFSET = 100;
var OFFSET = 17;
//site to scrape for stock metrics
var MAIN_URL = 'http://www.nasdaq.com/symbol/';

var stock = function(symbol) {
	this.symbol = symbol.toUpperCase();
	this.update();
}

//find the next quarter; nasdaq.com only uses these four
function nextMonth(month) {
	var lower = month.toLowerCase();
	if (lower == 'sep') {
		return 'dec';
	}
	else if (lower == 'dec') {
		return 'mar';
	}
	else if (lower == 'mar') {
		return 'jun';
	}
	else {
		return 'sep';
	}
}

//update all certain metrics of a stock
stock.prototype.update = function() {
	var url = MAIN_URL + this.symbol;
	var thisStock = this;
	request(url, function(err, response, html) {
		if (err) {
			throw err;
		}
		else {
			//update price and P/E ratio
			var $ = cheerio.load(html);
			var price = $('.qwidget-dollar').first().text();
			thisStock.price = price.substring(1, price.length);
			var index = html.indexOf('P/E Ratio:');
			var peString = html.substring(index, index + LARGE_OFFSET);
			index = peString.indexOf('\">');
			peString = peString.substring(index + 2, index + OFFSET);
			var end = peString.indexOf('</td');
			thisStock.PE = peString.substring(0, end);
			if (isNaN(thisStock.PE) || thisStock.PE === '') {
				thisStock.PE = 'N/A';
			}
			index = html.indexOf('High /Low');
			var extremes = html.substring(index, index + 2 * LARGE_OFFSET);
			index = extremes.indexOf(';') + 1;
			extremes = extremes.substring(index, index + 2 *OFFSET);
			end = extremes.indexOf('&');
			var high = extremes.substring(0, end);
			thisStock.yearHigh = high;
			index = extremes.indexOf('$&') + 7;
			end = extremes.indexOf('<');
			var low = extremes.substring(index, end);
			thisStock.yearLow = low;
		}
	});
	thisStock.updateRealTimePrice();
	thisStock.updateForecast();
}

//update the realTimePrice
stock.prototype.updateRealTimePrice = function() {
	thisStock = this;
	var realUrl = MAIN_URL + this.symbol + '/real-time';
	request(realUrl, function(err, response, html) {
		if (err) {
			throw err;
		}
		else {
			var $ = cheerio.load(html);
			var price = $('.qwidget-dollar').first().text();
			thisStock.realTimePrice = price.substring(1, price.length);
		}
	});
}

//update earnings estimate for coming quarters and year
stock.prototype.updateForecast = function() {
	var url = MAIN_URL + this.symbol + '/earnings-forecast';
	var thisStock = this;
	request(url, function(err, response, html) {
		if (err) {
			throw err;
		}
		else {
			var date = new Date();
			var nextYear = date.getFullYear() + 1;
			var $ = cheerio.load(html);
			var nextYearEstimate = $('.genTable').children().first().text();
			var index = nextYearEstimate.indexOf(nextYear);
			nextYearEstimate = nextYearEstimate.substring(index + OFFSET, index + OFFSET + LARGE_OFFSET);
			var estimates = nextYearEstimate.split('\n');
			thisStock.nextYear = estimates[0].replace(/\s+/g, '');
			var quarters = $('.genTable').next().next().first().text();
			index = quarters.indexOf('Down');
			currentQuarter = quarters.substring(index, index + 2 * LARGE_OFFSET);
			index = currentQuarter.indexOf('.');
			currentQuarter = currentQuarter.substring(index - OFFSET, index + OFFSET);
			var nextEst = currentQuarter.replace(/\s+/g, '');
			thisStock.currentQuarter = nextEst;
			index = quarters.indexOf(nextEst);
			var next =  quarters.substring(index + 3* LARGE_OFFSET, index + 4 * LARGE_OFFSET);
			next = next.split('\n');
			thisStock.nextQuarter = next[0].replace(/\s+/g, '');
			if (isNaN(thisStock.nextYear) || thisStock.nextYear === '') {
				thisStock.nextYear = 'N/A';
			}
			if (isNaN(thisStock.currentQuarter) || thisStock.currentQuarter === '') {
				thisStock.currentQuarter = 'N/A';
			}
			if (isNaN(thisStock.nextQuarter) || thisStock.nextQuarter === '') {
				thisStock.nextQuarter = 'N/A';
			}
		}
	});
}

//return stock's symbol
stock.prototype.getSymbol = function() {
	return this.symbol;
}

//return stock's real time price
stock.prototype.getRealTimePrice = function() {
	return this.realTimePrice;
}

//return stock's price delayed by at least 15 minutes; updates
//will bring delay to 15 min
stock.prototype.getDelayedPrice = function() {
	return this.price;
}


//return stock's P/E ratio
stock.prototype.getPE = function() {
	return this.PE;
}

//return stock's 52 week high
stock.prototype.getYearHigh = function() {
	return this.yearHigh;
}

//return stock's 52 week low
stock.prototype.getYearLow = function() {
	return this.yearLow;
}

//return stock's coming quarter's earning estimate
stock.prototype.getCurrentQuarter = function() {
	return this.currentQuarter;
}

//return stock's earning estimate for the quarter after the immediate one (the quarter after the current one)
stock.prototype.getNextQuarter = function() {
	return this.nextQuarter;
}


//return stock's annual earning estimate for the next year
stock.prototype.getNextYear = function() {
	return this.nextYear;
}

stock.prototype.printAll = function() {
	console.log('Stock Symbol: ' + this.symbol);
	console.log('Real Time Price: ' + this.realTimePrice);
	console.log('Delayed Price: ' + this.price);
	console.log('P/E Ratio: ' + this.PE);
	console.log('52 Week High: ' + this.yearHigh);
	console.log('52 Week Low: ' + this.yearLow);
	console.log('Coming Quarter Earnings Estimate: ' + this.currentQuarter);
	console.log('Next Quarter Earnings Estimate: ' + this.nextQuarter);
	console.log('Next Year Earnings Estimates: ' + this.nextYear);
}


module.exports = stock;

//example 


/*var atw = new stock('atw');
setTimeout(function() {
	atw.printAll();

}, 3000);*/