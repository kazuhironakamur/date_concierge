$(function() {

    var URL = "https://i5iz16898f.execute-api.us-east-2.amazonaws.com/default/date_concierge/plan";

    $("#replan").click(function() {
        $("#replan").attr("disabled", "disabled");
        console.log('call ajax.');
        $.ajax({
            type: "GET",
            url: URL, 
            dataType: "json",
            error: function() {
                console.log('ERROR!');
                $("#replan").removeAttr("disabled");
            },
            success: function(res) {
                console.log('SUCCESS!');
                console.log(res);

                $('#main_plan').val(res['main']['name']);
                $('#lunch_plan').val(res['lunch']['name']);
                $('#dinner_plan').val(res['dinner']['name']);
                $('#tea_plan').val(res['tea']['name']);
                $('#alcohol_plan').val(res['alcohol']['name']);
                
                $("#replan").removeAttr("disabled");
            }
        });
    });
});