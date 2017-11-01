/**
 * LBS mPull
 * Date: 2016-10-25
 * ===================================================
 * *选项 属性*
 * opts.el 绑定事件容器对象(一个字符串的CSS选择器或者元素对象)
 * opts.usePullDown 是否开启下(拉/滑)模式 默认false
 * opts.usePullUp 是否开启上(拉/滑)模式 默认false
 * opts.pullDownOffset 下(拉/滑)偏移值 默认 50
 * opts.pullUpOffset 上(拉/滑)偏移值 默认 50 
 * opts.useAutoLoad 是否开启自动加载模式 默认false
 * ****************************************************
 * *选项 方法*
 * opts.pullDownMove 下拉/滑(touchmove 不停触发)
 * opts.pullDownCancel 下拉/滑-取消(touchend 触发一次)
 * opts.pullDown 下拉/滑-结束(touchend 触发一次)
 * opts.pullUpMove 上拉/滑(touchmove 不停触发)
 * opts.pullUpCancel 上拉/滑-取消(touchend 触发一次)
 * opts.pullUp 上拉/滑-结束(touchend 触发一次)
 * opts.autoLoad 滚动到底部时自动加载(触发一次)
 * ===================================================
 * *实例 属性|方法*
 * this.$locked 设置为true在滑动中会阻止默认浏览器滚动 
 * this.$animate(el,prop,to,time) 使用css3 transition改变元素
 * this.$destroy(event) 销毁事件(event为 'pullDown' 'pullUp' 'autoLoad')
 * this.$on(type, fn) 增加一个(type)事件函数
 * this.$off(type, fn) 移除一个(type)事件函数
 * ===================================================
 * (type)事件类型 - 对应(选项方法)
 * pullDownMove pullDownCancel pullDown
 * pullUpMove pullUpCancel pullUp
 * autoLoad 
 * ===================================================
 **/
