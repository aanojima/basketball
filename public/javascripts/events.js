$(document).ready(function(){
	// TODO
	$("#play-button").click(function(e){
		window.PLAY = !window.PLAY;
		if (window.PLAY){
			// Pause
			$("#play-button").prop("src", "public/images/pause-button.png");
			$("#play-label").text("PAUSE");
		}
		else {
			// Play
			$("#play-button").prop("src", "public/images/play-button.jpg");
			$("#play-label").text("PLAY");
		}
	});

	$("#reset-button").click(function(e){
		window.PLAY = false;
		$("#play-button").prop("src", "public/images/play-button.jpg");
		$("#play-label").text("PLAY");
		$(document).trigger("reset");
	});

	$("#ball-icon").click(function(e){
		$(document).trigger("ballfocus");
	});

	$(".float-input").keypress(function(e){
		if ((e.which != 46 || $(this).val().indexOf('.') != -1) && (e.which < 48 || e.which > 57) || (e.which == 46 && $(this).caret().start == 0)){
			if (e.which == 45 && $(this).val().indexOf('-') == -1){
				return;
			}
			e.preventDefault();
		}
	});

	$(".float-input").keyup(function(e){
		if ($(this).val().indexOf('.') == 0){
			$(this).val($(this).val().substring(1));
		}
		if ($(this).val().lastIndexOf('-') > 0){
			var valid = $(this).val().replace('-', '')
			$(this).val(valid);
		}
	});

	$("#set-position-button").on('click', function(e){
		var x = isNaN($("#x-position").val()) ? 0 : $("#x-position").val();
		var y = isNaN($("#y-position").val()) ? 0 : $("#y-position").val();
		var z = isNaN($("#z-position").val()) ? 0 : $("#z-position").val();

		$(document).trigger("setposition", [FEET(x), FEET(y), FEET(z)]);
	});

	$("#set-velocity-button").click(function(e){
		var x = isNaN($("#x-velocity").val()) ? 0 : $("#x-velocity").val();
		var y = isNaN($("#y-velocity").val()) ? 0 : $("#y-velocity").val();
		var z = isNaN($("#z-velocity").val()) ? 0 : $("#z-velocity").val();
		
		$(document).trigger("setvelocity", [FEET(x), FEET(y), FEET(z)]);
	});

	$(".velocity-input").on("change", function(event){
		$(this).next().val($(this).val());
	});
});