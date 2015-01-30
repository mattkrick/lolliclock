/*!
 * ClockPicker v0.0.7 (http://weareoutman.github.io/clockpicker/)
 * Copyright 2014 Wang Shenwei.
 * Licensed under MIT (https://github.com/weareoutman/clockpicker/blob/gh-pages/LICENSE)
 */

;(function(){
	var $ = window.jQuery,
		$win = $(window),
		$doc = $(document),
		$body;
		
	// Default options
	ClockPicker.DEFAULTS = {
		'default': '',       // default time, 'now' or '13:14' e.g.
		fromnow: 0,          // set default time to * milliseconds from now (using with default = 'now')
		placement: 'bottom', // clock popover placement
		align: 'left',       // popover arrow align
		donetext: 'none',    // done button text
		autoclose: false,    // auto close when minute is selected
		twelvehour: true, // change to 12 hour AM/PM clock from 24 hour
		vibrate: true        // vibrate the device when dragging clock hand
	};

	// Can I use inline svg ?
	var svgNS = 'http://www.w3.org/2000/svg',
		svgSupported = 'SVGAngle' in window && (function(){
			var supported,
				el = document.createElement('div');
			el.innerHTML = '<svg/>';
			supported = (el.firstChild && el.firstChild.namespaceURI) == svgNS;
			el.innerHTML = '';
			return supported;
		})();

	// Can I use transition ?
	var transitionSupported = (function(){
		var style = document.createElement('div').style;
		return 'transition' in style ||
			'WebkitTransition' in style ||
			'MozTransition' in style ||
			'msTransition' in style ||
			'OTransition' in style;
	})();

	// Listen touch events in touch screen device, instead of mouse events in desktop.
	var touchSupported = 'ontouchstart' in window,
		mousedownEvent = 'mousedown' + ( touchSupported ? ' touchstart' : ''),
		mousemoveEvent = 'mousemove.clockpicker' + ( touchSupported ? ' touchmove.clockpicker' : ''),
		mouseupEvent = 'mouseup.clockpicker' + ( touchSupported ? ' touchend.clockpicker' : '');

	// Vibrate the device if supported
	var vibrate = navigator.vibrate ? 'vibrate' : navigator.webkitVibrate ? 'webkitVibrate' : null;

	function createSvgElement(name) {
		return document.createElementNS(svgNS, name);
	}

	function leadingZero(num) {
		return (num < 10 ? '0' : '') + num;
	}

	// Get a unique id
	var idCounter = 0;
	function uniqueId(prefix) {
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	}

	// Clock size
	var dialRadius = 84,
		radius = 70,
		tickRadius = 12,
		diameter = dialRadius * 2,
		duration = transitionSupported ? 350 : 1;

	// Popover template
	var tpl = [
		'<div class="popover clockpicker-popover">',
			'<div class="arrow"></div>',
			'<div class="lolliclock-header">',
				'<div class="lolliclock-time">',
					'<div class="lolliclock-hours text-primary">',
						'<div class="lolliclock-hours-old"></div>',
						'<div class="lolliclock-hours-new"></div>',
					'</div>',
					'<span class="lolliclock-colon">:</span>',
					'<div class="lolliclock-minutes text-primary">',
						'<div class="lolliclock-minutes-old">00</div>',
						'<div class="lolliclock-minutes-new"></div>',
					'</div>',
				'</div>',
				'<span class="lolliclock-am-pm"></span>',
			'</div>',
			'<div class="popover-content">',
				'<div class="lolliclock-plate">',
					'<div class="lolliclock-canvas"></div>',
					'<div class="lolliclock-dial lolliclock-dial-hours"></div>',
					'<div class="lolliclock-dial lolliclock-dial-minutes lolliclock-dial-out"></div>',
				'</div>',
				'<div class="lolliclock-ampm-block">',
					'<div id="lolliclock-btn-am" class="lolliclock-ampm-btn">',  
						'<div class="lolliclock-btn-background"></div>',
						'<div class="lolliclock-btn-text">AM</div>',
						'</div>',
					'<div style="flex: 1;"></div>',
					'<div id="lolliclock-btn-pm" class="lolliclock-ampm-btn">',
						'<div class="lolliclock-btn-background"></div>',
						'<div class="lolliclock-btn-text">PM</div>',
					'</div>',
				'</div>',
			'</div>',
		'</div>'
	].join('');
	// ClockPicker
	function ClockPicker(element, options) {
		var popover = $(tpl),
			plate = popover.find('.lolliclock-plate'),
			hoursView = popover.find('.lolliclock-dial-hours'),
			minutesView = popover.find('.lolliclock-dial-minutes'),
			isInput = element.prop('tagName') === 'INPUT',
			input = isInput ? element : element.find('input'),
			self = this,
			timer;
		this.id = uniqueId('cp');
		this.element = element;
		this.options = options;
		this.isAppended = false;
		this.isShown = false;
		this.currentView = 'hours';
		this.isInput = isInput;
		this.input = input;
		this.popover = popover;
		this.plate = plate;
		this.hoursView = hoursView;
		this.minutesView = minutesView;
		// this.amPmBlock = popover.find('.lolliclock-ampm-block');
		this.spanHours = popover.find('.lolliclock-hours');
		this.spanMinutes = popover.find('.lolliclock-minutes');
		this.spanAmPm = popover.find('.lolliclock-am-pm');
		this.amOrPm = "PM";
		this.AmPmButtons = popover.find('.lolliclock-ampm-btn');
		this.amButton = popover.find('#lolliclock-btn-am');
		this.pmButton = popover.find('#lolliclock-btn-pm');
		
		if (! options.autoclose) {
			// If autoclose is not setted, append a button
			$('<button type="button" class="btn btn-sm btn-default btn-block clockpicker-button">' + options.donetext + '</button>')
				.click($.proxy(this.done, this))
				.appendTo(popover);
		}

		// Placement and arrow align - make sure they make sense.
		if ((options.placement === 'top' || options.placement === 'bottom') && (options.align === 'top' || options.align === 'bottom')) options.align = 'left';
		if ((options.placement === 'left' || options.placement === 'right') && (options.align === 'left' || options.align === 'right')) options.align = 'top';

		popover.addClass(options.placement);
		popover.addClass('clockpicker-align-' + options.align);

		// Show or toggle
		input.on('focus.clockpicker click.clockpicker', $.proxy(this.show, this));

		// Build ticks
		var tickTpl = $('<div class="lolliclock-tick"></div>'),
			i, tick, radian;

		// Hours view
			for (i = 1; i < 13; i += 1) {
				tick = tickTpl.clone();
				radian = i / 6 * Math.PI;
				tick.css({
					left: dialRadius + Math.sin(radian) * radius - tickRadius,
					top: dialRadius - Math.cos(radian) * radius - tickRadius
				});
				tick.html(i);
				hoursView.append(tick);
				tick.on(mousedownEvent, mousedown);
			}

		// Minutes view
		for (i = 0; i < 60; i += 5) {
			tick = tickTpl.clone();
			radian = i / 30 * Math.PI;
			tick.css({
				left: dialRadius + Math.sin(radian) * radius - tickRadius,
				top: dialRadius - Math.cos(radian) * radius - tickRadius
			});
			tick.html(leadingZero(i));
			minutesView.append(tick);
			tick.on(mousedownEvent, mousedown);
		}

		// Go to closest tick
		plate.on(mousedownEvent, function(e){
			// if ($(e.target).closest('.clockpicker-tick').length === 0) {
				mousedown(e);
			// }
		});

		// Mousedown or touchstart
		function mousedown(e) {
			var offset = plate.offset(),
				isTouch = /^touch/.test(e.type),
				x0 = offset.left + dialRadius,
				y0 = offset.top + dialRadius,
				dx = (isTouch ? e.originalEvent.touches[0] : e).pageX - x0,
				dy = (isTouch ? e.originalEvent.touches[0] : e).pageY - y0,
				z = Math.sqrt(dx * dx + dy * dy),
				moved = false;

			// When clicking on minutes view space, check the mouse position
			if (z < radius - tickRadius || z > radius + tickRadius) {
				return;
			}
			e.preventDefault();
			$body.addClass('clockpicker-moving');

			// Place the canvas to top
			if (svgSupported) {
				plate.append(self.canvas);
			}

			// Clock
			self.setHand(dx, dy);

			// Mousemove on document
			$doc.off(mousemoveEvent).on(mousemoveEvent, function(e){
				e.preventDefault();
				var isTouch = /^touch/.test(e.type),
					x = (isTouch ? e.originalEvent.touches[0] : e).pageX - x0,
					y = (isTouch ? e.originalEvent.touches[0] : e).pageY - y0;
				if (! moved && x === dx && y === dy) {
					// Clicking in chrome on windows will trigger a mousemove event
					return;
				}
				moved = true;
				self.setHand(x, y);
			});

			// Mouseup on document
			$doc.off(mouseupEvent).on(mouseupEvent, function(e){
				$doc.off(mouseupEvent);
				e.preventDefault();
				var isTouch = /^touch/.test(e.type),
					x = (isTouch ? e.originalEvent.changedTouches[0] : e).pageX - x0,
					y = (isTouch ? e.originalEvent.changedTouches[0] : e).pageY - y0;
				if (x === dx && y === dy) {
					self.setHand(x, y);
				}
				if (self.currentView === 'hours') {
					self.toggleView('minutes', duration / .002);

					// Edit here if you want to put an auto-grabber on minutes
				} else {
					if (options.autoclose) {
						self.minutesView.addClass('lolliclock-dial-out');
						setTimeout(function(){
							self.done();
						}, duration / 2);
					}
				}
				plate.prepend(canvas);

				// Reset cursor style of body
				// clearTimeout(movingTimer);
				$body.removeClass('clockpicker-moving');
				if (self.currentView !== 'hours') {
					
				}
				// Unbind mousemove event
				$doc.off(mousemoveEvent);
			});
		}

		if (svgSupported) {
			// Draw clock hands and others
			var canvas = popover.find('.lolliclock-canvas'),
				svg = createSvgElement('svg');
			svg.setAttribute('class', 'clockpicker-svg');
			svg.setAttribute('width', diameter);
			svg.setAttribute('height', diameter);
			var g = createSvgElement('g');
			g.setAttribute('transform', 'translate(' + dialRadius + ',' + dialRadius + ')');
			var bearing = createSvgElement('circle');
			bearing.setAttribute('class', 'lolliclock-bearing');
			bearing.setAttribute('cx', 0);
			bearing.setAttribute('cy', 0);
			bearing.setAttribute('r', 1.25);
			var hand = createSvgElement('line');
			hand.setAttribute('x1', 0);
			hand.setAttribute('y1', 0);
			var bg = createSvgElement('circle');
			bg.setAttribute('class', 'lolliclock-canvas-bg');
			bg.setAttribute('r', tickRadius);
			var fg = createSvgElement('circle');
			fg.setAttribute('class', 'lolliclock-canvas-fg');
			fg.setAttribute('r', 3.5);
			g.appendChild(hand);
			g.appendChild(bg);
			g.appendChild(fg);
			g.appendChild(bearing);
			svg.appendChild(g);
			canvas.append(svg);

			this.hand = hand;
			this.bg = bg;
			this.fg = fg;
			this.bearing = bearing;
			this.g = g;
			this.canvas = canvas;
		}

		raiseCallback(this.options.init);
	}

	function raiseCallback(callbackFunction) {
		if (callbackFunction && typeof callbackFunction === "function") {
			callbackFunction();
		}
	}

	// Show or hide popover
	ClockPicker.prototype.toggle = function(){
		this[this.isShown ? 'hide' : 'show']();
	};

	ClockPicker.prototype.changeAmPm = function(isAmOrPm) {
		if (!!isAmOrPm && isAmOrPm === this.amOrPm) return;   
		this.amOrPm = this.amOrPm === 'AM' ? 'PM' : 'AM';
		// this.amOrPm = this.amOrPm === 'AM' ? 'PM' : 'AM';
		this.spanAmPm.html(this.amOrPm);
		$(this.amButton[0].childNodes[0]).toggleClass('active-button-background', (this.amOrPm === 'AM'));
		$(this.pmButton[0].childNodes[0]).toggleClass('active-button-background', (this.amOrPm === 'PM'));
		$(this.amButton[0].childNodes[1]).toggleClass('active-button-text', (this.amOrPm === 'AM'));
		$(this.pmButton[0].childNodes[1]).toggleClass('active-button-text', (this.amOrPm === 'PM'));
	}

	// Set popover position
	ClockPicker.prototype.locate = function(){
		var element = this.element,
			popover = this.popover,
			offset = element.offset(),
			width = element.outerWidth(),
			height = element.outerHeight(),
			placement = this.options.placement,
			align = this.options.align,
			styles = {},
			self = this;

		popover.show();

		// Place the popover
		switch (placement) {
			case 'bottom':
				styles.top = offset.top + height;
				break;
			case 'right':
				styles.left = offset.left + width;
				break;
			case 'top':
				styles.top = offset.top - popover.outerHeight();
				break;
			case 'left':
				styles.left = offset.left - popover.outerWidth();
				break;
		}

		// Align the popover arrow
		switch (align) {
			case 'left':
				styles.left = offset.left;
				break;
			case 'right':
				styles.left = offset.left + width - popover.outerWidth();
				break;
			case 'top':
				styles.top = offset.top;
				break;
			case 'bottom':
				styles.top = offset.top + height - popover.outerHeight();
				break;
		}

		popover.css(styles);
	};

	// Show popover
	ClockPicker.prototype.show = function(e){
		// Not show again
		if (this.isShown) {
			return;
		}

		raiseCallback(this.options.beforeShow);

		var self = this;

		// Initialize
		if (! this.isAppended) {
			// Append popover to body
			$body = $(document.body).append(this.popover);

			// Reset position when resize
			$win.on('resize.clockpicker' + this.id, function(){
				if (self.isShown) {
					self.locate();
				}
			});

			//Add listeners
			this.AmPmButtons.on('click', function(e) {
				self.changeAmPm(e.currentTarget.innerHTML);
			});
			this.spanMinutes.on('click', function() {
				self.toggleView('minutes');
			});
			this.spanHours.on('click', function() {
				self.toggleView('hours');
			});
			this.spanAmPm.on('click', function() {
				self.changeAmPm();
			})

			this.isAppended = true;
		}

		//Get the time
		var value = new Date('1970 1 1 ' + this.input.prop('value') || this.options['default'] || '');
		this.hours = value.getHours() % 12;
		this.minutes = value.getMinutes();
		this.amOrPm = value.getHours() > 11 ? "AM" : "PM"; //purposefully wrong because we change it next line
		this.changeAmPm();
		// this.spanMinutes.html(leadingZero(this.minutes));

		// Toggle to hours view
		this.toggleView('hours');

		// Set position
		this.locate();

		this.isShown = true;

		// Hide when clicking or tabbing on any element except the clock, input
		$doc.on('click.clockpicker.' + this.id + ' focusin.clockpicker.' + this.id, function(e){
			var target = $(e.target);
			if (target.closest(self.popover).length === 0 &&
					target.closest(self.input).length === 0) {
				self.hide();
			}
		});

		// Hide when ESC is pressed
		$doc.on('keyup.clockpicker.' + this.id, function(e){
			if (e.keyCode === 27) {
				self.hide();
			}
		});

		raiseCallback(this.options.afterShow);
	};

	// Hide popover
	ClockPicker.prototype.hide = function(){
		raiseCallback(this.options.beforeHide);

		this.isShown = false;

		// Unbinding events on document
		$doc.off('click.clockpicker.' + this.id + ' focusin.clockpicker.' + this.id);
		$doc.off('keyup.clockpicker.' + this.id);

		this.popover.hide();

		raiseCallback(this.options.afterHide);
	};

	// Toggle to hours or minutes view
	ClockPicker.prototype.toggleView = function(view, delay){
		var raiseAfterHourSelect = false;
		if (view === 'minutes' && $(this.hoursView).css("visibility") === "visible") {
			raiseCallback(this.options.beforeHourSelect);
			raiseAfterHourSelect = true;
		}
		var isHours = view === 'hours',
			nextView = isHours ? this.hoursView : this.minutesView,
			hideView = isHours ? this.minutesView : this.hoursView;

		this.currentView = view;

		this.spanHours.toggleClass('text-primary', isHours);
		this.spanMinutes.toggleClass('text-primary', !isHours);

		// Let's make transitions
		hideView.addClass('lolliclock-dial-out');
		nextView.css('visibility', 'visible').removeClass('lolliclock-dial-out');

		// Reset clock hand
		this.resetClock(delay);

		// After transitions ended
		clearTimeout(this.toggleViewTimer);
		this.toggleViewTimer = setTimeout(function(){
			hideView.css('visibility', 'hidden');
		}, duration);

		//Add pointer to show you can click between ticks
		if (isHours) {
			this.plate.off(mousemoveEvent);
		} else {
			var self = this;
			this.plate.on(mousemoveEvent, function(e){
				var offset = self.plate.offset(),
					x0 = offset.left + dialRadius,
					y0 = offset.top + dialRadius,
					dx = e.pageX - x0,
					dy = e.pageY - y0,
					z = Math.sqrt(dx * dx + dy * dy);
					if (z > radius - tickRadius && z < radius + tickRadius) {
						$body.addClass('clockpicker-clickable');
					}else {
						$body.removeClass('clockpicker-clickable');
					}
			});
		}

		if (raiseAfterHourSelect) {
			raiseCallback(this.options.afterHourSelect);
		}
	};

	// Reset clock hand
	ClockPicker.prototype.resetClock = function(delay){
		var view = this.currentView,
			value = this[view],
			isHours = view === 'hours',
			unit = Math.PI / (isHours ? 6 : 30),
			radian = value * unit,
			x = Math.sin(radian) * radius,
			y = - Math.cos(radian) * radius,
			self = this;
		if (svgSupported && delay) {
			self.canvas.addClass('lolliclock-canvas-out');
			setTimeout(function(){
				self.canvas.removeClass('lolliclock-canvas-out');
				self.setHand(x, y);
			}, delay);
		} else {
			this.setHand(x, y);
		}
	};

	// Set clock hand to (x, y)
	ClockPicker.prototype.setHand = function(x, y){
		//Keep radians postive from 1 to 2pi
		var radian = Math.atan2(-x, y) + Math.PI,
			isHours = this.currentView === 'hours',
			unit = Math.PI / (isHours ? 6 : 30),
			z = Math.sqrt(x * x + y * y),
			options = this.options,
			value;

		// Get the round value
		value = Math.round(radian / unit);
		// Get the round radian
		radian = value * unit;

		// Correct the hours or minutes
		if (isHours) {
			if (value === 0) {
				value = 12;
			}
			this.fg.setAttribute('class', 'hidden');

		} else {
			var isOnNum = (value % 5 === 0);
			if (isOnNum) {
				this.fg.setAttribute('class', 'hidden');
			} else {
				this.fg.setAttribute('class', 'lolliclock-canvas-fg');
			}
			if (value === 60) {
				value = 0;
			}
		}
		
		// Once hours or minutes changed, vibrate the device
		if (this[this.currentView] !== value) {
			if (vibrate && this.options.vibrate) {
				// Do not vibrate too frequently
				if (! this.vibrateTimer) {
					navigator[vibrate](10);
					this.vibrateTimer = setTimeout($.proxy(function(){
						this.vibrateTimer = null;
					}, this), 100);
				}
			}
		}
		//TODO: Keep tens digit static for hours
		this[this.currentView] = value;
		function cleanupAnimation($obj) {
			$obj.on('webkitAnimationEnd animationend MSAnimationEnd oanimationend',
		    	function() {
			    	$oldTime.html(value) //only needed for -up transitions
			        $oldTime.removeClass("old-down old-up");
			        $newTime.removeClass("new-down new-up");
			        $oldTime.off('webkitAnimationEnd animationend MSAnimationEnd oanimationend');
	    	})
		};	
	 	if (isHours) {
		 	var $oldTime = $(this.spanHours[0].childNodes[0]);
		 	var $newTime = $(this.spanHours[0].childNodes[1]);
		} else {
		 	var $oldTime = $(this.spanMinutes[0].childNodes[0]);
		 	var $newTime = $(this.spanMinutes[0].childNodes[1]);
		 	value = leadingZero(value);
		}
		cleanupAnimation($oldTime);
 		if (value < (+$oldTime.html())) {
			$newTime.html($oldTime.html());
			$oldTime.html(value);
			$newTime.addClass('new-down');
			$oldTime.addClass('old-down');
		} else if (value > (+$oldTime.html())) {
	 		$newTime.html(value);
		 	$oldTime.addClass('old-up');
		 	$newTime.addClass('new-up');		
	 	}

		// If svg is not supported, just add an active class to the tick
		if (! svgSupported) {
			this[isHours ? 'hoursView' : 'minutesView'].find('.clockpicker-tick').each(function(){
				var tick = $(this);
				tick.toggleClass('active', value === + tick.html());
			});
			return;
		}

		this.g.insertBefore(this.hand, this.bearing);
		this.g.insertBefore(this.bg, this.fg);
		//TODO: put fg behind
		this.bg.setAttribute('class', 'lolliclock-canvas-bg');

		// Set clock hand and others' position
		var cx = Math.sin(radian) * radius,
			cy = - Math.cos(radian) * radius;
		this.hand.setAttribute('x2', Math.sin(radian) * (radius - tickRadius));
		this.hand.setAttribute('y2', - Math.cos(radian) * (radius - tickRadius));
		this.bg.setAttribute('cx', cx);
		this.bg.setAttribute('cy', cy);
		this.fg.setAttribute('cx', cx);
		this.fg.setAttribute('cy', cy);
	};

	// Hours and minutes are selected
	ClockPicker.prototype.done = function() {
		raiseCallback(this.options.beforeDone);
		this.hide();
		var last = this.input.prop('value'),
			value = this.hours + ':' + leadingZero(this.minutes) + " " + this.amOrPm;
		
		//Trigger change if date changed
		this.input.prop('value', value);
		if (value !== last) {
			this.input.triggerHandler('change');
			if (! this.isInput) {
				this.element.trigger('change');
			}
		}

		if (this.options.autoclose) {
			this.input.trigger('blur');
		}

		raiseCallback(this.options.afterDone);
	};

	// Remove clockpicker from input
	ClockPicker.prototype.remove = function() {
		this.element.removeData('clockpicker');
		this.input.off('focus.clockpicker click.clockpicker');
		if (this.isShown) {
			this.hide();
		}
		if (this.isAppended) {
			$win.off('resize.clockpicker' + this.id);
			this.popover.remove();
		}
	};

	ClockPicker.prototype.getData = function() {
		return new Date('1970 1 1 ' + this.input.prop('value', value));
	}

	// Extends $.fn.clockpicker
	$.fn.clockpicker = function(option){
		var args = Array.prototype.slice.call(arguments, 1);
		return this.each(function(){
			var $this = $(this),
				data = $this.data('clockpicker');
			if (! data) {
				var options = $.extend({}, ClockPicker.DEFAULTS, $this.data(), typeof option == 'object' && option);
				$this.data('clockpicker', new ClockPicker($this, options));
			} else {
				// Manual operatsions. show, hide, remove, e.g.
				if (typeof data[option] === 'function') {
					data[option].apply(data, args);
				}
			}
		});
	};
}());