(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && (define.amd || define.cmd) ? define(factory) :
		(global.mPull = factory());
}(this, (function() {
	'use strict';

	var utils = (function() {
		var doc = document.documentElement;
		var body = document.body;

		function on(el, type, fn) {
			var uCapture = type === 'touchmove' ? {
				passive: false, // 解决谷歌浏览器版本(>=56) preventDefault() 失效问题
				capture: false
			} : false;
			return el.addEventListener(type, fn, uCapture);
		}

		function off(el, type, fn) {
			return el.removeEventListener(type, fn, false);
		}

		function scrollTop(topValue) {
			if (topValue != undefined) {
				doc.scrollTop = topValue;
				body.scrollTop = topValue;
				return;
			}
			var top = doc.scrollTop || body.scrollTop;
			if (document.compatMode != 'CSS1Compat') {
				top = body.scrollTop;
			}
			return top;
		}

		function scrollHeight() {
			var height = doc.scrollHeight || body.scrollHeight;
			if (document.compatMode != 'CSS1Compat') {
				height = body.scrollHeight;
			}
			return height;
		}

		function clientHeight() {
			var height = doc.clientHeight || body.clientHeight;
			if (document.compatMode != 'CSS1Compat') {
				height = body.clientHeight;
			}
			return height;
		}

		return {
			on: on,
			off: off,
			scrollTop: scrollTop,
			scrollHeight: scrollHeight,
			clientHeight: clientHeight
		};
	}());

	var mPull = function(opts) {
		opts = opts || {};
		this.wrapper = document.querySelector(opts.el) || document.querySelector('body');

		this.usePullDown = opts.usePullDown || false;
		this.usePullUp = opts.usePullUp || false;
		this.useAutoLoad = opts.useAutoLoad || false;
		this.pullDownOffset = opts.pullDownOffset || 50;
		this.pullUpOffset = opts.pullUpOffset || 50;

		this.autoLoad = opts.autoLoad || function() {};
		this.pullDown = opts.pullDown || function() {};
		this.pullDownMove = opts.pullDownMove || function() {};
		this.pullDownCancel = opts.pullDownCancel || function() {};
		this.pullUp = opts.pullUp || function() {};
		this.pullUpMove = opts.pullUpMove || function() {};
		this.pullUpCancel = opts.pullUpCancel || function() {};

		this._events = {};
		this._init();
	};
	mPull.prototype = {
		_init: function() {
			this._initEvent();
		},
		_initEvent: function() {
			utils.on(this.wrapper, 'touchstart', this._start.bind(this));
			utils.on(this.wrapper, 'touchmove', this._move.bind(this));
			utils.on(this.wrapper, 'touchend', this._end.bind(this));

			if (this.useAutoLoad) {
				this.__scroll = this._scroll.bind(this);
				utils.on(window, 'scroll', this.__scroll);
				this.$on('autoLoad', this.autoLoad);
			}

			this.$on('pullDown', this.pullDown);
			this.$on('pullDownMove', this.pullDownMove);
			this.$on('pullDownCancel', this.pullDownCancel);

			this.$on('pullUp', this.pullUp);
			this.$on('pullUpMove', this.pullUpMove);
			this.$on('pullUpCancel', this.pullUpCancel);
		},
		_start: function(e) {
			if (!e.touches) return;

			this.scrollTop = utils.scrollTop();
			this.maxHeight = utils.scrollHeight() - utils.clientHeight();
			this.startX = e.touches[0].pageX;
			this.startY = e.touches[0].pageY;

			if (this.scrollTop == 0) {
				this.hasPullDown = true;
			} else {
				this.hasPullDown = false;
			}

			if (this.scrollTop == this.maxHeight) {
				this.hasPullUp = true;
			} else {
				this.hasPullUp = false;
			}

			this.fixed = '';
			this.deltaX = this.deltaY = 0;
			this.isPullDown = this.isPullUp = false;
		},
		_move: function(e) {
			if (!e.touches) return;
			if (this.$locked) {
				return e.preventDefault();
			}

			this.deltaX = e.touches[0].pageX - this.startX;
			this.deltaY = e.touches[0].pageY - this.startY;

			if (this.usePullDown && this.hasPullDown && this.deltaY > 0) {
				e.preventDefault();
			}

			if (this.usePullUp && this.hasPullUp && this.deltaY < 0) {
				e.preventDefault();
			}

			if (this.fixed === '') {
				if (Math.abs(this.deltaY) > Math.abs(this.deltaX)) {
					this.fixed = 'top';
				} else {
					this.fixed = 'left';
				}
			}

			if (this.hasPullDown || this.hasPullUp) {
				this.deltaY /= 3;
			}

			if (this.fixed === 'top') {
				this._pullStart(e);
			}
		},
		_end: function(e) {
			if (!e.changedTouches) return;
			if (this.fixed === 'top') {
				this._pullEnd();
			}
		},
		_pullStart: function(e) {
			if (!!this.usePullDown && this.hasPullDown && this.deltaY > 0) {
				utils.scrollTop(0);
				this.isPullDown = (this.deltaY >= this.pullDownOffset) ? true : false;
				return this._trigger('pullDownMove', this.deltaY, this.pullDownOffset);
			}

			if (!!this.usePullUp && this.hasPullUp && this.deltaY < 0) {
				utils.scrollTop(this.maxHeight - this.deltaY);
				this.isPullUp = (this.deltaY <= -this.pullUpOffset) ? true : false;
				return this._trigger('pullUpMove', Math.abs(this.deltaY), this.pullUpOffset);
			}
		},
		_pullEnd: function() {
			if (!!this.hasPullDown && this.deltaY < this.pullDownOffset) {
				return this._trigger('pullDownCancel');
			}

			if (!!this.isPullDown) {
				return this._trigger('pullDown', this.pullDownOffset);
			}

			if (!!this.hasPullUp && this.deltaY > -this.pullUpOffset) {
				return this._trigger('pullUpCancel');
			}

			if (!!this.isPullUp) {
				return this._trigger('pullUp', this.pullUpOffset);
			}
		},
		_scroll: function() {
			clearTimeout(this.timer)
			this.timer = setTimeout(function() {
				if (utils.scrollTop() == utils.scrollHeight() - utils.clientHeight()) {
					this._trigger('autoLoad');
				}
			}.bind(this), 100);
		},
		_trigger: function(type) {
			if (!this._events[type]) return;
			var i = 0,
				l = this._events[type].length;
			if (!l) return;
			for (; i < l; i++) {
				this._events[type][i].apply(this, [].slice.call(arguments, 1));
			}
		},
		$on: function(type, fn) {
			if (!this._events[type]) this._events[type] = [];
			this._events[type].push(fn);
		},
		$off: function(type, fn) {
			if (!this._events[type]) return;
			if (fn == undefined) {
				return this._events[type] = [];
			}
			var index = this._events[type].indexOf(fn);
			if (index > -1) {
				this._events[type].splice(index, 1);
			}
		},
		$destroy: function(event) {
			switch (event) {
				case 'pullDown':
					this.$off('pullDownMove');
					this.$off('pullDownCancel');
					this.$off('pullDown');
					break;
				case 'pullUp':
					this.$off('pullUpMove');
					this.$off('pullUpCancel');
					this.$off('pullUp');
					break;
				case 'autoLoad':
					this.$off('scrollEnd');
					utils.off(window, 'scroll', this.__scroll);
					break;
			};
		},
		$animate: function(el, prop, to, time) {
			time = time || 0;
			el.style['transition' || 'webkitTransition'] = 'all ' + time + 'ms';
			el.style[prop] = to;
		}
	};
	return mPull;
})));