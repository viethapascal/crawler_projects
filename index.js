var express = require('express');
var cheerio = require('cheerio');
var request = require('request');
var exphbs  = require('express-handlebars');
var fs 		= require('fs');
var phantom = require('phantom');
var promise = require('bluebird');
var _ph, _page, _res;
var _ph2, _page2, _res2;
var app = express();
var hbs = exphbs.create({});
var bodyParser = require('body-parser');

var res_products = [];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use('/static',express.static(__dirname+'/static'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
//var url = 'https://www.3m.com.vn/3M/vi_VN/company-vn/all-3m-products/?N=5002385+8709313+8711017';

///===promiseWhile
//=====
function process_post(url, res){
	var url = url;
	var products = [];
	var index = 1;
	phantom.create().then(function(ph){
		_ph = ph;
		console.log("created!");
		return _ph.createPage();
	}).then(function(page){
		_page = page;
		return _page.open(url);
	}).then(function(status){
		return _page.property('content');
	}).then(function(content){
		var $ = cheerio.load(content);
		console.log()
		$('#js-ajax-target li').each(function(e, el){
			var item = {
				stt: index++,
				src: $(el).find('img').attr('src'),
				name: $(el).find('span').text()
			}
			console.log(item);
			products.push(item);
		});
		var tmp = $('[class=MMM--pagination]' );
		var next = $(tmp).find('a').attr('data-url');
		_page.close();
		console.log(tmp.length);
		loop_page(tmp,next);
		function loop_page(tmp, next){
				console.log("redirect:", next);
				var newph = phantom.create().then(function(ph){
				p=ph;
				return p.createPage();
				}).then(function(page){
					_pg = page;
					return _pg.open(next);
				}).then(function(status){
					return _pg.property('content');
				}).then(function(_content){
					var q = cheerio.load(_content);
					q('#js-ajax-target li').each(function(e, el){
						var item = {
							stt: index++,
							src: q(el).find('img').attr('src'),
							name: q(el).find('span').text()
						}
						console.log(item);
						products.push(item);
					});
					tmp = q('.MMM--pagination')[1];
					next = q(tmp).find('a').attr('data-url');
					console.log("next:",next)
					if (q(tmp).find('a').length==1) {
						_pg.close();
						loop_page(tmp, next);
					}else {
						console.log("end!");
						res_products = products;
						res.redirect('/');
						return;
					}
				})
			};
	}).catch(function(e){
		console.log(e);
	});

}


// async function ahihi(){
// 	var instance = await phantom.create();
// 	var page = await instance.createPage();
// 	var staus = await page.open(url);
// 	var content = await page.property('content');
// 	var $ = await cheerio.load(content);
// 	$('#js-ajax-target li').each(function(e, el){
// 		var item = {
// 			stt: e+1,
// 			src: $(el).find('img').attr('src'),
// 			name: $(el).find('span').text()
// 		}
// 		console.log(item);
// 		products.push(item);
// 	});
// 	await instance exit();
// }();
function renderPage(products, res){
	res.render('index',{products:products});
}
app.post('/upload', function(req, res){
	url = req.body.input_url;
	process_post(url, res);
	
});
app.get('/', function(req, res){
	renderPage(res_products, res)
});

var server = app.listen(9999);