# Lolliclock
A material design timepicker based on clockpicker

*No longer maintained* I'll still accept PRs. The javascript world has changed a lot in the last year! ES2015, npm3, react, webpack, and css-modules are looking like the new rulers and it just doesn't make sense to maintain a fun little project like this. For a similar component, please see the time picker in material-ui.  

![Autoclose false](https://github.com/Casear/lolliclock/blob/master/assets/lolliclock.PNG)
![Autoclose true](https://github.com/Casear/lolliclock/blob/master/assets/lolliclock_autoclose.PNG)
![hour24 true](https://github.com/Casear/lolliclock/blob/master/assets/lolliclock_24hours.png)


#Basics
Internals are based off clockpicker, with a million tiny UX changes.

#Usage
1. Install jquery
2. Add the lolliclock .css and .js to your project.
3. Extend your input field with the `.lolliclock` method including arguments:
```
<input id="pick-a-time"></input>
<script>
	$('#pick-a-time').lolliclock({autoclose:true});
</script>
```
4. Optional: Run your validation and server scripts on the auto-generated datetime field, which is the name or id of your input field with a "-export" suffix
```
document.getElementById('pick-a-time-export')
```

#Features
###autoclose
False (default) includes the Cancel/OK buttons at the bottom.
###hour24
False (default) change to 24 hours system.

###datetime field
Most backend folks like to save times as dates because they're a breeze to work with.
This timepicker creates a hidden input which is dynamically named by putting '-export' at the end of your input field.
Now you can use realtime validation or push directly to a database without first converting to a JS date object.
If your input has a `name` or `Id` of `pick-a-time`, run logic against `pick-a-time-export`

###animations
It looks pretty great

#Versions
0.2.0 - Fixed IE/Safari date bug, added meteor pkg, added 'change' trigger on input field
0.1.0 - Initial commit

#License
MIT - fork away!

