$(function() {

    let URL = "https://i5iz16898f.execute-api.us-east-2.amazonaws.com/default/date_concierge";

    $("#replan").click(function() {
        $("#replan").attr("disabled", "disabled");
        console.log('call ajax.');
        $.ajax({
            type: "GET",
            url: URL + '/plan', 
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

    $("#new_spot_id").focusout(function(){
        console.log('new_spot_id focusout');
    });

    $('#new_spot').click(function(){
        var data = {
            spot_id:  $('#new_spot_id').val(),
            genre_id: $('#new_spot_genre').val(),
            name:     $('#new_spot_name').val()
        };
        
        console.log(data);

        $.ajax({
            url: URL,
            type: "POST",
            dataType: "json",
            data: JSON.stringify(data),
            contentType: 'application/json',
            error: function() {
                console.log('ERROR!');
            },
            success: function(res) {
                console.log('SUCCESS!')
                console.log(res);
                $('#new_spot_alert').text('新しいスポットを追加しました。');
                $('#new_spot_alert').removeClass('d-none');
            }
        });
    });

});