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
});