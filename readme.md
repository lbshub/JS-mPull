# JS-mPull
移动web：原生滚动的下拉刷新/上拉加载/自动加载

-----------------------------------------

### 使用
```js
// var pull = new mPull(opts);

var pull = new mPull({
	// el: '.list',
	usePullDown: true,
	pullDownOffset: 50,
	pullDown: function() {
		
	},
	pullDownMove: function() {
		
	},
	pullDownCancel: function() {
		
	},
	usePullUp: true,
	pullUpOffset: 50,
	pullUp: function(pullUpOffset) {
		
	},
	pullUpMove: function(distance, pullUpOffset) {
		
	},
	pullUpCancel: function() {

	},
	useAutoLoad: false,
	autoLoad: function() {
		
	}
});

//...
var pull = new mPull();
pull.$on('pullDownMove', function(){

});
pull.$on('pullDownCancel', function() {

});
pull.$on('pullDown', function() {

});
//...

```

### DEMO
index.html
