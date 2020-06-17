$(function() {

    let URL = "https://i5iz16898f.execute-api.us-east-2.amazonaws.com/default/date_concierge";

    $("#replan").click(function() {
        $("#replan").attr("disabled", "disabled");

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
            error: function(xhr, status, error) {
                var res = $.parseJSON(xhr.responseText);
                console.log(res.message);
                $('#new_spot_alert').text(res.message);
                $('#new_spot_alert').removeClass('d-none');
            },
            success: function(res) {
                console.log('SUCCESS!');
                console.log(res);
                $('#new_spot_alert').text('新しいスポットを追加しました。');
                $('#new_spot_alert').removeClass('d-none');
            }
        });
    });

    $('#search_spot').click(function() {
        console.log('search spot.');

        let genre_id = $('#search_spot_genre').val()
        let filter = $('#search_spot_filter').val()
        console.log(genre_id, filter)

        $.ajax({
            type: "GET",
            url: URL + '?genre_id=' + genre_id + '&filter=' + filter, 
            dataType: "json",
            error: function() {
                console.log('ERROR!');
            },
            success: function(res) {
                console.log('SUCCESS!');
                console.log(res);
                console.log(res.Items);

                let html = res.Items.reduce((s, item) => {
                    s += '<tr>'
                    s += '<td>' + item.spot_id + '</td>'
                    s += '<td>' + item.name + '</td>'
                    s += '<td>'
                    s += '<div id="edit_spot" accesskey="' + item.spot_id + '" class="btn btn-primary mr-3"><i class="fas fa-edit pr-3"></i>編集</div>'
                    s += '<div id="delete_spot" accesskey="' + item.spot_id + '" class="btn btn-error"><i class="fas fa-trash-alt pr-3"></i>削除</div>'
                    s += '</td>'
                    s += '</tr>';
                    return s
                }, '');
                $('#spot_table tbody').html(html);

                // スポット編集イベント
                $(document).on("click", "#edit_spot", function() {
                    console.log('edit spot.');

                    let spot_id = $(this)[0].accessKey;
                    console.log(spot_id);
                });

                // スポット削除イベント
                $(document).on('click', '#delete_spot', function() {
                    console.log('delete spot.');

                    let spot_id = $(this)[0].accessKey;
                    console.log(spot_id);

                    if (confirm('本当に削除しますか？')) {
                        console.log('delete!');

                        let data = {
                            spot_id: spot_id
                        };

                        console.log(data);

                        $.ajax({
                            url: URL,
                            type: "DELETE",
                            dataType: "json",
                            data: JSON.stringify(data),
                            contentType: 'application/json',
                            error: function(xhr, status, error) {
                                console.log('ERROR!');
                            },
                            success: function(res) {
                                console.log('SUCCESS!');
                            }
                        });
                        return true;
                    }
                    else {
                        return false;
                    }
                });
            }
        });
    });
});