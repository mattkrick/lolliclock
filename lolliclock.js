$('#clockpicker').clockpicker();

$(function() {
  var tickNum = $('<div class="lolliclock-tick"></div>');
  var clockFace = $("#lolliclock-hourTicks");
  radian = 1 / 6 * Math.PI;
  radius = 70;
  dialRadius = 100;
  for (i = 1; i < 13; i++) {
    tick = tickNum.clone();
    radian = i / 6 * Math.PI;
    tick.css({
      left: dialRadius + Math.sin(radian) * radius - 3,
      top: dialRadius - Math.cos(radian) * radius + 132
    });
    tick.html(i);
    clockFace.append(tick);
  }
  // $( ".lolliclock-tick" ).bind( "click", function() {
  //   $(;
  // });
    // Set clock hand to (x, y)
  ClockPicker.prototype.setHand = function(x, y, roundBy5, dragging){
    var radian = Math.atan2(x, - y),
      isHours = this.currentView === 'hours',
      unit = Math.PI / (isHours || roundBy5 ? 6 : 30),
      z = Math.sqrt(x * x + y * y),
      options = this.options,
      inner = isHours && z < (outerRadius + innerRadius) / 2,
      radius = inner ? innerRadius : outerRadius,
      value;

    // Radian should in range [0, 2PI]
    if (radian < 0) {
      radian = Math.PI * 2 + radian;
    }

    // Get the round value
    value = Math.round(radian / unit);

    // Get the round radian
    radian = value * unit;

    // Correct the hours or minutes
    if (options.twelvehour) {
      if (isHours) {
        if (value === 0) {
          value = 12;
        }
      } else {
        if (roundBy5) {
          value *= 5;
        }
        if (value === 60) {
          value = 0;
        }
      }
    }

    this[this.currentView] = value;
    this[isHours ? 'spanHours' : 'spanMinutes'].html(leadingZero(value));


    // Place clock hand at the top when dragging
    if (dragging || (! isHours && value % 5)) {
      this.g.insertBefore(this.hand, this.bearing);
      this.g.insertBefore(this.bg, this.fg);
      this.bg.setAttribute('class', 'clockpicker-canvas-bg clockpicker-canvas-bg-trans');
    } else {
      // Or place it at the bottom
      this.g.insertBefore(this.hand, this.bg);
      this.g.insertBefore(this.fg, this.bg);
      this.bg.setAttribute('class', 'clockpicker-canvas-bg');
    }

    // Set clock hand and others' position
    var cx = Math.sin(radian) * radius,
      cy = - Math.cos(radian) * radius;
    this.hand.setAttribute('x2', cx);
    this.hand.setAttribute('y2', cy);
    this.bg.setAttribute('cx', cx);
    this.bg.setAttribute('cy', cy);
    this.fg.setAttribute('cx', cx);
    this.fg.setAttribute('cy', cy);
  };
});